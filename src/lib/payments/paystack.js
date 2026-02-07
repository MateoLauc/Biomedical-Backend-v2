import crypto from "node:crypto";
import { env } from "../../config/env";
import { badRequest } from "../http-errors";
const PAYSTACK_BASE_URL = "https://api.paystack.co";
/**
 * Verify Paystack webhook signature using HMAC SHA512
 */
export function verifyPaystackWebhook(payload, signature) {
    if (!env.PAYSTACK_WEBHOOK_SECRET) {
        throw new Error("PAYSTACK_WEBHOOK_SECRET is not configured");
    }
    const hash = crypto.createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET).update(payload).digest("hex");
    return hash === signature;
}
/**
 * Initialize a Paystack payment transaction
 */
export async function initializePayment(request) {
    if (!env.PAYSTACK_SECRET_KEY) {
        throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: request.email,
            amount: request.amount,
            reference: request.reference,
            callback_url: request.callback_url,
            metadata: request.metadata
        })
    });
    if (!response.ok) {
        const error = (await response.json().catch(() => ({ message: "Failed to initialize payment" })));
        throw badRequest(error.message || "Failed to initialize payment with Paystack.");
    }
    const data = (await response.json());
    if (!data.status) {
        throw badRequest(data.message || "Failed to initialize payment.");
    }
    return data;
}
/**
 * Verify a Paystack payment transaction
 */
export async function verifyPayment(reference) {
    if (!env.PAYSTACK_SECRET_KEY) {
        throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const error = (await response.json().catch(() => ({ message: "Failed to verify payment" })));
        throw badRequest(error.message || "Failed to verify payment with Paystack.");
    }
    const data = (await response.json());
    if (!data.status) {
        throw badRequest(data.message || "Payment verification failed.");
    }
    return data;
}
