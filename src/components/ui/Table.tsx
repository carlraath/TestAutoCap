import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/** Scrollable wrapper and table with thin borders. Wide tables scroll inside it, never the page. */
export function Table({ className = "", children, ...rest }: HTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${className}`.trim()} {...rest}>
        {children}
      </table>
    </div>
  );
}

/** Brand-primary header row cell. */
export function Th({ className = "", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={`bg-brand-500 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white first:rounded-tl-card last:rounded-tr-card ${className}`.trim()} {...rest} />;
}

/** Body cell with a thin bottom border. */
export function Td({ className = "", ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`border-b border-line px-3 py-2 align-middle ${className}`.trim()} {...rest} />;
}

/** Full-width empty state row. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-ink-600">
        {children}
      </td>
    </tr>
  );
}
