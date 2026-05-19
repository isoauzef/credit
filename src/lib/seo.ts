function ensureMeta(selector: string, create: () => HTMLMetaElement) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = create();
    document.head.appendChild(tag);
  }
  return tag;
}

export function setPageSeo({
  title,
  description,
  canonicalUrl,
  imageUrl,
  type = "website",
}: {
  title: string;
  description?: string | null;
  canonicalUrl?: string | null;
  imageUrl?: string | null;
  type?: "website" | "article";
}) {
  document.title = title;

  const setName = (name: string, content?: string | null) => {
    if (!content) return;
    const tag = ensureMeta(`meta[name="${name}"]`, () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      return meta;
    });
    tag.setAttribute("content", content);
  };

  const setProperty = (property: string, content?: string | null) => {
    if (!content) return;
    const tag = ensureMeta(`meta[property="${property}"]`, () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      return meta;
    });
    tag.setAttribute("content", content);
  };

  setName("description", description);
  setProperty("og:type", type);
  setProperty("og:url", canonicalUrl);
  setProperty("og:title", title);
  setProperty("og:description", description);
  setProperty("og:image", imageUrl);
  setName("twitter:card", "summary_large_image");
  setName("twitter:title", title);
  setName("twitter:description", description);
  setName("twitter:image", imageUrl);

  if (canonicalUrl) {
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }
}
