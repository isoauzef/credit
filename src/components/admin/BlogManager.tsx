import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Bold,
  Calendar,
  FileText,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Plus,
  Quote,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdmin";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentHtml: string;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  status: "draft" | "published";
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl: string;
  publishedAt?: string | null;
  updatedAt: string;
};

type BlogForm = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  status: "draft" | "published";
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
};

const EMPTY_FORM: BlogForm = {
  title: "",
  slug: "",
  excerpt: "",
  contentHtml: "<p>Start writing your blog post here.</p>",
  featuredImageUrl: "",
  featuredImageAlt: "",
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
};

const BLOCKS = [
  {
    label: "Intro Card",
    html: '<section class="blog-hero-card"><p class="blog-eyebrow">Credit repair guide</p><h2>Write a clear promise here</h2><p class="blog-lead">Use this block to frame the reader problem, what they will learn, and why the topic matters.</p></section>',
  },
  {
    label: "Two Columns",
    html: '<div class="blog-grid"><div><h3>What to review</h3><ul><li>Credit score changes</li><li>Negative items</li><li>Open and closed accounts</li></ul></div><div><h3>What to prepare</h3><ul><li>Photo ID</li><li>Utility bill</li><li>Credit report PDF</li></ul></div></div>',
  },
  {
    label: "Callout",
    html: '<div class="blog-callout"><strong>Editor note:</strong> Add a useful reminder, risk warning, or expert explanation here.</div>',
  },
  {
    label: "Checklist",
    html: '<div class="blog-checklist"><p><strong>Quick checklist:</strong></p><ul><li>Review all three bureaus</li><li>Confirm account dates</li><li>Upload supporting documents</li></ul></div>',
  },
  {
    label: "CTA",
    html: '<p><a class="blog-cta" href="/checkout">Start your credit repair intake</a></p>',
  },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}

function formFromPost(post: BlogPost): BlogForm {
  return {
    id: post.id,
    title: post.title || "",
    slug: post.slug || "",
    excerpt: post.excerpt || "",
    contentHtml: post.contentHtml || "",
    featuredImageUrl: post.featuredImageUrl || "",
    featuredImageAlt: post.featuredImageAlt || "",
    status: post.status || "draft",
    metaTitle: post.metaTitle || "",
    metaDescription: post.metaDescription || "",
    ogTitle: post.ogTitle || "",
    ogDescription: post.ogDescription || "",
    ogImageUrl: post.ogImageUrl || "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function RichBlogEditor({
  value,
  onChange,
  onUploadImage,
}: {
  value: string;
  onChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const sync = () => onChange(editorRef.current?.innerHTML || "");

  const command = (name: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, arg);
    sync();
  };

  const insertHtml = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    sync();
  };

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const path = await onUploadImage(file);
      insertHtml(`<div class="blog-image-row"><img src="${path}" alt="" /><span>Image caption</span></div>`);
      toast.success("Image inserted into the article.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 p-2">
        <button type="button" onClick={() => command("bold")} className="rounded-md p-2 text-slate-200 hover:bg-slate-800" title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => command("italic")} className="rounded-md p-2 text-slate-200 hover:bg-slate-800" title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => command("formatBlock", "h2")} className="rounded-md p-2 text-slate-200 hover:bg-slate-800" title="Heading 2">
          <Heading2 size={16} />
        </button>
        <button type="button" onClick={() => command("formatBlock", "h3")} className="rounded-md p-2 text-slate-200 hover:bg-slate-800" title="Heading 3">
          <Heading3 size={16} />
        </button>
        <button type="button" onClick={() => command("insertUnorderedList")} className="rounded-md p-2 text-slate-200 hover:bg-slate-800" title="Bullet list">
          <List size={16} />
        </button>
        <button type="button" onClick={() => command("formatBlock", "blockquote")} className="rounded-md p-2 text-slate-200 hover:bg-slate-800" title="Quote">
          <Quote size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Paste a URL");
            if (url) command("createLink", url);
          }}
          className="rounded-md p-2 text-slate-200 hover:bg-slate-800"
          title="Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="rounded-md p-2 text-slate-200 hover:bg-slate-800"
          title="Insert image"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <div className="h-6 w-px bg-slate-700" />
        {BLOCKS.map((block) => (
          <button
            key={block.label}
            type="button"
            onClick={() => insertHtml(block.html)}
            className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-200"
          >
            {block.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={sync}
        className="blog-content min-h-[420px] bg-white p-5 text-slate-900 outline-none"
        suppressContentEditableWarning
      />
    </div>
  );
}

export default function BlogManager() {
  const { token } = useAdminAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadPosts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/blog-posts", { headers });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed to load blog posts.");
      setPosts(data);
      if (!form.id && data[0]) setForm(formFromPost(data[0]));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  }, [form.id, headers, token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const setField = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const uploadImage = async (file: File) => {
    if (!token) throw new Error("Not authenticated.");
    const fd = new FormData();
    fd.append("file", file);
    const resp = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.message || "Upload failed.");
    return data.path as string;
  };

  const uploadFeaturedImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const path = await uploadImage(file);
      setForm((current) => ({
        ...current,
        featuredImageUrl: path,
        ogImageUrl: current.ogImageUrl || path,
      }));
      toast.success("Featured image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    }
  };

  const savePost = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || slugify(form.title) };
      const resp = await fetch(form.id ? `/api/admin/blog-posts/${form.id}` : "/api/admin/blog-posts", {
        method: form.id ? "PUT" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Save failed.");
      setForm(formFromPost(data));
      toast.success(form.id ? "Blog post updated." : "Blog post created.");
      await loadPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (post: BlogPost, status: "draft" | "published") => {
    try {
      const resp = await fetch(`/api/admin/blog-posts/${post.id}/status`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Status update failed.");
      toast.success("Blog status updated.");
      setPosts((current) => current.map((item) => (item.id === post.id ? data : item)));
      if (form.id === post.id) setForm(formFromPost(data));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed.");
    }
  };

  const deletePost = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    try {
      const resp = await fetch(`/api/admin/blog-posts/${post.id}`, { method: "DELETE", headers });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Delete failed.");
      toast.success("Blog post deleted.");
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (form.id === post.id) setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const haystack = `${post.title} ${post.slug} ${post.status}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Manager</h1>
          <p className="mt-1 text-sm text-slate-400">Create, design, publish, update, and delete credit repair blog posts.</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...EMPTY_FORM })}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={16} /> New Post
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search blog posts"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="max-h-[720px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center gap-2 p-3 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : filteredPosts.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">No blog posts found.</p>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`mb-2 w-full rounded-lg border p-3 text-left transition ${
                    form.id === post.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700"
                  }`}
                >
                  <button type="button" onClick={() => setForm(formFromPost(post))} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">{post.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">/{post.slug}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${post.status === "published" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                        {post.status}
                      </span>
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} /> {formatDate(post.publishedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deletePost(post)}
                      className="inline-flex items-center gap-1 text-red-300 hover:text-red-200"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                  <select
                    value={post.status}
                    onChange={(event) => updateStatus(post, event.target.value as BlogPost["status"])}
                    className="mt-3 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              ))
            )}
          </div>
        </aside>

        <form onSubmit={savePost} className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Blog Title</span>
              <input
                value={form.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setForm((current) => ({
                    ...current,
                    title,
                    slug: current.id ? current.slug : slugify(title),
                    metaTitle: current.metaTitle || title.slice(0, 255),
                    ogTitle: current.ogTitle || title.slice(0, 255),
                  }));
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Status</span>
              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value as BlogForm["status"])}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setField("slug", slugify(event.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Canonical</span>
              <input
                value={form.slug ? `${window.location.origin}/blog/${form.slug}` : "Auto-generated from slug"}
                readOnly
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-400"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Excerpt</span>
            <textarea
              value={form.excerpt}
              onChange={(event) => {
                const excerpt = event.target.value;
                setForm((current) => ({
                  ...current,
                  excerpt,
                  metaDescription: current.metaDescription || excerpt.slice(0, 500),
                  ogDescription: current.ogDescription || excerpt.slice(0, 500),
                }));
              }}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Featured Image URL</span>
              <input
                value={form.featuredImageUrl}
                onChange={(event) => setField("featuredImageUrl", event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                placeholder="https://... or /uploads/..."
              />
            </label>
            <label className="flex items-end">
              <span className="sr-only">Upload featured image</span>
              <span className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-blue-500">
                <ImagePlus size={16} /> Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={uploadFeaturedImage} />
              </span>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Featured Image Alt Text</span>
            <input
              value={form.featuredImageAlt}
              onChange={(event) => setField("featuredImageAlt", event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </label>

          {form.featuredImageUrl && (
            <img src={form.featuredImageUrl} alt={form.featuredImageAlt || "Featured"} className="max-h-64 w-full rounded-xl object-cover" />
          )}

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <FileText size={16} />
              Content Editor
            </div>
            <RichBlogEditor value={form.contentHtml} onChange={(value) => setField("contentHtml", value)} onUploadImage={uploadImage} />
          </div>

          <details className="rounded-xl border border-slate-800 bg-slate-950/50 p-4" open>
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-100">
              <Search size={16} /> SEO and Open Graph
            </summary>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Meta Title</span>
                <input value={form.metaTitle} onChange={(event) => setField("metaTitle", event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">OG Title</span>
                <input value={form.ogTitle} onChange={(event) => setField("ogTitle", event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </label>
              <label className="block lg:col-span-2">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Meta Description</span>
                <textarea value={form.metaDescription} onChange={(event) => setField("metaDescription", event.target.value)} rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </label>
              <label className="block lg:col-span-2">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">OG Description</span>
                <textarea value={form.ogDescription} onChange={(event) => setField("ogDescription", event.target.value)} rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </label>
              <label className="block lg:col-span-2">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">OG Image URL</span>
                <input value={form.ogImageUrl} onChange={(event) => setField("ogImageUrl", event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </label>
            </div>
          </details>

          <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {form.id && (
                <>
                  <button type="button" onClick={() => updateStatus(form as BlogPost, "draft")} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-amber-400">
                    Move to Draft
                  </button>
                  <button type="button" onClick={() => updateStatus(form as BlogPost, "published")} className="rounded-lg border border-emerald-500/50 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10">
                    Publish
                  </button>
                  <button type="button" onClick={() => deletePost(form as BlogPost)} className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10">
                    <Trash2 size={15} /> Delete
                  </button>
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {form.id ? "Update Blog Post" : "Create Blog Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
