import crypto from "node:crypto";
import { env } from "../../config/env";
import { badRequest } from "../http-errors";

export interface PaystackInitializeRequest {
  email: string;
  amount: number; // Amount in kobo (smallest currency unit)
  reference: string; // Unique transaction reference
  callback_url?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    log: unknown;
    fees: number;
    fees_split: unknown;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: unknown;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: unknown;
    split: unknown;
    order_id: number | null;
    paidAt: string | null;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: unknown;
    source: unknown;
    fees_breakdown: unknown;
  };
}

const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Verify Paystack webhook signature using HMAC SHA512
 */
export function verifyPaystackWebhook(payload: string, signature: string): boolean {
  if (!env.PAYSTACK_WEBHOOK_SECRET) {
    throw new Error("PAYSTACK_WEBHOOK_SECRET is not configured");
  }

  const hash = crypto.createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET).update(payload).digest("hex");
  return hash === signature;
}

/**
 * Initialize a Paystack payment transaction
 */
export async function initializePayment(request: PaystackInitializeRequest): Promise<PaystackInitializeResponse> {
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
    const error = (await response.json().catch(() => ({ message: "Failed to initialize payment" }))) as { message?: string };
    throw badRequest(error.message || "Failed to initialize payment with Paystack.");
  }

  const data = (await response.json()) as PaystackInitializeResponse;

  if (!data.status) {
    throw badRequest(data.message || "Failed to initialize payment.");
  }

  return data;
}

/**
 * Verify a Paystack payment transaction
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
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
    const error = (await response.json().catch(() => ({ message: "Failed to verify payment" }))) as { message?: string };
    throw badRequest(error.message || "Failed to verify payment with Paystack.");
  }

  const data = (await response.json()) as PaystackVerifyResponse;

  if (!data.status) {
    throw badRequest(data.message || "Payment verification failed.");
  }

  return data;
}
