-- Set checkout base price to $200.
INSERT INTO `settings` (`key`, `value`, `group`, `updatedAt`)
VALUES ('stripe_price_per_review', '20000', 'stripe', NOW(3))
ON DUPLICATE KEY UPDATE
  `value` = '20000',
  `group` = 'stripe',
  `updatedAt` = NOW(3);

-- Keep existing checkout CMS copy aligned when it still contains the previous price text.
UPDATE `page_content`
SET `content` = JSON_SET(
  `content`,
  '$.headingLine2',
  REPLACE(REPLACE(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.headingLine2')), '$100', '$200'), '$400', '$200')
)
WHERE `page` = 'checkout'
  AND `section` = 'hero'
  AND JSON_CONTAINS_PATH(`content`, 'one', '$.headingLine2')
  AND (
    JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.headingLine2')) LIKE '%$100%'
    OR JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.headingLine2')) LIKE '%$400%'
  );

UPDATE `page_content`
SET `content` = JSON_SET(
  `content`,
  '$.steps[2].desc',
  REPLACE(REPLACE(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.steps[2].desc')), '$100', '$200'), '$400', '$200')
)
WHERE `page` = 'checkout'
  AND `section` = 'processSteps'
  AND JSON_CONTAINS_PATH(`content`, 'one', '$.steps[2].desc')
  AND (
    JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.steps[2].desc')) LIKE '%$100%'
    OR JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.steps[2].desc')) LIKE '%$400%'
  );

UPDATE `page_content`
SET `content` = JSON_SET(
  `content`,
  '$.faqs[2].a',
  REPLACE(REPLACE(JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.faqs[2].a')), '$100', '$200'), '$400', '$200')
)
WHERE `page` = 'checkout'
  AND `section` = 'faq'
  AND JSON_CONTAINS_PATH(`content`, 'one', '$.faqs[2].a')
  AND (
    JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.faqs[2].a')) LIKE '%$100%'
    OR JSON_UNQUOTE(JSON_EXTRACT(`content`, '$.faqs[2].a')) LIKE '%$400%'
  );

UPDATE `page_content`
SET `content` = JSON_SET(
  `content`,
  '$.pricePerReview',
  200,
  '$.pricingInfo',
  'Flat fee: $200/review'
)
WHERE `page` = 'checkout'
  AND `section` = 'submissionForm';
