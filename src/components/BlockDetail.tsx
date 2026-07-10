import { useParams, Link } from "react-router-dom";
import { Copy, Check, Hash } from "lucide-react";
import { useState } from "react";
import { useBlock } from "../hooks/useBlockchain";
import {
  parseBlockData,
  getTypeColor,
  getBlockTypeLabel,
  formatTimestamp,
} from "../types/blockchain";
import type { TaskPayload, DocumentPayload, RepPayload } from "../types/blockchain";
import styles from "./BlockDetail.module.scss";
import logoSrc from "../assets/logo-text-light.png";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* fallback */
    }
  }

  return (
    <button className={styles.copyBtn} onClick={handleCopy} aria-label="Copy to clipboard">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function Field({ label, value, mono, copyable }: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldValueWrap}>
        <span className={`${styles.fieldValue} ${mono ? styles.mono : ""}`}>
          {value}
        </span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

function TaskView(payload: TaskPayload) {
  return (
    <>
      <Field label="Title" value={payload.title} />
      <Field label="Task ID" value={payload.taskId} mono copyable />
      <Field label="Assigned To" value={payload.assignedTo} mono />
      <Field label="Created By" value={payload.createdBy} mono />
      <Field label="Deadline" value={formatTimestamp(payload.deadline)} />
      {payload.description && (
        <Field label="Description" value={payload.description} />
      )}
    </>
  );
}

function DocumentView(payload: DocumentPayload) {
  return (
    <>
      <Field label="Title" value={payload.title} />
      <Field label="Document ID" value={payload.docId} mono copyable />
      <Field label="Author" value={payload.author} mono />
      <Field label="Mime Type" value={payload.mimeType} mono />
      <Field label="Content" value={payload.content} />
    </>
  );
}

function RepView(payload: RepPayload) {
  return (
    <>
      <Field label="From" value={payload.fromUser} mono />
      <Field label="To" value={payload.toUser} mono />
      <Field label="Amount" value={String(payload.amount)} mono />
      <Field label="Reason" value={payload.reason} />
      <Field label="Date" value={payload.date} />
    </>
  );
}

export function BlockDetail() {
  const { height } = useParams<{ height: string }>();
  const blockHeight = Number(height);
  const { block, loading, error } = useBlock(blockHeight);
  const [showRaw, setShowRaw] = useState(false);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>
          <span className={styles.loadingDots}>
            Loading<span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorWrap}>
          <p className={styles.errorText}>{error || "Block not found"}</p>
          <Link to="/transparency" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to transparency
          </Link>
        </div>
      </div>
    );
  }

  const { type, payload, raw } = parseBlockData(block);
  const typeColor = getTypeColor(type);

  return (
    <div className={styles.wrapper}>
      {/* Sticky detail header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <img src={logoSrc} alt="UKM Cyber Security ITS" className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>Block #{block.height}</h1>
            </div>
          </div>
          <div className={styles.headerRight} />
        </div>
      </header>

      {/* Block hero card */}
      <div className={styles.hero}>
        <div className={styles.heroAccent} style={{ backgroundColor: typeColor }} />
        <div className={styles.heroBody}>
          <div className={styles.heroTop}>
            <h1 className={styles.heroTitle}>Block #{block.height}</h1>
            <span className={styles.heroBadge} style={{ backgroundColor: typeColor }}>
              {getBlockTypeLabel(type)}
            </span>
          </div>
          <p className={styles.heroMeta}>
            {formatTimestamp(block.timestamp)} · Author {String(block.author)}
          </p>
        </div>
      </div>

      {/* Summary section */}
      <div className={styles.section}>
        <div className={styles.fields}>
          <Field
            label="Hash"
            value={block.hash}
            mono
            copyable
          />
          <Field
            label="Previous Block"
            value={block.height === 0 ? "(none)" : block.prev_block_hash}
            mono
            copyable={block.height !== 0}
          />
          <Field label="Author ID" value={String(block.author)} mono />
          <Field label="Timestamp" value={formatTimestamp(block.timestamp)} />
          <Field label="Height" value={String(block.height)} mono />
        </div>
      </div>

      {/* Payload section */}
      {payload && (
        <div className={styles.section}>
          <div className={styles.fields}>
            {payload.type === "task" && <TaskView {...(payload as TaskPayload)} />}
            {payload.type === "task_done" && (
              <>
                <Field label="Task ID" value={(payload as any).taskId} mono copyable />
                <Field label="Completed By" value={(payload as any).completedBy} mono />
              </>
            )}
            {payload.type === "document" && <DocumentView {...(payload as DocumentPayload)} />}
            {payload.type === "rep" && <RepView {...(payload as RepPayload)} />}
          </div>
        </div>
      )}

      {/* Genesis quote */}
      {type === "genesis" && (
        <div className={styles.section}>
          <div className={styles.genesisQuote}>{raw}</div>
        </div>
      )}

      {/* Raw data toggle */}
      <div className={styles.section}>
        <button
          className={styles.rawToggle}
          onClick={() => setShowRaw((v) => !v)}
        >
          <Hash size={13} />
          {showRaw ? "Hide Raw Data" : "Show Raw Data"}
        </button>
        {showRaw && (
          <pre className={styles.rawBlock}>
            <code>{JSON.stringify(block, null, 2)}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
