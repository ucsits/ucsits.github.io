import { useNavigate } from "react-router-dom";
import { User, Clock } from "lucide-react";
import type { Block, BlockPayload } from "../types/blockchain";
import {
  parseBlockData,
  getTypeColor,
  getBlockTypeLabel,
  formatRelativeTime,
} from "../types/blockchain";
import styles from "./BlockCard.module.scss";

interface Props {
  block: Block;
}

function getSummary(type: string, payload: BlockPayload | undefined): string {
  if (type === "genesis") return "Genesis block — mission statement";
  if (!payload) return "";
  switch (payload.type) {
    case "task":
      return payload.title;
    case "task_done":
      return `Task completed: ${payload.taskId}`;
    case "document":
      return payload.title;
    case "rep":
      return `Rep: ${payload.amount} to ${payload.toUser}`;
    default:
      return "";
  }
}

export function BlockCard({ block }: Props) {
  const navigate = useNavigate();
  const { type, payload } = parseBlockData(block);
  const typeColor = getTypeColor(type);
  const summary = getSummary(type, payload);

  function handleClick() {
    navigate(`/transparency/block/${block.height}`);
  }

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <div className={styles.height}>#{block.height}</div>
      <div className={styles.body}>
        <div className={styles.top}>
          <span className={styles.badge} style={{ backgroundColor: typeColor }}>
            {getBlockTypeLabel(type)}
          </span>
          <span className={styles.hash}>{block.hash}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <User size={12} />
            {block.author}
          </span>
          <span className={styles.metaSep} />
          <span className={styles.metaItem}>
            <Clock size={12} />
            {formatRelativeTime(block.timestamp)} ago
          </span>
        </div>
        {summary && <p className={styles.summary}>{summary}</p>}
      </div>
    </div>
  );
}
