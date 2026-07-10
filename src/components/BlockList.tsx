import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import type { Block } from "../types/blockchain";
import { parseBlockData } from "../types/blockchain";
import { BlockCard } from "./BlockCard";
import styles from "./BlockList.module.scss";

interface Props {
  blocks: Block[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All types" },
  { value: "task", label: "Task" },
  { value: "task_done", label: "Task Done" },
  { value: "document", label: "Document" },
  { value: "rep", label: "Rep" },
  { value: "genesis", label: "Genesis" },
];

export function BlockList({ blocks, currentPage, totalPages, onPageChange, loading }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Filter only the currently loaded page blocks
  const filtered = useMemo(() => {
    return blocks.filter((block) => {
      if (typeFilter) {
        const parsed = parseBlockData(block);
        if (parsed.type !== typeFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (String(block.height).includes(q)) return true;
        if (block.hash.toLowerCase().includes(q)) return true;
        if (String(block.author).includes(q)) return true;
        return false;
      }
      return true;
    });
  }, [blocks, search, typeFilter]);

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
            }}
          />
        </div>
        <select
          className={styles.select}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
          }}
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className={styles.empty}>No blocks match your filters.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((block) => (
            <BlockCard key={block.height} block={block} />
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        <span className={styles.pageInfo}>
          {currentPage} / {totalPages}
          {loading && <Loader2 size={12} className={styles.spinner} />}
        </span>
        <button
          className={styles.pageBtn}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
