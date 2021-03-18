import React from 'react';
import { Table } from 'reactstrap';
import { useHistory } from 'react-router-dom';
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
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Scheduler ID',
        accessor: (j) => (
          j.attributes.schedulerId == null ? <span>&mdash;</span> : j.attributes.schedulerId
        ),
        id: 'attributes.schedulerId',
      },
      {
        Header: 'Script',
        accessor: (j) => {
          console.log('j:', j);  // eslint-disable-line no-console
          return j.script ? j.script.attributes.name : 'Unknown';
        },
        id: 'script.name',
      },
      {
        Header: 'Submitted at',
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
          headerGroups.map((headerGroup, i) => (
            <TableHeaders key={i} headerGroup={headerGroup} />
          ))
        }
      </thead>
      <tbody {...getTableBodyProps()}>
        {
          rows.map(row => (
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
