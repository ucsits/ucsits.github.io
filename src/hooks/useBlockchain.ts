import { useState, useEffect, useMemo } from "react";
import type { Block } from "../types/blockchain";
import { computeStats } from "../types/blockchain";

const API_BASE = "https://luce.ucs.or.id/api/v1";

export function useBlockchain() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/blocks`, { mode: "cors" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Block[]>;
      })
      .then((data) => {
        setBlocks(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => computeStats(blocks), [blocks]);

  return { blocks, stats, loading, error } as const;
}

export function useBlock(height: number) {
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/blocks/${height}`, { mode: "cors" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Block>;
      })
      .then((data) => {
        setBlock(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [height]);

  return { block, loading, error } as const;
}
