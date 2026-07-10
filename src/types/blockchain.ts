export interface Block {
  height: number;
  hash: string;
  author: number;
  timestamp: number;
  prev_block_hash: string;
  data: string;
}

export interface TaskPayload {
  type: "task";
  v: number;
  taskId: string;
  title: string;
  description: string;
  assignedTo: string;
  createdBy: string;
  deadline: number;
}

export interface TaskDonePayload {
  type: "task_done";
  v: number;
  taskId: string;
  completedBy: string;
}

export interface DocumentPayload {
  type: "document";
  v: number;
  docId: string;
  title: string;
  content: string;
  author: string;
  mimeType: string;
}

export interface RepPayload {
  type: "rep";
  v: number;
  toUser: string;
  fromUser: string;
  amount: number;
  reason: string;
  date: string;
}

export type BlockPayload =
  | TaskPayload
  | TaskDonePayload
  | DocumentPayload
  | RepPayload;

export type BlockDataType =
  | "task"
  | "task_done"
  | "document"
  | "rep"
  | "genesis"
  | "unknown";

export interface ParsedBlockData {
  type: BlockDataType;
  payload?: BlockPayload;
  raw: string;
}

export function parseBlockData(block: Block): ParsedBlockData {
  if (block.height === 0) {
    return { type: "genesis", raw: block.data };
  }
  try {
    const parsed = JSON.parse(block.data);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      return {
        type: parsed.type as BlockDataType,
        payload: parsed as BlockPayload,
        raw: block.data,
      };
    }
  } catch {
    /* not JSON */
  }
  return { type: "unknown", raw: block.data };
}

export interface ChainStats {
  totalBlocks: number;
  uniqueAuthors: number;
  taskCount: number;
  taskDoneCount: number;
  documentCount: number;
  repCount: number;
  latestTimestamp: number;
}

export function computeStats(blocks: Block[]): ChainStats {
  const authors = new Set<number>();
  let taskCount = 0;
  let taskDoneCount = 0;
  let documentCount = 0;
  let repCount = 0;
  let latestTimestamp = 0;

  for (const block of blocks) {
    if (block.author !== 0) authors.add(block.author);
    if (block.timestamp > latestTimestamp) latestTimestamp = block.timestamp;

    const parsed = parseBlockData(block);
    switch (parsed.type) {
      case "task":
        taskCount++;
        break;
      case "task_done":
        taskDoneCount++;
        break;
      case "document":
        documentCount++;
        break;
      case "rep":
        repCount++;
        break;
    }
  }

  return {
    totalBlocks: blocks.length,
    uniqueAuthors: authors.size,
    taskCount,
    taskDoneCount,
    documentCount,
    repCount,
    latestTimestamp,
  };
}

export function getTypeColor(type: BlockDataType): string {
  switch (type) {
    case "task":
      return "#4a9eff";
    case "task_done":
      return "#4caf50";
    case "document":
      return "#ff9800";
    case "rep":
      return "#ab47bc";
    case "genesis":
      return "#ffc107";
    case "unknown":
      return "#666";
  }
}

export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 2592000)}mo`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function truncateHash(hash: string, prefix = 8, suffix = 8): string {
  if (hash.length <= prefix + suffix) return hash;
  return `${hash.slice(0, prefix)}...${hash.slice(-suffix)}`;
}

export function truncateId(id: number | string): string {
  const str = String(id);
  if (str.length <= 12) return str;
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
}

export function getBlockTypeLabel(type: BlockDataType): string {
  switch (type) {
    case "task":
      return "Task";
    case "task_done":
      return "Task Done";
    case "document":
      return "Document";
    case "rep":
      return "Rep";
    case "genesis":
      return "Genesis";
    case "unknown":
      return "Unknown";
  }
}
