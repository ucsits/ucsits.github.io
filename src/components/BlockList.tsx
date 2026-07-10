import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Block } from "../types/blockchain";
import { parseBlockData } from "../types/blockchain";
import { BlockCard } from "./BlockCard";
import styles from "./BlockList.module.scss";

interface Props {
  blocks: Block[];
}

const PAGE_SIZE = 10;

const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All types" },
  { value: "task", label: "Task" },
  { value: "task_done", label: "Task Done" },
  { value: "document", label: "Document" },
  { value: "rep", label: "Rep" },
  { value: "genesis", label: "Genesis" },
];

export function BlockList({ blocks }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => b.height - a.height),
    [blocks]
  );

  const filtered = useMemo(() => {
    return sorted.filter((block) => {
      if (typeFilter) {
        const parsed = parseBlockData(block);
        if (parsed.type !== typeFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (String(block.height).includes(q)) return true;
        if (block.hash.toLowerCase().includes(q)) return true;
        if (String(block.author).includes(q)) return true;
      }
      return !search;
    });
  }, [sorted, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageBlocks = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by height, hash, or author..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {pageBlocks.length === 0 ? (
        <div className={styles.empty}>No blocks match your filters.</div>
      ) : (
        <div className={styles.list}>
          {pageBlocks.map((block) => (
            <BlockCard key={block.height} block={block} />
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          disabled={safePage <= 1}
          onClick={() => goTo(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        <span className={styles.pageInfo}>
          {safePage} / {totalPages}
        </span>
        <button
          className={styles.pageBtn}
          disabled={safePage >= totalPages}
          onClick={() => goTo(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
