import { SignJWT, jwtVerify } from "jose";
import { env } from "../../config/env";
const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
export async function generateAccessToken(payload) {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + env.JWT_ACCESS_TTL_SECONDS)
        .sign(accessSecret);
    return jwt;
}
export async function generateRefreshToken(payload) {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + env.JWT_REFRESH_TTL_SECONDS)
        .sign(refreshSecret);
    return jwt;
}
export async function verifyAccessToken(token) {
    const { payload } = await jwtVerify(token, accessSecret);
    return payload;
}
export async function verifyRefreshToken(token) {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload;
}
