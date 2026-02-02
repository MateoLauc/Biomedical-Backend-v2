export type BlogPostStatus = "draft" | "published";

export type BlogPostType = "press_releases" | "videos" | "news_article";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  body: string;
  imageUrl: string | null;
  type: BlogPostType;
  status: BlogPostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateBlogPostInput = {
  title: string;
  slug?: string;
  body: string;
  imageUrl?: string;
  type?: BlogPostType;
  status?: BlogPostStatus;
};

export type UpdateBlogPostInput = {
  title?: string;
  slug?: string;
  body?: string;
  imageUrl?: string;
  type?: BlogPostType;
  status?: BlogPostStatus;
};

export type ListBlogPostsQuery = {
  type?: BlogPostType;
  status?: BlogPostStatus;
  page?: number;
  limit?: number;
};
