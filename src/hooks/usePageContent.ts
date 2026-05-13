import { useState, useEffect } from "react";

type SectionMap = Record<string, any>;

const cache: Record<string, SectionMap> = {};
const inflight: Record<string, Promise<SectionMap>> = {};

function fetchPage(page: string): Promise<SectionMap> {
  if (cache[page]) return Promise.resolve(cache[page]);
  if (inflight[page]) return inflight[page];
  inflight[page] = fetch(`/api/page-content/${page}`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((data) => { cache[page] = data; delete inflight[page]; return data; })
    .catch(() => { delete inflight[page]; return {}; });
  return inflight[page];
}

export function usePageContent<T = any>(page: string, section: string): T | null {
  const [data, setData] = useState<T | null>(() => cache[page]?.[section] ?? null);
  useEffect(() => {
    let cancelled = false;
    fetchPage(page).then((all) => { if (!cancelled) setData(all[section] ?? null); });
    return () => { cancelled = true; };
  }, [page, section]);
  return data;
}
