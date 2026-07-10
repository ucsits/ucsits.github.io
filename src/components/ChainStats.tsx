import { useEffect, useRef } from "react";
import type { ChainStats as ChainStatsType } from "../types/blockchain";
import {
  Database,
  Users,
  ClipboardList,
  CheckCircle,
  FileText,
  Award,
} from "lucide-react";
import styles from "./ChainStats.module.scss";

interface Props {
  stats: ChainStatsType;
}

export function ChainStats({ stats }: Props) {
  return (
    <div className={styles.band}>
      {/* Hero: Blocks (spans 2 rows) */}
      <div className={styles.hero}>
        <div className={styles.heroAccent} />
        <Database size={170} className={styles.bgIcon} />
        <AnimatedValue value={stats.totalBlocks} className={styles.heroValue} />
        <span className={styles.heroLabel}>Blocks</span>
        <span className={styles.heroMeta}>chain height</span>
      </div>

      {/* Standard cells */}
      <div className={styles.cell}>
        <Users size={100} className={styles.bgIcon} />
        <AnimatedValue value={stats.uniqueAuthors} className={styles.cellValue} />
        <span className={styles.cellLabel}>Authors</span>
      </div>

      <div className={styles.cell}>
        <FileText size={100} className={styles.bgIcon} />
        <AnimatedValue value={stats.documentCount} className={styles.cellValue} />
        <span className={styles.cellLabel}>Documents</span>
      </div>

      {/* Task progress pair */}
      <div className={styles.taskPair}>
        <div className={styles.taskSide}>
          <ClipboardList size={80} className={styles.bgIcon} />
          <div className={styles.taskBody}>
            <AnimatedValue value={stats.taskCount} className={styles.taskValue} />
            <span className={styles.taskDesc}>Tasks</span>
          </div>
        </div>
        <div className={styles.taskDivider} />
        <div className={styles.taskSide}>
          <CheckCircle size={80} className={styles.bgIcon} />
          <div className={styles.taskBody}>
            <AnimatedValue value={stats.taskDoneCount} className={styles.taskValue} />
            <span className={styles.taskDesc}>Done</span>
          </div>
        </div>
      </div>

      <div className={styles.cell}>
        <Award size={100} className={styles.bgIcon} />
        <AnimatedValue value={stats.repCount} className={styles.cellValue} />
        <span className={styles.cellLabel}>Rep</span>
      </div>
    </div>
  );
}

/* ── Shared helpers ── */

function fmtK(n: number): string {
  n = n || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e4) return Math.round(n / 1e3) + "k";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(Math.round(n));
}

function AnimatedValue({ value, className }: { value: number; className?: string }) {
  const elRef = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    const el = elRef.current;
    if (!el) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce || value <= 0) {
      el.textContent = fmtK(value);
      animated.current = true;
      return;
    }

    el.textContent = fmtK(0);
    const target = value;
    let t0: number | null = null;

    function step(now: number) {
      if (t0 == null) t0 = now;
      const p = Math.min(1, (now - t0) / 1000);
      const eased = 1 - Math.pow(1 - p, 3);
      el!.textContent = p < 1 ? fmtK(target * eased) : fmtK(target);
      if (p < 1) requestAnimationFrame(step);
      else animated.current = true;
    }
    requestAnimationFrame(step);
  }, [value]);

  return <span ref={elRef} className={className}>{fmtK(value)}</span>;
}
