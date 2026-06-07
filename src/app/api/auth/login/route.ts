import { NextResponse } from "next/server";
import { z } from "zod";
import * as argon2 from "argon2";
import { db } from "@/db";
import { users, refreshTokens, emailOtps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAccessToken, setAuthCookies } from "@/lib/auth";
import crypto from "crypto";
import { sendOTP } from "@/lib/brevo";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const userRecords = await db.select().from(users).where(eq(users.email, email));
    if (userRecords.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = userRecords[0];

    if (!user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Always require OTP for every login attempt
    const otp = generateOTP();
    const codeHash = crypto.createHash("sha256").update(otp).digest("hex");
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await db.insert(emailOtps).values({
      email,
      userId: user.id,
      purpose: "verification",
      codeHash,
      expiresAt,
    });

    await sendOTP(email, otp);

    return NextResponse.json({ message: "OTP sent to email", requireOtp: true }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
