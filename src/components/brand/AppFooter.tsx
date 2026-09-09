import { TITLE_DEVICE } from "@/engine/structure";

export function AppFooter() {
  return (
    <footer className="print-hidden mt-auto border-t border-line bg-white">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 text-xs text-ink-600 sm:px-6">
        <span>{TITLE_DEVICE}</span>
        <span>No personal data is stored by this application.</span>
      </div>
    </footer>
  );
}
