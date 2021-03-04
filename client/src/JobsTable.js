import React from 'react';
import { Table } from 'reactstrap';
import { useTable, useSortBy } from 'react-table';

import styles from './JobsTable.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'long',
});
function timestampFormat(timestampFormat) {
  return dateFormatter.format(new Date(timestampFormat));
}

function JobsTable({ reloadJobs, jobs }) {
  const data = React.useMemo(() => jobs, [jobs]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Scheduler ID',
        accessor: 'attributes.schedulerId',
      },
      {
        Header: 'Template',
        accessor: (j) => j.template ? j.template.attributes.name : 'Unknown',
        id: 'template.name',
      },
      {
        Header: 'Created',
        accessor: (s) => timestampFormat(s.attributes.createdAt),
        id: 'createdAt',
      },
      {
        Header: 'State',
        accessor: 'attributes.state',
      },
    ],
    []
  );
  const tableInstance = useTable({ columns, data }, useSortBy)
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance

  return (
    <Table
      {...getTableProps()}
      bordered
      className={styles.JobsTable}
      hover
      striped
    >
      <thead>
        {
          headerGroups.map(headerGroup => <TableHeaders headerGroup={headerGroup} />)
        }
      </thead>
      <tbody {...getTableBodyProps()}>
        {
          rows.map(row => (
            <TableRow prepareRow={prepareRow} reloadJobs={reloadJobs} row={row} />
          ))
        }
      </tbody>
    </Table>
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
                  <i className="fa fa-caret-down"></i> :
                  <i className="fa fa-caret-up"></i> :
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
  // Prepare the row for display
  prepareRow(row);

  return (
    <tr {...row.getRowProps()}>
      { row.cells.map(cell => <TableCell cell={cell} />) }
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

export default JobsTable;
