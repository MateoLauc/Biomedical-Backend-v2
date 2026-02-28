-- Extended form data for professional credentials (Part A/B/C/D from Figma)
ALTER TABLE "professional_credentials_submissions"
  ADD COLUMN IF NOT EXISTS "form_data" jsonb;
