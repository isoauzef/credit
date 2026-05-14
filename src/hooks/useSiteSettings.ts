import { useEffect, useState } from "react";

type Settings = Record<string, string>;

let cache: Settings | null = null;
let inflight: Promise<Settings> | null = null;

function fetchSettings(): Promise<Settings> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch("/api/settings/public")
    .then((r) => (r.ok ? r.json() : {}))
    .then((data) => { cache = data || {}; inflight = null; return cache; })
    .catch(() => { inflight = null; return {}; });
  return inflight;
}

export function useSiteSettings(): Settings {
  const [data, setData] = useState<Settings>(() => cache ?? {});
  useEffect(() => {
    let cancelled = false;
    fetchSettings().then((s) => { if (!cancelled) setData(s); });
    return () => { cancelled = true; };
  }, []);
  return data;
}
