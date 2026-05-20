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
  'us-passes-new-law-helping-consumers-challenge-negative-items-11',
  `excerpt`,
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(`contentHtml`, 'href="https://creditremovers.com/checkout"', 'href="https://creditremovers.com"'),
        'href=''https://creditremovers.com/checkout''',
        'href=''https://creditremovers.com'''
      ),
      'href="/checkout"',
      'href="https://creditremovers.com"'
    ),
    'href=''/checkout''',
    'href=''https://creditremovers.com'''
  ),
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
  'us-passes-new-law-helping-consumers-challenge-negative-items-22',
  `excerpt`,
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(`contentHtml`, 'href="https://creditremovers.com/checkout"', 'href="https://creditremovers.com"'),
        'href=''https://creditremovers.com/checkout''',
        'href=''https://creditremovers.com'''
      ),
      'href="/checkout"',
      'href="https://creditremovers.com"'
    ),
    'href=''/checkout''',
    'href=''https://creditremovers.com'''
  ),
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
WHERE `slug` = 'us-passes-new-law-helping-consumers-challenge-negative-items-2'
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
  'us-passes-new-law-helping-consumers-challenge-negative-items-33',
  `excerpt`,
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(`contentHtml`, 'href="https://creditremovers.com/checkout"', 'href="https://creditremovers.com"'),
        'href=''https://creditremovers.com/checkout''',
        'href=''https://creditremovers.com'''
      ),
      'href="/checkout"',
      'href="https://creditremovers.com"'
    ),
    'href=''/checkout''',
    'href=''https://creditremovers.com'''
  ),
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
WHERE `slug` = 'us-passes-new-law-helping-consumers-challenge-negative-items-3'
LIMIT 1;
