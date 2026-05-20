INSERT IGNORE INTO `blog_posts` (
  `title`,
  `slug`,
  `excerpt`,
  `contentHtml`,
  `featuredImageUrl`,
  `featuredImageAlt`,
  `status`,
  `metaTitle`,
  `metaDescription`,
  `ogTitle`,
  `ogDescription`,
  `ogImageUrl`,
  `publishedAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  `title`,
  'us-passes-new-law-helping-consumers-challenge-negative-items-2',
  `excerpt`,
  `contentHtml`,
  `featuredImageUrl`,
  `featuredImageAlt`,
  'published',
  `metaTitle`,
  `metaDescription`,
  `ogTitle`,
  `ogDescription`,
  `ogImageUrl`,
  COALESCE(`publishedAt`, NOW()),
  NOW(),
  NOW()
FROM `blog_posts`
WHERE `slug` = 'us-passes-new-law-helping-consumers-challenge-negative-items'
LIMIT 1;

INSERT IGNORE INTO `blog_posts` (
  `title`,
  `slug`,
  `excerpt`,
  `contentHtml`,
  `featuredImageUrl`,
  `featuredImageAlt`,
  `status`,
  `metaTitle`,
  `metaDescription`,
  `ogTitle`,
  `ogDescription`,
  `ogImageUrl`,
  `publishedAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  `title`,
  'us-passes-new-law-helping-consumers-challenge-negative-items-3',
  `excerpt`,
  `contentHtml`,
  `featuredImageUrl`,
  `featuredImageAlt`,
  'published',
  `metaTitle`,
  `metaDescription`,
  `ogTitle`,
  `ogDescription`,
  `ogImageUrl`,
  COALESCE(`publishedAt`, NOW()),
  NOW(),
  NOW()
FROM `blog_posts`
WHERE `slug` = 'us-passes-new-law-helping-consumers-challenge-negative-items'
LIMIT 1;
