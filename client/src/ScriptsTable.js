import React from 'react';
import TimeAgo from 'react-timeago';
import classNames from 'classnames';
import { Table } from 'reactstrap';
import { Link } from "react-router-dom";
import { useTable, usePagination, useSortBy, useRowSelect } from 'react-table';

import PaginationControls from './PaginationControls';
import styles from './ScriptsTable.module.css';

function ScriptsTable({ onRowSelect, scripts }) {
  const data = React.useMemo(() => scripts, [scripts]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Created',
        accessor: 'attributes.createdAt',
        Cell: ({ value }) => (
          <TimeAgo
            date={value}
            minPeriod={5}
            formatter={(_v, unit, suffix, _e, nextFormatter) => (
              unit === 'second' ?
                `A few seconds ${suffix}` :
                nextFormatter()
            )}
          />
        ),
      },
      {
        Header: 'Name',
        accessor: 'id',
        Cell: ({ value }) => <code>{value}</code>,
      },
      {
        Header: 'Template',
        accessor: 'template.attributes.name',
        Cell: ({ row, value }) => (
          <Link
            onClick={(ev) => ev.stopPropagation() }
            title="View template"
            to={`/templates/${row.original.template.id}`}
          >
            {value}
          </Link>
        ),
      },
    ],
    []
  );
  const initialState = {
    sortBy: [{ id: 'attributes.createdAt', desc: true }],
  };
  const tableInstance = useTable(
    { columns, data, initialState },
    useSortBy,
    usePagination,
    useRowSelect,
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,

    // Pagination functionality.
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex },

  } = tableInstance

  const paginationControls = (
    <PaginationControls
      canNextPage={canNextPage}
      canPreviousPage={canPreviousPage}
      gotoPage={gotoPage}
      nextPage={nextPage}
      pageIndex={pageIndex}
      pageCount={pageCount}
      previousPage={previousPage}
    />
  );

  return (
    <>
    {paginationControls}
    <Table
      {...getTableProps()}
      bordered
      className={styles.ScriptsTable}
      hover
      striped
    >
      <thead>
        {
          headerGroups.map((headerGroup, i) => (
            <TableHeaders key={i} headerGroup={headerGroup} />
          ))
        }
      </thead>
      <tbody {...getTableBodyProps()}>
        {
          page.map(row => (
            <TableRow
              key={row.original.id}
              onRowSelect={onRowSelect}
              prepareRow={prepareRow}
              row={row}
              tableInstance={tableInstance}
            />
          ))
        }
      </tbody>
    </Table>
    {paginationControls}
    </>
  );
}

function TableHeaders({ headerGroup }) {
  return (
    <tr {...headerGroup.getHeaderGroupProps()}>
      {
        headerGroup.headers.map(column => (
          <th {...column.getHeaderProps(column.getSortByToggleProps())} >
            {
              column.render('Header')
            }
            <span className="ml-1 float-right">
              {
                column.isSorted ?
                  column.isSortedDesc ?
                  <i className="fa fa-sort-amount-desc"></i> :
                  <i className="fa fa-sort-amount-asc"></i> :
                  ''
              }
            </span>
          </th>
        ))
      }
    </tr>
  );
}

function TableRow({onRowSelect=()=>{}, prepareRow, row, tableInstance }) {
  prepareRow(row);
  const rowKey = row.original.id;

  return (
    <tr
      {...row.getRowProps()}
      className={classNames({ 'table-primary': row.isSelected })}
      onClick={() => {
        const newSelected = !row.isSelected;
        tableInstance.toggleAllRowsSelected(false);
        row.toggleRowSelected(newSelected);
        onRowSelect(newSelected ? row.original : null);
      }}
    >
      {
        row.cells.map(cell => (
          <TableCell
            cell={cell}
            key={`${rowKey}.${cell.column.id}`}
          /> 
        ))
      }
    </tr>
  );
}

function TableCell({ cell }) {
  return (
    <td {...cell.getCellProps()}>
      { cell.render('Cell') }
    </td>
  )
}

export default ScriptsTable;
