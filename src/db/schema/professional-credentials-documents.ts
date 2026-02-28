import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { professionalCredentialsSubmissions } from "./professional-credentials-submissions.js";

export const professionalCredentialsDocuments = pgTable(
  "professional_credentials_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => professionalCredentialsSubmissions.id, { onDelete: "cascade" }),

    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    submissionIdIdx: index("professional_credentials_documents_submission_id_idx").on(t.submissionId)
  })
);
