"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  type DragOverEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { OrderingAnswer, ServedOrdering } from "@/engine/types";
import { ArrowDownIcon, ArrowUpIcon, GripIcon } from "./icons";

export interface OrderingItemProps {
  item: ServedOrdering;
  value?: OrderingAnswer;
  onChange: (answer: OrderingAnswer) => void;
  disabled?: boolean;
}

export const ORDERING_INSTRUCTIONS =
  "Drag the items into order, or use the arrow buttons. With the keyboard, focus an item, press Space to pick it up, use the arrow keys to move it and Space to drop it.";

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "To pick up an item, press Space or Enter. While moving it, use the arrow keys to move it up or down. Press Space or Enter again to drop it, or Escape to cancel.",
};

/** Keeps the lifted card on the vertical axis. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** Uses the saved arrangement only when it is a complete permutation of the served elements. */
function currentArrangement(item: ServedOrdering, value: OrderingAnswer | undefined): string[] {
  const saved = value?.arrangement;
  if (!saved) return item.initialArrangement;
  const ids = new Set(item.elements.map((e) => e.id));
  const complete = saved.length === ids.size && saved.every((id) => ids.has(id)) && new Set(saved).size === saved.length;
  return complete ? saved : item.initialArrangement;
}

type PendingFocus = { id: string; direction: "up" | "down" };

/** Vertical list of draggable cards with move buttons and a full keyboard path. Controlled: the parent stores the answer and passes it back as value. */
export function OrderingItem({ item, value, onChange, disabled = false }: OrderingItemProps) {
  const dndId = useId();
  const arrangement = currentArrangement(item, value);
  const total = arrangement.length;
  const labels = new Map(item.elements.map((e) => [e.id, e.text]));
  const label = (id: string | number) => labels.get(String(id)) ?? "item";
  const position = (id: string | number) => arrangement.indexOf(String(id)) + 1;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<{ text: string; n: number }>({ text: "", n: 0 });
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const pendingFocus = useRef<PendingFocus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // After a move button reorders the list, keep focus on the moved element's controls.
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    const preferred = buttons.current.get(`${pending.id}-${pending.direction}`);
    const other = buttons.current.get(`${pending.id}-${pending.direction === "up" ? "down" : "up"}`);
    const target = preferred && !preferred.disabled ? preferred : other && !other.disabled ? other : null;
    target?.focus();
  }, [arrangement]);

  function commit(next: string[], movedId: string) {
    onChange({ type: "ordering", arrangement: next });
    setAnnouncement((prev) => ({ text: `Moved ${label(movedId)} to position ${next.indexOf(movedId) + 1} of ${total}`, n: prev.n + 1 }));
  }

  function moveBy(index: number, delta: 1 | -1) {
    const target = index + delta;
    if (disabled || target < 0 || target >= total) return;
    const id = arrangement[index];
    pendingFocus.current = { id, direction: delta === 1 ? "down" : "up" };
    commit(arrayMove(arrangement, index, target), id);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setOverId(String(active.id));
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over ? String(over.id) : null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;
    const from = arrangement.indexOf(String(active.id));
    const to = arrangement.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    commit(arrayMove(arrangement, from, to), String(active.id));
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
  }

  // While a card is being dragged it is translated over its neighbours, so its committed index
  // no longer matches where it appears. The badges are numbered from the projected order instead,
  // otherwise they read out of sequence for the whole drag.
  const projected = (() => {
    if (!activeId || !overId || activeId === overId) return arrangement;
    const from = arrangement.indexOf(activeId);
    const to = arrangement.indexOf(overId);
    if (from < 0 || to < 0) return arrangement;
    return arrayMove(arrangement, from, to);
  })();

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${label(active.id)}. It is in position ${position(active.id)} of ${total}. Use the arrow keys to move it, Space to drop it, Escape to cancel.`,
    onDragOver: ({ active, over }) => (over ? `${label(active.id)} is over position ${position(over.id)} of ${total}.` : undefined),
    onDragEnd: ({ active, over }) =>
      !over || over.id === active.id ? `${label(active.id)} was dropped back in position ${position(active.id)} of ${total}.` : undefined,
    onDragCancel: ({ active }) => `Moving ${label(active.id)} was cancelled. It is back in position ${position(active.id)} of ${total}.`,
  };

  return (
    <div data-testid={`ordering-${item.id}`}>
      <p className="mb-3 text-sm text-ink-600">{ORDERING_INSTRUCTIONS}</p>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        accessibility={{ announcements, screenReaderInstructions }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={arrangement} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2" aria-label="Items in your current order">
            {arrangement.map((id, index) => (
              <SortableCard
                key={id}
                id={id}
                text={label(id)}
                index={index}
                badge={projected.indexOf(id) + 1}
                total={total}
                disabled={disabled}
                onMoveUp={() => moveBy(index, -1)}
                onMoveDown={() => moveBy(index, 1)}
                registerButton={(direction, el) => buttons.current.set(`${id}-${direction}`, el)}
              />
            ))}
          </ol>
        </SortableContext>
        <DragOverlay>
          {activeId ? <LiftedCard text={label(activeId)} index={position(activeId) - 1} /> : null}
        </DragOverlay>
      </DndContext>
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid={`ordering-live-${item.id}`}>
        <span key={announcement.n}>{announcement.text}</span>
      </div>
    </div>
  );
}

interface SortableCardProps {
  id: string;
  text: string;
  index: number;
  /** Position to display: where this card would land if dropped now. */
  badge: number;
  total: number;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  registerButton: (direction: "up" | "down", el: HTMLButtonElement | null) => void;
}

function SortableCard({ id, text, index, badge, total, disabled, onMoveUp, onMoveDown, registerButton }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = { transform: CSS.Translate.toString(transform), transition };
  const shell = isDragging
    ? "border-dashed border-brand-500 bg-tint-100"
    : "border-line bg-white shadow-card";
  return (
    <li
      ref={setNodeRef}
      style={style}
      data-testid={`ordering-item-${id}`}
      className={`flex min-h-14 items-stretch rounded-card border ${shell}`}
    >
      <div className={`flex flex-1 items-stretch ${isDragging ? "invisible" : ""}`}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={disabled}
          data-testid={`ordering-handle-${id}`}
          aria-label={`${text}, position ${badge} of ${total}. Drag to reorder.`}
          className={`flex w-12 shrink-0 touch-none items-center justify-center rounded-l-card border-r border-line text-ink-600 ${disabled ? "cursor-not-allowed" : "cursor-grab hover:bg-tint-100 hover:text-brand-600 active:cursor-grabbing"}`}
        >
          <GripIcon className="h-5 w-5" />
        </button>
        <span
          aria-hidden="true"
          className="ml-3 mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint-200 text-xs font-semibold tabular-nums text-brand-600"
        >
          {badge}
        </span>
        <span className="min-w-0 flex-1 py-3.5 pl-3 pr-2 text-base leading-relaxed text-ink-900">{text}</span>
        <span className="flex shrink-0 items-center gap-1 pr-2">
          <MoveButton
            ref={(el) => registerButton("up", el)}
            testId={`ordering-move-up-${id}`}
            label={`Move ${text} up`}
            disabled={disabled || index === 0}
            onClick={onMoveUp}
          >
            <ArrowUpIcon className="h-5 w-5" />
          </MoveButton>
          <MoveButton
            ref={(el) => registerButton("down", el)}
            testId={`ordering-move-down-${id}`}
            label={`Move ${text} down`}
            disabled={disabled || index === total - 1}
            onClick={onMoveDown}
          >
            <ArrowDownIcon className="h-5 w-5" />
          </MoveButton>
        </span>
      </div>
    </li>
  );
}

interface MoveButtonProps {
  ref: (el: HTMLButtonElement | null) => void;
  testId: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function MoveButton({ ref, testId, label, disabled, onClick, children }: MoveButtonProps) {
  return (
    <button
      type="button"
      ref={ref}
      data-testid={testId}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-card text-brand-600 hover:bg-tint-100 disabled:cursor-not-allowed disabled:text-ink-600/30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/** The card shown under the pointer while an element is lifted. */
function LiftedCard({ text, index }: { text: string; index: number }) {
  return (
    <div className="flex min-h-14 cursor-grabbing items-stretch rounded-card border border-brand-500 bg-white shadow-[0_12px_32px_rgb(114_55_184_/_0.25)]">
      <span className="flex w-12 shrink-0 items-center justify-center rounded-l-card border-r border-line text-brand-600">
        <GripIcon className="h-5 w-5" />
      </span>
      <span
        aria-hidden="true"
        className="ml-3 mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint-200 text-xs font-semibold tabular-nums text-brand-600"
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 py-3.5 pl-3 pr-2 text-base leading-relaxed text-ink-900">{text}</span>
      <span className="w-[5.75rem] shrink-0" />
    </div>
  );
}
