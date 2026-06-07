import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users, emailOtps, refreshTokens } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAccessToken, setAuthCookies } from "@/lib/auth";
import crypto from "crypto";

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    const userRecords = await db.select().from(users).where(eq(users.email, email));
    if (userRecords.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const user = userRecords[0];

    const codeHash = crypto.createHash("sha256").update(otp).digest("hex");

    const otps = await db.select()
      .from(emailOtps)
      .where(and(eq(emailOtps.email, email), eq(emailOtps.purpose, "verification")))
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);

    if (otps.length === 0) {
      return NextResponse.json({ error: "No OTP found" }, { status: 400 });
    }

    const latestOtp = otps[0];

    if (latestOtp.consumedAt) {
      return NextResponse.json({ error: "OTP already used" }, { status: 400 });
    }

    if (new Date() > latestOtp.expiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    if (latestOtp.attemptCount >= 5) {
      return NextResponse.json({ error: "Max verification attempts exceeded. Please request a new code." }, { status: 400 });
    }

    if (latestOtp.codeHash !== codeHash) {
      await db.update(emailOtps)
        .set({ attemptCount: latestOtp.attemptCount + 1 })
        .where(eq(emailOtps.id, latestOtp.id));
      
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    await db.update(emailOtps)
      .set({ consumedAt: new Date() })
      .where(eq(emailOtps.id, latestOtp.id));

    if (!user.emailVerifiedAt) {
      await db.update(users)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const accessToken = await createAccessToken(user.id, user.role);

    const refreshTokenPlain = nanoid(32);
    const tokenHash = crypto.createHash("sha256").update(refreshTokenPlain).digest("hex");
    const familyId = nanoid();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    });

    await setAuthCookies(accessToken, refreshTokenPlain);

    return NextResponse.json({ message: "OTP verified, logged in" }, { status: 200 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
