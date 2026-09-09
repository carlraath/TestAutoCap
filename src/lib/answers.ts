/**
 * Runtime validation of autosave bodies. The client sends an `Answer`; the
 * server never trusts the shape. Shape checks only: whether the ids exist on
 * the served item is decided by src/lib/attempts.ts, which has the paper.
 */
import { z } from "zod";
import type { Answer } from "@/engine/types";

const MAX_ID_LENGTH = 64;
const MAX_LIST_LENGTH = 32;

const id = z.string().min(1, "Expected a non-empty id.").max(MAX_ID_LENGTH, "Id too long.");

/** { type: "single", optionId } */
export const singleAnswerSchema = z.object({ type: z.literal("single"), optionId: id }).strict();

/** { type: "multi", optionIds: string[] } (an empty list clears the answer) */
export const multiAnswerSchema = z.object({ type: z.literal("multi"), optionIds: z.array(id).max(MAX_LIST_LENGTH) }).strict();

/** { type: "ordering", arrangement: string[] } */
export const orderingAnswerSchema = z
  .object({ type: z.literal("ordering"), arrangement: z.array(id).min(1, "Expected at least one element.").max(MAX_LIST_LENGTH) })
  .strict();

/** { type: "matching", placements: Record<tokenId, bucketId | null> } (partial placements allowed) */
export const matchingAnswerSchema = z
  .object({
    type: z.literal("matching"),
    placements: z
      .record(id, id.nullable())
      .refine((placements) => Object.keys(placements).length <= MAX_LIST_LENGTH, { message: "Too many placements." }),
  })
  .strict();

/** Any of the four answer shapes, discriminated on `type`. */
export const answerSchema = z.discriminatedUnion("type", [singleAnswerSchema, multiAnswerSchema, orderingAnswerSchema, matchingAnswerSchema]);

/** Thrown by parseAnswer with a short, readable message listing what was wrong. */
export class AnswerParseError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`The answer is not valid: ${issues.join("; ")}`);
    this.name = "AnswerParseError";
    this.issues = issues;
  }
}

/** Parses an unknown request body into an Answer, throwing AnswerParseError with a readable message when it does not fit. */
export function parseAnswer(body: unknown): Answer {
  const result = answerSchema.safeParse(body);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => {
    const where = issue.path.length > 0 ? issue.path.map(String).join(".") : "answer";
    return `${where}: ${issue.message}`;
  });
  throw new AnswerParseError(issues.length > 0 ? issues : ["unrecognised shape"]);
}
