/**
 * Deterministic variation: seed hashing, the seeded PRNG and the shuffle used
 * by paper generation. Server side only (uses node:crypto).
 */
import { createHash } from "node:crypto";
import type { SeedInputs } from "./types";

/** A seeded pseudo-random source. next() is in [0, 1); nextInt(n) is an integer in [0, n). */
export interface Rng {
  next(): number;
  nextInt(n: number): number;
}

const WARM_UP_ROUNDS = 12;

/** SHA-256 hex of `${userId}:${assessmentId}:${attemptNumber}:${bankVersion}` per docs/03. */
export function computeSeed(inputs: SeedInputs): string {
  const material = `${inputs.userId}:${inputs.assessmentId}:${inputs.attemptNumber}:${inputs.bankVersion}`;
  return createHash("sha256").update(material, "utf8").digest("hex");
}

function readUint32(hex: string, index: number): number {
  const chunk = hex.slice(index * 8, index * 8 + 8).padEnd(8, "0");
  const value = Number.parseInt(chunk, 16);
  return Number.isNaN(value) ? 0 : value >>> 0;
}

/** sfc32 seeded from the first 16 bytes of the hex seed as four big-endian uint32, with 12 warm-up rounds. */
export function createRng(seedHex: string): Rng {
  const normalised = seedHex.trim().toLowerCase();
  let a = readUint32(normalised, 0);
  let b = readUint32(normalised, 1);
  let c = readUint32(normalised, 2);
  let d = readUint32(normalised, 3);

  function next(): number {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  function nextInt(n: number): number {
    if (!Number.isInteger(n) || n < 1) {
      throw new RangeError(`nextInt requires a positive integer bound, received ${String(n)}`);
    }
    return Math.floor(next() * n);
  }

  for (let i = 0; i < WARM_UP_ROUNDS; i += 1) next();

  return { next, nextInt };
}

/** Returns a new array shuffled by Fisher-Yates from the end: for i = n-1 down to 1, j = nextInt(i+1), swap. */
export function shuffle<T>(array: readonly T[], rng: Rng): T[] {
  const out = array.slice();
  for (let i = out.length - 1; i >= 1; i -= 1) {
    const j = rng.nextInt(i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** The next permutation in lexicographic order, wrapping to the first (ascending) permutation after the last. */
export function nextPermutation(indexes: readonly number[]): number[] {
  const out = indexes.slice();
  const n = out.length;
  let pivot = -1;
  for (let i = n - 2; i >= 0; i -= 1) {
    if (out[i] < out[i + 1]) {
      pivot = i;
      break;
    }
  }
  if (pivot < 0) {
    return out.sort((x, y) => x - y);
  }
  let successor = n - 1;
  while (out[successor] <= out[pivot]) successor -= 1;
  const tmp = out[pivot];
  out[pivot] = out[successor];
  out[successor] = tmp;
  const head = out.slice(0, pivot + 1);
  const tail = out.slice(pivot + 1).reverse();
  return head.concat(tail);
}
