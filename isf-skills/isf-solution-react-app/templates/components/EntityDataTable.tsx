import React, { useState, useMemo, ReactNode } from 'react';
import clsx from 'clsx';
import { Badge, BadgeVariant, DataState } from './ThemedCard';

/* ----------------------------------------------------------------
   Column Definition
   ---------------------------------------------------------------- */

export interface ColumnDef<T> {
  key: string;
  header: string;
  /** Render a custom cell. Falls back to row[key] as string. */
  render?: (row: T) => ReactNode;
  /** Right-align numeric columns. */
  align?: 'left' | 'right' | 'center';
  /** Column width (CSS value). */
  width?: string;
  /** Enable sorting on this column. Default true. */
  sortable?: boolean;
  /** Badge mapping: if row[key] matches a key in this map, render a Badge. */
  badgeMap?: Record<string, BadgeVariant>;
}

/* ----------------------------------------------------------------
   Sort State
   ---------------------------------------------------------------- */

type SortDirection = 'asc' | 'desc';

interface SortState {
  key: string;
  direction: SortDirection;
}

function sortIndicator(col: string, sort: SortState | null): string {
  if (!sort || sort.key !== col) return '';
  return sort.direction === 'asc' ? ' \u25B4' : ' \u25BE';
}

/* ----------------------------------------------------------------
   EntityDataTable
   ---------------------------------------------------------------- */

export interface EntityDataTableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Unique key field on each row. */
  rowKey: keyof T & string;
  /** Currently selected row key. */
  selectedKey?: string | null;
  /** Called when a row is clicked. */
  onRowSelect?: (row: T) => void;
  /** Click-to-ask callback. Receives a formatted question about the row. */
  onAsk?: (question: string) => void;
  /** Field used to build the click-to-ask question (e.g., "name" or "flight_id"). */
  askField?: keyof T & string;
  /** Loading state. */
  isLoading?: boolean;
  /** Placeholder when data is empty. */
  emptyMessage?: string;
  className?: string;
}

export function EntityDataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  selectedKey,
  onRowSelect,
  onAsk,
  askField,
  isLoading = false,
  emptyMessage = 'No data available',
  className,
}: EntityDataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (col.sortable === false) return;
    setSort((prev) => {
      if (prev?.key === col.key) {
        return prev.direction === 'asc'
          ? { key: col.key, direction: 'desc' }
          : null;
      }
      return { key: col.key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const { key, direction } = sort;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const handleRowClick = (row: T) => {
    onRowSelect?.(row);
    if (onAsk && askField) {
      onAsk(`Tell me about ${row[askField]}`);
    }
  };

  return (
    <DataState isLoading={isLoading} className={className}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="table-header"
                  onClick={() => handleHeaderClick(col)}
                  style={{
                    textAlign: col.align ?? 'left',
                    width: col.width,
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    padding: '10px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-subtle)',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-surface)',
                    zIndex: 1,
                  }}
                >
                  {col.header}{sortIndicator(col.key, sort)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 && !isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: 'center',
                    padding: '40px 16px',
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const key = String(row[rowKey]);
                const isSelected = selectedKey === key;

                return (
                  <tr
                    key={key}
                    className={clsx(
                      'table-row-interactive',
                      isSelected && 'table-row-selected',
                    )}
                    onClick={() => handleRowClick(row)}
                    style={{ cursor: 'pointer' }}
                  >
                    {columns.map((col) => {
                      const raw = row[col.key];
                      let content: ReactNode;

                      if (col.render) {
                        content = col.render(row);
                      } else if (col.badgeMap && raw != null && col.badgeMap[String(raw)]) {
                        content = (
                          <Badge variant={col.badgeMap[String(raw)]}>
                            {String(raw)}
                          </Badge>
                        );
                      } else {
                        content = raw != null ? String(raw) : '\u2014';
                      }

                      return (
                        <td
                          key={col.key}
                          style={{
                            textAlign: col.align ?? 'left',
                            padding: '10px 12px',
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </DataState>
  );
}
