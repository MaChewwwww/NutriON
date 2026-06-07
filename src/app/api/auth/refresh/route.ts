import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { refreshTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAccessToken, setAuthCookies } from "@/lib/auth";
import crypto from "crypto";
import { nanoid } from "nanoid";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nutrion_refresh")?.value;

    if (!token) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    const tokenRecords = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
    
    if (tokenRecords.length === 0) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const tokenRecord = tokenRecords[0];

    if (tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
      return NextResponse.json({ error: "Token revoked or expired" }, { status: 401 });
    }

    const userRecords = await db.select().from(users).where(eq(users.id, tokenRecord.userId));
    if (userRecords.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const user = userRecords[0];

    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, tokenRecord.id));

    const accessToken = await createAccessToken(user.id, user.role);
    const newRefreshTokenPlain = nanoid(32);
    const newTokenHash = crypto.createHash("sha256").update(newRefreshTokenPlain).digest("hex");
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newTokenHash,
      familyId: tokenRecord.familyId,
      expiresAt,
    });

    await setAuthCookies(accessToken, newRefreshTokenPlain);

    return NextResponse.json({ message: "Session refreshed" }, { status: 200 });
  } catch (error) {
    console.error("Refresh Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
