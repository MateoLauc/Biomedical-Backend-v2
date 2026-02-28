import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { credentialsSubmissionStatusEnum } from "./enums.js";
import { users } from "./users.js";

export const professionalCredentialsSubmissions = pgTable(
  "professional_credentials_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    businessName: text("business_name"),
    registrationNumber: text("registration_number"),
    businessAddress: text("business_address"),
    businessType: text("business_type"),

    authorizedPersonName: text("authorized_person_name"),
    authorizedPersonTitle: text("authorized_person_title"),
    authorizedPersonEmail: text("authorized_person_email"),
    authorizedPersonPhone: text("authorized_person_phone"),

    signatureImageUrl: text("signature_image_url"),

    formData: jsonb("form_data"),

    status: credentialsSubmissionStatusEnum("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userIdIdx: index("professional_credentials_submissions_user_id_idx").on(t.userId),
    userIdUq: uniqueIndex("professional_credentials_submissions_user_id_uq").on(t.userId)
  })
);
