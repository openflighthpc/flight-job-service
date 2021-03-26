import React from 'react';
import TimeAgo from 'react-timeago';
import { Badge, Table } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import { useTable, usePagination, useSortBy } from 'react-table';

import PaginationControls from './PaginationControls';
import styles from './JobsTable.module.css';
import { stateColourMap } from './utils';

function JobsTable({ reloadJobs, jobs }) {
  const data = React.useMemo(() => jobs, [jobs]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Submitted',
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
        Header: 'ID',
        accessor: 'id',
        Cell: ({ value }) => <code>{value}</code>,
      },
      {
        Header: 'Scheduler ID',
        accessor: 'attributes.schedulerId',
        Cell: ({ value }) => (
          value == null ? <span>&mdash;</span> : <code>{value}</code>
        ),
      },
      {
        Header: 'Script',
        accessor: 'script.attributes.name',
        Cell: ({ row, value }) => (
          row.original.script == null ? <i>Unknown</i> : (
            <Link
              onClick={(ev) => ev.stopPropagation() }
              title="View script"
              to={`/scripts/${row.original.script.id}`}
            >
              {value}
            </Link>
          )
        ),
      },
      {
        Header: 'State',
        accessor: 'attributes.state',
        Cell: ({ value }) => <Badge color={stateColourMap[value]}>{value}</Badge>,
      },
    ],
    []
  );
  const initialState = {
    sortBy: [{ id: 'attributes.createdAt', desc: true }],
  };
  const tableInstance = useTable({ columns, data, initialState }, useSortBy, usePagination)
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
      className={styles.JobsTable}
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
              prepareRow={prepareRow}
              reloadJobs={reloadJobs}
              row={row}
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

function TableRow({ prepareRow, reloadJobs, row }) {
  const history = useHistory();
  prepareRow(row);
  const job = row.original;

  return (
    <tr
      {...row.getRowProps()}
      onClick={() => history.push(`/jobs/${job.id}`)}
    >
      {
        row.cells.map(cell => (
          <td {...cell.getCellProps()}>
            { cell.render('Cell') }
          </td>
        ))
      }
    </tr>
  );
}

export default JobsTable;
