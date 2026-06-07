import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users, emailOtps } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendOTP } from "@/lib/brevo";

const resendSchema = z.object({
  email: z.string().email(),
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);

    const userRecords = await db.select().from(users).where(eq(users.email, email));
    if (userRecords.length === 0) {
      // Silently succeed to prevent user enumeration
      return NextResponse.json({ message: "OTP code resent if account exists." }, { status: 200 });
    }

    const user = userRecords[0];
    const otp = generateOTP();
    const codeHash = crypto.createHash("sha256").update(otp).digest("hex");
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Write new OTP record
    await db.insert(emailOtps).values({
      email,
      userId: user.id,
      purpose: "verification",
      codeHash,
      expiresAt,
    });

    // Send code using Brevo
    await sendOTP(email, otp);

    return NextResponse.json({ message: "A fresh verification code has been sent." }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    console.error("Resend OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
