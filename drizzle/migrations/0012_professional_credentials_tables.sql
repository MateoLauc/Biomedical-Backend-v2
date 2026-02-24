-- Professional credentials submission status enum
DO $$ BEGIN
  CREATE TYPE "credentials_submission_status" AS ENUM('draft', 'submitted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- One submission per user (draft or submitted)
CREATE TABLE IF NOT EXISTS "professional_credentials_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "business_name" text,
  "registration_number" text,
  "business_address" text,
  "business_type" text,
  "authorized_person_name" text,
  "authorized_person_title" text,
  "authorized_person_email" text,
  "authorized_person_phone" text,
  "signature_image_url" text,
  "status" "credentials_submission_status" DEFAULT 'draft' NOT NULL,
  "submitted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "professional_credentials_submissions_user_id_uq" ON "professional_credentials_submissions" ("user_id");
CREATE INDEX IF NOT EXISTS "professional_credentials_submissions_user_id_idx" ON "professional_credentials_submissions" ("user_id");

-- Multiple documents per submission (free-form)
CREATE TABLE IF NOT EXISTS "professional_credentials_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "submission_id" uuid NOT NULL REFERENCES "professional_credentials_submissions"("id") ON DELETE CASCADE,
  "file_url" text NOT NULL,
  "file_name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "professional_credentials_documents_submission_id_idx" ON "professional_credentials_documents" ("submission_id");
