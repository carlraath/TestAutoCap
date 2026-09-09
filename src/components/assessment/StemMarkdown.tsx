import type { ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Links render as their text only: participants never leave the attempt. */
function PlainLink({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

/** Images are never part of a stem. */
function NoImage() {
  return null;
}

const components: Components = {
  a: PlainLink,
  img: NoImage,
};

const remarkPlugins = [remarkGfm];

/** Renders a question stem from markdown: paragraphs, fenced code and pipe tables. Raw HTML is dropped and links become plain text. */
export function StemMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="stem text-base leading-relaxed text-ink-900">
      <Markdown remarkPlugins={remarkPlugins} skipHtml components={components}>
        {markdown}
      </Markdown>
    </div>
  );
}
