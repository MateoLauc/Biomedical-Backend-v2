import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["super_admin", "admin", "customer"]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "not_submitted",
  "pending",
  "approved",
  "rejected"
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded"
]);

export const jobStatusEnum = pgEnum("job_status", ["open", "closed"]);

export const blogPostStatusEnum = pgEnum("blog_post_status", ["draft", "published"]);

export const blogPostTypeEnum = pgEnum("blog_post_type", ["press_releases", "videos", "news_article"]);

export const credentialsSubmissionStatusEnum = pgEnum("credentials_submission_status", ["draft", "submitted"]);

