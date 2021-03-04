import React from 'react';
import { Table } from 'reactstrap';
import { useTable, useSortBy } from 'react-table';

import DeleteScriptButton from './DeleteScriptButton';
import SubmitScriptButton from './SubmitScriptButton';
import styles from './ScriptsTable.module.css';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'long',
});
function timestampFormat(timestampFormat) {
  return dateFormatter.format(new Date(timestampFormat));
}

function ScriptsTable({ reloadScripts, scripts }) {
  const data = React.useMemo(() => scripts, [scripts]);
  const columns = React.useMemo(
    () => [
      {
        Header: 'Template',
        accessor: 'template.attributes.name',
      },
      {
        Header: 'Created',
        accessor: (s) => timestampFormat(s.attributes.createdAt),
        id: 'createdAt',
      },
      {
        Header: 'Located at',
        accessor: 'attributes.path',
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
    <td>
      <DeleteScriptButton
        className="mr-2"
        onDeleted={reloadScripts}
        script={script}
      />
      <SubmitScriptButton script={script} />
    </td>
  );
}

export default ScriptsTable;
