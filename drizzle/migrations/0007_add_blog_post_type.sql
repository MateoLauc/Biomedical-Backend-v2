CREATE TYPE "public"."blog_post_type" AS ENUM('press_releases', 'videos', 'news_article');--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "type" "blog_post_type" DEFAULT 'news_article' NOT NULL;--> statement-breakpoint
CREATE INDEX "blog_posts_type_idx" ON "blog_posts" USING btree ("type");
