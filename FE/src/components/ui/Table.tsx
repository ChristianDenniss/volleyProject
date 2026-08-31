import React from "react";
import "./ui.css";

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  onHeaderClick?: () => void;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  /** Defaults to "ui-table". Pass a page-specific class (e.g. "stats-table") to replace it. */
  tableClassName?: string;
  wrapperClassName?: string;
  rowClassName?: (row: T, index: number) => string | undefined;
  onRowClick?: (row: T, index: number) => void;
  /** Extra <tr> elements rendered immediately before each data row. */
  renderBeforeRow?: (row: T, index: number) => React.ReactNode;
  /** Extra <tr> elements rendered immediately after each data row (accordion details, separators, etc.). */
  renderAfterRow?: (row: T, index: number) => React.ReactNode;
}

function Table<T>({
  columns,
  rows,
  rowKey,
  tableClassName = "ui-table",
  wrapperClassName = "ui-table-wrapper",
  rowClassName,
  onRowClick,
  renderBeforeRow,
  renderAfterRow,
}: TableProps<T>) {
  return (
    <div className={wrapperClassName}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.headerClassName}
                onClick={col.onHeaderClick}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <React.Fragment key={rowKey(row)}>
              {renderBeforeRow?.(row, index)}
              <tr
                className={rowClassName?.(row, index)}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
              {renderAfterRow?.(row, index)}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
