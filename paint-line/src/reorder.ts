import { SHIFT_META, type ShiftId } from "./model";

/** Test catalog. Real product ids will replace these. */
export const CATALOG = [
  { id: "gloves", name: "Gloves", sku: "GLV-001" },
  { id: "cover", name: "Cover", sku: "CVR-001" },
  { id: "mask", name: "mask", sku: "MSK-001" },
  { id: "test1", name: "test 1", sku: "TST-001" },
] as const;

export type RequestStatus = "requested" | "rejected" | "confirmed";

export interface ReorderRequest {
  desiredQty: string;
  currentStock: string;
  name: string;
  shift: ShiftId;
  signature: string;
  requestedAt: string;
  status: RequestStatus;
  supplierQty: string;
  note: string;
  decidedAt: string;
  placedBy: string;
  expectedDelivery: string;
}

export interface ReorderItem {
  id: string;
  name: string;
  sku: string;
  lastOrderDate: string;
  lastOrderedBy: string;
  deliveredBy: string;
  deliveredAt: string;
  request: ReorderRequest | null;
}

export interface ReorderBoard {
  items: ReorderItem[];
}

const KEY = "paintline-reorder-board";
const listeners = new Set<() => void>();
let currentBoard: ReorderBoard | null = null;

function cleanRequest(request: ReorderRequest | null | undefined): ReorderRequest | null {
  if (!request) return null;
  return {
    desiredQty: request.desiredQty ?? "",
    currentStock: request.currentStock ?? "",
    name: request.name ?? "",
    shift: request.shift,
    signature: request.signature ?? "",
    requestedAt: request.requestedAt ?? "",
    status: request.status,
    supplierQty: request.supplierQty ?? "",
    note: request.note ?? "",
    decidedAt: request.decidedAt ?? "",
    placedBy: request.placedBy ?? "",
    expectedDelivery: request.expectedDelivery ?? "",
  };
}

function emptyItem(source: (typeof CATALOG)[number]): ReorderItem {
  return {
    id: source.id,
    name: source.name,
    sku: source.sku,
    lastOrderDate: "",
    lastOrderedBy: "",
    deliveredBy: "",
    deliveredAt: "",
    request: null,
  };
}

export function seedBoard(): ReorderBoard {
  return { items: CATALOG.map(emptyItem) };
}

function mergeCatalog(raw: ReorderBoard | null): ReorderBoard {
  const saved = new Map((raw?.items ?? []).map((item) => [item.id, item]));
  return {
    items: CATALOG.map((source) => {
      const prev = saved.get(source.id);
      return {
        ...emptyItem(source),
        ...prev,
        id: source.id,
        name: source.name,
        sku: source.sku,
        request: cleanRequest(prev?.request),
      };
    }),
  };
}

export function loadBoard(): ReorderBoard {
  if (currentBoard) return currentBoard;
  try {
    const text = localStorage.getItem(KEY);
    currentBoard = text ? mergeCatalog(JSON.parse(text) as ReorderBoard) : seedBoard();
  } catch {
    currentBoard = seedBoard();
  }
  return currentBoard;
}

export function saveBoard(board: ReorderBoard): void {
  currentBoard = board;
  localStorage.setItem(KEY, JSON.stringify(board));
  listeners.forEach((listener) => listener());
}

export function subscribeBoard(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestReorder(
  board: ReorderBoard,
  itemId: string,
  draft: Pick<ReorderRequest, "desiredQty" | "currentStock" | "name" | "shift" | "signature">,
): ReorderBoard {
  return {
    items: board.items.map((item) => {
      if (item.id !== itemId || item.request?.status === "requested") return item;
      return {
        ...item,
        request: {
          ...draft,
          requestedAt: new Date().toISOString(),
          status: "requested",
          supplierQty: "",
          note: "",
          decidedAt: "",
          placedBy: "",
          expectedDelivery: "",
        },
      };
    }),
  };
}

export function decideRequest(
  board: ReorderBoard,
  itemId: string,
  decision: "confirmed" | "rejected",
  supplierQty: string,
  note: string,
  placedBy: string,
  expectedDelivery: string,
): ReorderBoard {
  const decidedAt = new Date().toISOString();
  return {
    items: board.items.map((item) => {
      if (item.id !== itemId || item.request?.status !== "requested") return item;
      const request = {
        ...item.request,
        status: decision,
        supplierQty: decision === "confirmed" ? supplierQty : item.request.supplierQty,
        note,
        decidedAt,
        placedBy: decision === "confirmed" ? placedBy : "",
        expectedDelivery: decision === "confirmed" ? expectedDelivery : "",
      };
      if (decision === "rejected") return { ...item, request };
      return {
        ...item,
        lastOrderDate: decidedAt,
        lastOrderedBy: placedBy,
        request,
      };
    }),
  };
}

export function formatDay(value: string): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return formatWhen(value);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatWhen(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shiftLabel(shift: ShiftId): string {
  const meta = SHIFT_META[shift];
  return `${meta.fr} / ${meta.en}`;
}
