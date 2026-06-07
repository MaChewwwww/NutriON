import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function createAccessToken(userId: number, role: string) {
  const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
  const ttl = parseInt(process.env.ACCESS_TOKEN_TTL_MINUTES || "15");

  const jwt = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}m`)
    .sign(secret);

  return jwt;
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set("nutrion_access", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 mins
  });

  cookieStore.set("nutrion_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/refresh",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("nutrion_access");
  cookieStore.delete("nutrion_refresh");
}

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("nutrion_access")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as number,
      role: payload.role as string,
    };
  } catch (err) {
    return null;
  }
}
