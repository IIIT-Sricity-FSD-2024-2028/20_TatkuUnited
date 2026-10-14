import { type ReactNode } from "react";

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
}: DataTableProps<T>) {
  return (
    <table className="w-full text-left">
      <thead className="border-b border-slate-200 text-sm text-slate-500">
        <tr>
          {columns.map((column) => (
            <th key={String(column.key)} className="px-4 py-3">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => (
          <tr
            key={rowKey ? String(row[rowKey]) : index}
            className="border-b border-slate-100"
          >
            {columns.map((column) => (
              <td key={String(column.key)} className="px-4 py-4">
                {column.render
                  ? column.render(row[column.key], row)
                  : String(row[column.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
