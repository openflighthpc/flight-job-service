import React from 'react';
import TimeAgo from 'react-timeago';
import { ButtonToolbar, Table } from 'reactstrap';
import { useTable, useSortBy } from 'react-table';

import DeleteScriptButton from './DeleteScriptButton';
import SubmitScriptButton from './SubmitScriptButton';
import styles from './ScriptsTable.module.css';

function ScriptsTable({ reloadScripts, scripts }) {
  const data = React.useMemo(() => scripts, [scripts]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Template',
        accessor: 'template.attributes.name',
      },
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
        Header: 'Located at',
        accessor: 'attributes.path',
        Cell: ({ value }) => {
          const prefix = '.local/share/flight/job-scripts/';
          const index = value.indexOf(prefix);
          if (index < 0) {
            return value;
          }
          return (
            <span title={value}>
              {value.slice(index + prefix.length)}
            </span>
          );
        },
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
          rows.map(row => (
            <TableRow
              key={row.original.id}
              prepareRow={prepareRow}
              reloadScripts={reloadScripts}
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
      <th></th>
    </tr>
  );
}

function TableRow({ prepareRow, reloadScripts, row }) {
  // Prepare the row for display
  prepareRow(row);
  const rowKey = row.original.id;

  return (
    <tr {...row.getRowProps()}>
      {
        row.cells.map(cell => (
          <TableCell
            cell={cell}
            key={`${rowKey}.${cell.column.id}`}
          /> 
        ))
      }
      <ActionsCell reloadScripts={reloadScripts} row={row} />
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

function ActionsCell({ reloadScripts, row }) {
  const script = row.original;
  return (
    <td className={styles.ActionsCell}>
      <ButtonToolbar>
        <SubmitScriptButton
          className="mr-2"
          script={script}
        />
        <DeleteScriptButton
          onDeleted={reloadScripts}
          script={script}
        />
      </ButtonToolbar>
    </td>
  );
}

export default ScriptsTable;
