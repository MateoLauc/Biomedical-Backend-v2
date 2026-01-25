import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../../config/env";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  role: "super_admin" | "admin" | "customer";
  emailVerified: boolean;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  tokenId: string;
}

export async function generateAccessToken(payload: AccessTokenPayload): Promise<string> {
  const jwt = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + env.JWT_ACCESS_TTL_SECONDS)
    .sign(accessSecret);

  return jwt;
}

export async function generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const jwt = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + env.JWT_REFRESH_TTL_SECONDS)
    .sign(refreshSecret);

  return jwt;
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as unknown as RefreshTokenPayload;
}
