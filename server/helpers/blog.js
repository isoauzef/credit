function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220) || "blog-post";
}

function sanitizeBlogHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<\/?(object|embed|form|input|button|textarea|select|option|meta|link)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, "")
    .trim();
}

function cleanString(value, maxLength) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeStatus(value) {
  return value === "published" ? "published" : "draft";
}

function buildCanonicalPath(slug) {
  return `/blog/${slug}`;
}

function serializeBlogPost(post, req) {
  if (!post) return null;
  const canonicalPath = buildCanonicalPath(post.slug);
  const host = req ? `${req.protocol}://${req.get("host")}` : "";
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentHtml: post.contentHtml,
    featuredImageUrl: post.featuredImageUrl,
    featuredImageAlt: post.featuredImageAlt,
    status: post.status,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    ogImageUrl: post.ogImageUrl,
    canonicalPath,
    canonicalUrl: host ? `${host}${canonicalPath}` : canonicalPath,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function buildBlogData(input = {}) {
  const title = cleanString(input.title, 255);
  const slug = slugify(input.slug || title);
  const status = normalizeStatus(input.status);
  const now = new Date();

  return {
    title,
    slug,
    excerpt: cleanString(input.excerpt, 5000),
    contentHtml: sanitizeBlogHtml(input.contentHtml || ""),
    featuredImageUrl: cleanString(input.featuredImageUrl, 1000),
    featuredImageAlt: cleanString(input.featuredImageAlt, 255),
    status,
    metaTitle: cleanString(input.metaTitle, 255),
    metaDescription: cleanString(input.metaDescription, 500),
    ogTitle: cleanString(input.ogTitle, 255),
    ogDescription: cleanString(input.ogDescription, 500),
    ogImageUrl: cleanString(input.ogImageUrl, 1000),
    publishedAt: status === "published" ? (input.publishedAt ? new Date(input.publishedAt) : now) : null,
  };
}

module.exports = {
  buildBlogData,
  buildCanonicalPath,
  cleanString,
  sanitizeBlogHtml,
  serializeBlogPost,
  slugify,
};
