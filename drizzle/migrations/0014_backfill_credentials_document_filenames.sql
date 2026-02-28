-- Backfill file_name for credential documents that have UUID or no extension.
-- Run with: npm run db:migrate (or execute this SQL in your DB client).
-- Uses Cloudinary URL: /raw/upload = PDF, /image/upload = image.
UPDATE professional_credentials_documents
SET file_name = CASE
  WHEN file_url LIKE '%/raw/upload%' THEN 'document.pdf'
  ELSE 'document.jpg'
END
WHERE file_name NOT LIKE '%.%'
   OR file_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
