import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Block, ChainSummary, PaginatedBlocksResponse } from "../types/blockchain";
import { computeStats } from "../types/blockchain";

const API_BASE = "https://luce.ucs.or.id/api/v1";
export const PAGE_SIZE = 20;

/**
 * Provides chain height, total page count, and stats.
 * Fetches chain summary first (lightweight) to determine pagination,
 * then fetches all blocks in the background for stats computation.
 */
export function useBlockchain() {
  const [chainHeight, setChainHeight] = useState<number | null>(null);
  const [allBlocks, setAllBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Fetch chain summary first (gives us height immediately)
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/chain/summary`, { mode: "cors", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ChainSummary>;
      })
      .then((summary) => {
        setChainHeight(summary.height);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { controller.abort(); };
  }, []);

  // Step 2: Fetch all blocks for stats (background, non-blocking)
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/blocks?page=1&limit=10000&desc=true`, { mode: "cors", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<PaginatedBlocksResponse>;
      })
      .then((res) => {
        setAllBlocks(res.data);
      })
      .catch(() => {
        // Stats may be unavailable; component handles gracefully
      });
    return () => { controller.abort(); };
  }, []);

  const totalPages = useMemo(() => {
    if (chainHeight === null) return 0;
    return Math.max(1, Math.ceil(chainHeight / PAGE_SIZE));
  }, [chainHeight]);

  const stats = useMemo(() => computeStats(allBlocks), [allBlocks]);

  return { chainHeight, totalPages, stats, loading, error };
}

/**
 * Dynamically loads block pages one-by-one with preloading of
 * adjacent pages ([-1, +1] relative to current page).
 */
export function usePageBlocks(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesCache, setPagesCache] = useState<Record<number, Block[]>>({});
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());

  // Refs for guard checks — avoids stale closure issues
  const cacheRef = useRef<Record<number, Block[]>>({});
  const loadingRef = useRef<Set<number>>(new Set());
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    cacheRef.current = pagesCache;
  }, [pagesCache]);

  useEffect(() => {
    loadingRef.current = loadingPages;
  }, [loadingPages]);

  const loadPage = useCallback(
    async (page: number) => {
      if (page < 1 || (totalPages > 0 && page > totalPages)) return;
      if (cacheRef.current[page]) return;
      if (loadingRef.current.has(page)) return;

      loadingRef.current = new Set(loadingRef.current).add(page);
      setLoadingPages(new Set(loadingRef.current));

      try {
        const controller = new AbortController();
        controllerRef.current = controller;
        const res = await fetch(
          `${API_BASE}/blocks?page=${page}&limit=${PAGE_SIZE}&desc=true`,
          { mode: "cors", signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PaginatedBlocksResponse;

        cacheRef.current = { ...cacheRef.current, [page]: json.data };
        setPagesCache({ ...cacheRef.current });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(`Failed to load page ${page}:`, err.message);
        }
      } finally {
        loadingRef.current = new Set(loadingRef.current);
        loadingRef.current.delete(page);
        setLoadingPages(new Set(loadingRef.current));
      }
    },
    [totalPages]
  );

  // Load initial page once totalPages is known; preload page 2
  useEffect(() => {
    if (totalPages > 0) {
      loadPage(1);
      if (totalPages > 1) loadPage(2);
    }
  }, [totalPages, loadPage]);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);

      // Load current page
      loadPage(clamped);
      // Preload [-1, +1] relative to current
      if (clamped > 1) loadPage(clamped - 1);
      if (clamped < totalPages) loadPage(clamped + 1);
    },
    [totalPages, loadPage]
  );

  const pageBlocks = useMemo(
    () => pagesCache[currentPage] || [],
    [pagesCache, currentPage]
  );
  const isPageLoading = loadingPages.has(currentPage);

  return { currentPage, goToPage, pageBlocks, isPageLoading };
}

export function useBlock(height: number) {
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/blocks/${height}`, { mode: "cors", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Block>;
      })
      .then((data) => {
        setBlock(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { controller.abort(); };
  }, [height]);

  return { block, loading, error } as const;
}
