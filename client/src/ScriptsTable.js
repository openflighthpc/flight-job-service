import React from 'react';
import TimeAgo from 'react-timeago';
import { ButtonToolbar, Table } from 'reactstrap';
import { Link, useHistory } from "react-router-dom";
import { useTable, useSortBy } from 'react-table';

import DeleteScriptButton from './DeleteScriptButton';
import SubmitScriptButton from './SubmitScriptButton';
import styles from './ScriptsTable.module.css';

function ScriptsTable({ reloadScripts, scripts }) {
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
        Header: 'ID',
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
            to={`/foo/templates/${row.original.template.id}`}
          >
            {value}
          </Link>
        ),
      },
      {
        Header: 'Located at',
        accessor: 'attributes.path',
      },
    ],
    []
  );
  const initialState = {
    sortBy: [{ id: 'attributes.createdAt', desc: true }],
  };
  const tableInstance = useTable({ columns, data, initialState }, useSortBy)
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
                  <i className="fa fa-sort-amount-desc"></i> :
                  <i className="fa fa-sort-amount-asc"></i> :
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
  const history = useHistory();
  prepareRow(row);
  const rowKey = row.original.id;

  return (
    <tr
      {...row.getRowProps()}
      onClick={() => history.push(`/scripts/${row.original.id}`)}
    >
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
