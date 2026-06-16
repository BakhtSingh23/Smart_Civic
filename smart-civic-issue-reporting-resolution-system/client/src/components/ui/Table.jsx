import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function Table({
  columns,
  data,
  onRowClick,
  className = '',
  sortable = false,
  emptyMessage = "No data available",
}) {
  const [sortConfig, setSortConfig] = useState(null);

  const sortedData = React.useMemo(() => {
    if (!sortable || !sortConfig) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, sortable]);

  const requestSort = (key) => {
    if (!sortable) return;
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={`overflow-x-auto border border-[var(--border-color)] rounded-xl w-full ${className}`}>
      <table className="w-full border-collapse text-[0.875rem]">
        <thead>
          <tr className="bg-[var(--bg-secondary)] border-b-2 border-[var(--border-color)]">
            {columns.map((col, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left font-semibold text-[var(--text-secondary)] select-none ${sortable && col.sortable !== false ? 'cursor-pointer hover:bg-[var(--bg-hover)]' : ''}`}
                onClick={() => col.sortable !== false && requestSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.title}
                  {sortable && col.sortable !== false && (
                    <span className="text-[10px] opacity-50 flex flex-col">
                      <svg className={`w-2 h-2 ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-[var(--color-primary)] opacity-100' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                      <svg className={`w-2 h-2 ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-[var(--color-primary)] opacity-100' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[rgba(30,64,175,0.05)]' : 'hover:bg-[var(--bg-hover)]'}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-3.5 text-[var(--text-primary)] align-middle">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--text-muted)] bg-[var(--bg-tertiary)]">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.node.isRequired,
    key: PropTypes.string.isRequired,
    render: PropTypes.func,
    sortable: PropTypes.bool,
  })).isRequired,
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  className: PropTypes.string,
  sortable: PropTypes.bool,
  emptyMessage: PropTypes.node,
};
