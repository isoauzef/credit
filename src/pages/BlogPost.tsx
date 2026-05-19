import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import svgPaths from "../imports/svg-6ltl2tuh8w";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { setPageSeo } from "../lib/seo";

type BlogPostDetail = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentHtml: string;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl: string;
  publishedAt?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Recently updated";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError("");
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(async (resp) => {
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.message || "Blog post not found.");
        setPost(data);
        setPageSeo({
          title: data.metaTitle || data.ogTitle || data.title,
          description: data.metaDescription || data.ogDescription || data.excerpt,
          canonicalUrl: data.canonicalUrl,
          imageUrl: data.ogImageUrl || data.featuredImageUrl,
          type: "article",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Blog post not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navigation />
      <main id="main-content" className="pt-24">
        {loading ? (
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-20 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading article...
          </div>
        ) : error || !post ? (
          <div className="mx-auto max-w-3xl px-4 py-20">
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">{error || "Blog post not found."}</div>
            <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1e5a8a]">
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
          </div>
        ) : (
          <>
            <article>
              <header className="bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                  <Link to="/blog" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                    <ArrowLeft className="h-4 w-4" />
                    Blog
                  </Link>
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-300">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.publishedAt)}
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{post.title}</h1>
                  {post.excerpt && <p className="mt-5 text-lg leading-8 text-slate-300">{post.excerpt}</p>}
                </div>
              </header>

              {post.featuredImageUrl && (
                <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
                  <img
                    src={post.featuredImageUrl}
                    alt={post.featuredImageAlt || post.title}
                    className="aspect-[16/8] w-full rounded-xl object-cover shadow-xl"
                  />
                </div>
              )}

              <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              </div>
            </article>
          </>
        )}
      </main>
      <Footer svgPaths={svgPaths} />
    </div>
  );
}
