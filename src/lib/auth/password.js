import argon2 from "argon2";
const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4
};
export async function hashPassword(plainPassword) {
    return argon2.hash(plainPassword, ARGON2_OPTIONS);
}
export async function verifyPassword(plainPassword, hash) {
    try {
        return await argon2.verify(hash, plainPassword);
    }
    catch {
        return false;
    }
}
