import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";
import svgPaths from "../imports/svg-6ltl2tuh8w";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { setPageSeo } from "../lib/seo";

type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  publishedAt?: string | null;
  canonicalUrl: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Recently updated";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageSeo({
      title: "Credit Removers Blog",
      description: "Credit repair guides, bureau education, dispute strategy, and practical steps for improving credit readiness.",
      canonicalUrl: `${window.location.origin}/blog`,
      imageUrl: `${window.location.origin}/removers-og-image.jpg`,
    });

    fetch("/api/blog")
      .then(async (resp) => {
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.message || "Failed to load blog posts.");
        setPosts(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load blog posts."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Navigation />
      <main id="main-content" className="pt-24">
        <section className="border-b border-slate-200 bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Credit Removers Blog</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Credit repair guides written for real client decisions.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Learn how bureau reports, dispute rounds, documentation, and score tracking fit together before you start.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-6 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading blog posts...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">{error}</div>
            ) : posts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-slate-600">
                No published blog posts yet.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article key={post.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {post.featuredImageUrl && (
                      <img
                        src={post.featuredImageUrl}
                        alt={post.featuredImageAlt || post.title}
                        className="h-52 w-full object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.publishedAt)}
                      </div>
                      <h2 className="text-xl font-bold leading-tight text-slate-950">{post.title}</h2>
                      {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>}
                      <Link
                        to={`/blog/${post.slug}`}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1e5a8a] hover:text-[#17466d]"
                      >
                        Read article <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer svgPaths={svgPaths} />
    </div>
  );
}
