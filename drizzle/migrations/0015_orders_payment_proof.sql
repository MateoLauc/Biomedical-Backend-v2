ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_proof_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_proof_file_name" text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DEFAULT 'bank_transfer';
