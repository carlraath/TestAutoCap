"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import type { MatchingAnswer, MatchingBucket, ServedMatching, ServedOption } from "@/engine/types";
import { CrossIcon, GripIcon } from "./icons";

export interface MatchingItemProps {
  item: ServedMatching;
  value?: MatchingAnswer;
  onChange: (answer: MatchingAnswer) => void;
  disabled?: boolean;
}

export const MATCHING_INSTRUCTIONS = "Drag each item onto a category, or use the selector under each item.";

const TRAY_ID = "tray";
const tokenDragId = (tokenId: string) => `token:${tokenId}`;
const bucketDropId = (bucketId: string) => `bucket:${bucketId}`;
const parseTokenId = (id: UniqueIdentifier) => String(id).replace(/^token:/, "");
/** Returns null for the tray, otherwise the bucket id. */
const parseDropTarget = (id: UniqueIdentifier): string | null => (String(id) === TRAY_ID ? null : String(id).replace(/^bucket:/, ""));

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "To pick up an item, press Space or Enter. While moving it, use the arrow keys to choose the tray or a category. Press Space or Enter again to drop it, or Escape to cancel. The selector under each item places it without dragging.",
};

/** Pointer drags need the pointer inside a zone; keyboard drags (no pointer) use rectangle overlap. */
const collisionDetection: CollisionDetection = (args) => (args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args));

/** Arrow keys step through the tray and the buckets in order, wrapping at the ends. */
function makeCoordinateGetter(order: string[]): KeyboardCoordinateGetter {
  return (event, { context }) => {
    const forward = event.code === "ArrowDown" || event.code === "ArrowRight";
    const backward = event.code === "ArrowUp" || event.code === "ArrowLeft";
    if (!forward && !backward) return undefined;
    event.preventDefault();
    const { collisionRect, droppableRects, droppableContainers, over } = context;
    if (!collisionRect) return undefined;
    const targets = order.filter((id) => {
      const container = droppableContainers.get(id);
      return container !== undefined && !container.disabled && droppableRects.has(id);
    });
    if (targets.length === 0) return undefined;
    const current = over ? targets.indexOf(String(over.id)) : -1;
    const nextIndex =
      current < 0 ? (forward ? 0 : targets.length - 1) : (current + (forward ? 1 : -1) + targets.length) % targets.length;
    const rect = droppableRects.get(targets[nextIndex]);
    if (!rect) return undefined;
    return {
      x: rect.left + rect.width / 2 - collisionRect.width / 2,
      y: rect.top + rect.height / 2 - collisionRect.height / 2,
    };
  };
}

/** Every served token id present, with a bucket id only when it names a served bucket. */
function currentPlacements(item: ServedMatching, value: MatchingAnswer | undefined): Record<string, string | null> {
  const bucketIds = new Set(item.buckets.map((b) => b.id));
  const out: Record<string, string | null> = {};
  for (const token of item.tokens) {
    const saved = value?.placements?.[token.id];
    out[token.id] = typeof saved === "string" && bucketIds.has(saved) ? saved : null;
  }
  return out;
}

/** Tokens in tray order, with any token missing from trayOrder appended in served order. */
function orderedTokens(item: ServedMatching): ServedOption[] {
  const byId = new Map(item.tokens.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const out: ServedOption[] = [];
  for (const id of item.trayOrder) {
    const token = byId.get(id);
    if (token && !seen.has(id)) {
      out.push(token);
      seen.add(id);
    }
  }
  for (const token of item.tokens) if (!seen.has(token.id)) out.push(token);
  return out;
}

/** Tray of tokens and labelled bucket drop zones, with a native selector per token as the keyboard path. Controlled: the parent stores the answer and passes it back as value. */
export function MatchingItem({ item, value, onChange, disabled = false }: MatchingItemProps) {
  const baseId = useId();
  const placements = currentPlacements(item, value);
  const tokens = orderedTokens(item);
  const total = tokens.length;
  const placedCount = tokens.filter((t) => placements[t.id] !== null).length;
  const bucketLabels = new Map(item.buckets.map((b) => [b.id, b.label]));
  const tokenText = (id: UniqueIdentifier) => tokens.find((t) => t.id === parseTokenId(id))?.text ?? "item";
  const targetLabel = (id: UniqueIdentifier) => {
    const bucketId = parseDropTarget(id);
    return bucketId === null ? "the tray" : (bucketLabels.get(bucketId) ?? "a category");
  };
  const dropOrder = [TRAY_ID, ...item.buckets.map((b) => bucketDropId(b.id))];

  const [activeId, setActiveId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<{ text: string; n: number }>({ text: "", n: 0 });
  const pendingFocus = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: makeCoordinateGetter(dropOrder) }),
  );

  const selectDomId = (tokenId: string) => `${baseId}-select-${tokenId}`;

  // A token's selector moves between containers when the token is placed; keep focus on it.
  useEffect(() => {
    const tokenId = pendingFocus.current;
    if (!tokenId) return;
    pendingFocus.current = null;
    document.getElementById(selectDomId(tokenId))?.focus();
  });

  function commit(tokenId: string, bucketId: string | null) {
    if (disabled || placements[tokenId] === bucketId) return;
    const next = { ...placements, [tokenId]: bucketId };
    onChange({ type: "matching", placements: next });
    const count = Object.values(next).filter((v) => v !== null).length;
    const text = tokenText(tokenDragId(tokenId));
    const message =
      bucketId === null
        ? `Returned ${text} to the tray. ${count} of ${total} placed.`
        : `Placed ${text} in ${bucketLabels.get(bucketId) ?? "a category"}. ${count} of ${total} placed.`;
    setAnnouncement((prev) => ({ text: message, n: prev.n + 1 }));
  }

  function placeViaControl(tokenId: string, bucketId: string | null) {
    pendingFocus.current = tokenId;
    commit(tokenId, bucketId);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    commit(parseTokenId(active.id), parseDropTarget(over.id));
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${tokenText(active.id)}. Use the arrow keys to choose a category, Space to drop it, Escape to cancel.`,
    onDragOver: ({ active, over }) => (over ? `${tokenText(active.id)} is over ${targetLabel(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) => {
      if (!over) return `${tokenText(active.id)} was dropped outside a category and stays where it was.`;
      if (placements[parseTokenId(active.id)] === parseDropTarget(over.id)) return `${tokenText(active.id)} stays in ${targetLabel(over.id)}.`;
      return undefined;
    },
    onDragCancel: ({ active }) => `Moving ${tokenText(active.id)} was cancelled.`,
  };

  const dragging = activeId !== null;
  const trayTokens = tokens.filter((t) => placements[t.id] === null);
  const bucketColumns = item.buckets.length === 3 ? "@xl:grid-cols-3" : "@xl:grid-cols-2";

  return (
    <div data-testid={`matching-${item.id}`} className="@container">
      <p className="mb-3 text-sm text-ink-600">{MATCHING_INSTRUCTIONS}</p>
      <DndContext
        id={baseId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{ announcements, screenReaderInstructions }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-4 @5xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <DropZone
            id={TRAY_ID}
            testId={`matching-tray-${item.id}`}
            heading="Items"
            headingId={`${baseId}-tray-heading`}
            dragging={dragging}
            disabled={disabled}
            aside={
              <span data-testid={`matching-count-${item.id}`} className="text-sm tabular-nums text-ink-600">
                {placedCount} of {total} placed
              </span>
            }
            empty="All items placed."
            listClassName="grid gap-2 @xl:grid-cols-2 @5xl:grid-cols-1"
          >
            {trayTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                bucketId={null}
                bucketLabel={null}
                buckets={item.buckets}
                disabled={disabled}
                selectId={selectDomId(token.id)}
                onPlace={(bucketId) => placeViaControl(token.id, bucketId)}
              />
            ))}
          </DropZone>
          <div className={`grid gap-3 ${bucketColumns}`}>
            {item.buckets.map((bucket) => {
              const placed = tokens.filter((t) => placements[t.id] === bucket.id);
              return (
                <DropZone
                  key={bucket.id}
                  id={bucketDropId(bucket.id)}
                  testId={`matching-bucket-${bucket.id}`}
                  heading={bucket.label}
                  headingId={`${baseId}-bucket-${bucket.id}`}
                  dragging={dragging}
                  disabled={disabled}
                  aside={<span className="text-sm tabular-nums text-ink-600">{placed.length}</span>}
                  empty="Nothing placed here yet."
                  listClassName="flex flex-col gap-2"
                >
                  {placed.map((token) => (
                    <TokenCard
                      key={token.id}
                      token={token}
                      bucketId={bucket.id}
                      bucketLabel={bucket.label}
                      buckets={item.buckets}
                      disabled={disabled}
                      selectId={selectDomId(token.id)}
                      onPlace={(bucketId) => placeViaControl(token.id, bucketId)}
                    />
                  ))}
                </DropZone>
              );
            })}
          </div>
        </div>
        <DragOverlay>{activeId ? <LiftedToken text={tokenText(activeId)} /> : null}</DragOverlay>
      </DndContext>
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid={`matching-live-${item.id}`}>
        <span key={announcement.n}>{announcement.text}</span>
      </div>
    </div>
  );
}

interface DropZoneProps {
  id: string;
  testId: string;
  heading: string;
  headingId: string;
  dragging: boolean;
  disabled: boolean;
  aside: ReactNode;
  empty: string;
  listClassName: string;
  children: ReactNode[];
}

function DropZone({ id, testId, heading, headingId, dragging, disabled, aside, empty, listClassName, children }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  const shell = isOver
    ? "border-brand-500 bg-tint-100"
    : dragging
      ? "border-dashed border-brand-300 bg-white"
      : "border-line bg-white";
  return (
    <section
      ref={setNodeRef}
      data-testid={testId}
      data-over={isOver ? "true" : "false"}
      aria-labelledby={headingId}
      className={`flex min-h-32 flex-col rounded-card border-2 p-3 transition-colors ${shell}`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h4 id={headingId} className="text-sm font-semibold text-ink-900">
          {heading}
        </h4>
        {aside}
      </div>
      {children.length > 0 ? (
        <ul className={listClassName}>{children}</ul>
      ) : (
        <p className="py-2 text-sm text-ink-600">{empty}</p>
      )}
    </section>
  );
}

interface TokenCardProps {
  token: ServedOption;
  bucketId: string | null;
  bucketLabel: string | null;
  buckets: MatchingBucket[];
  disabled: boolean;
  selectId: string;
  onPlace: (bucketId: string | null) => void;
}

function TokenCard({ token, bucketId, bucketLabel, buckets, disabled, selectId, onPlace }: TokenCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: tokenDragId(token.id), disabled });
  const where = bucketLabel ? `In ${bucketLabel}.` : "In the tray.";
  return (
    <li
      ref={setNodeRef}
      data-testid={`matching-token-${token.id}`}
      data-location={bucketId ?? "tray"}
      className={`rounded-card border border-line bg-white shadow-card ${isDragging ? "opacity-40" : ""}`}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        data-testid={`matching-drag-${token.id}`}
        aria-label={`${token.text}. ${where} Drag to a category.`}
        className={`flex items-start gap-2 rounded-t-card px-3 pb-2 pt-3 ${disabled ? "cursor-not-allowed" : "cursor-grab touch-none hover:bg-tint-100/60 active:cursor-grabbing"}`}
      >
        <GripIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-600" />
        <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink-900">{token.text}</span>
      </div>
      <div className="flex items-center gap-2 px-3 pb-3">
        <select
          id={selectId}
          data-testid={`matching-select-${token.id}`}
          aria-label={`Place ${token.text} in`}
          value={bucketId ?? ""}
          disabled={disabled}
          onChange={(event) => onPlace(event.target.value === "" ? null : event.target.value)}
          className="h-9 min-w-0 flex-1 rounded-card border border-line bg-white px-2 text-sm text-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Tray</option>
          {buckets.map((bucket) => (
            <option key={bucket.id} value={bucket.id}>
              {bucket.label}
            </option>
          ))}
        </select>
        {bucketId !== null ? (
          <button
            type="button"
            data-testid={`matching-return-${token.id}`}
            aria-label={`Return ${token.text} to tray`}
            disabled={disabled}
            onClick={() => onPlace(null)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-ink-600 hover:bg-tint-100 hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CrossIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** The token shown under the pointer while lifted. */
function LiftedToken({ text }: { text: string }) {
  return (
    <div className="flex cursor-grabbing items-start gap-2 rounded-card border border-brand-500 bg-white px-3 py-3 shadow-[0_12px_32px_rgb(114_55_184_/_0.25)]">
      <GripIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
      <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink-900">{text}</span>
    </div>
  );
}
