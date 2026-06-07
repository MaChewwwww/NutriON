import { NextResponse } from "next/server";
import { z } from "zod";
import * as argon2 from "argon2";
import { db } from "@/db";
import { users, emailOtps } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendOTP } from "@/lib/brevo";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = registerSchema.parse(body);

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }

    const passwordHash = await argon2.hash(password);

    const [insertResult] = await db.insert(users).values({
      email,
      passwordHash,
      role: "user",
      emailVerifiedAt: null,
    });
    
    const userId = insertResult.insertId;

    const otp = generateOTP();
    const codeHash = crypto.createHash("sha256").update(otp).digest("hex");
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await db.insert(emailOtps).values({
      email,
      userId,
      purpose: "verification",
      codeHash,
      expiresAt,
    });

    await sendOTP(email, otp);

    return NextResponse.json({ message: "Registration successful. OTP sent.", requireOtp: true }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
