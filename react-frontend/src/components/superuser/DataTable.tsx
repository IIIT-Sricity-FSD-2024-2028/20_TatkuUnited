/**
1. Import the component and the Column type:
 *
 *    import DataTable, { type Column } from '../../components/superuser/DataTable';
 *
 * 2. Define your columns:
 *
 *    const columns: Column<UserRow>[] = [
 *      { header: "Name",   render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
 *      { header: "Email",  render: (row) => <span className="text-slate-500">{row.email}</span> },
 *      { header: "Status", render: (row) => <StatusBadge active={row.is_active} /> },
 *    ];
 *
 * 3. Render the component:
 *
 *    <DataTable
 *      columns={columns}
 *      data={filteredUsers}
 *      rowKey={(row) => row.id}
 *      isLoading={isLoading}
 *      error={error}
 *      emptyMessage="No users found matching your search."
 *    />
 *
 * props:
 *   columns       — Array of Column objects defining headers and cell renderers.
 *   data          — The array of row data to display.
 *   rowKey        — Function that returns a unique key string for each row.
 *   isLoading     — When true, shows a loading spinner/message.
 *   error         — When non-null, shows the error message.
 *   emptyMessage  — Message shown when `data` is empty (optional, has default).
 **/

import React from 'react';

export interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  isLoading: boolean;
  error: string | null;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  error,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : 
            error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : 
            (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {columns.map((col, i) => (
                      <th key={i} className="p-4">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {data.map((row) => (
                    <tr key={rowKey(row)} className="hover:bg-slate-50 transition-colors">
                      {columns.map((col, i) => (
                        <td key={i} className={`p-4 ${col.cellClassName || ''}`}>
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
    
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="p-8 text-center text-slate-500">
                        {emptyMessage}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
      </div>
    </div>
  );
}
