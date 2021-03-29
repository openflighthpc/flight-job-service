import { Pagination, PaginationItem, PaginationLink } from 'reactstrap';

function PaginationControls({
  canNextPage,
  canPreviousPage,
  gotoPage,
  nextPage,
  pageIndex,
  previousPage,
  pageCount,
}) {
  const namedLinkOffsets = [-2, -1, 0, 1, 2];
  const namedLinks = namedLinkOffsets
    .map(offset => pageIndex + offset)
    .filter(idx => idx >= 0 && idx <= pageCount - 1)
    .map(idx => (
      <PaginationItem active={idx === pageIndex} >
        <PaginationLink onClick={() => gotoPage(idx)}>
          {idx + 1}
        </PaginationLink>
      </PaginationItem>
    ));
  const preDots = pageIndex + namedLinkOffsets[0] > 0 ?
    (
      <PaginationItem disabled >
        <PaginationLink>&hellip;</PaginationLink>
      </PaginationItem>
    ) : null;
  const postDots = pageIndex + namedLinkOffsets[namedLinkOffsets.length - 1] < pageCount - 1 ?
    (
      <PaginationItem disabled >
        <PaginationLink>&hellip;</PaginationLink>
      </PaginationItem>
    ) : null;


  return (
    <Pagination aria-label="Page navigation example">
      <PaginationItem disabled={!canPreviousPage}>
        <PaginationLink
          first
          onClick={() => gotoPage(0)}
        />
      </PaginationItem>
      <PaginationItem disabled={!canPreviousPage}>
        <PaginationLink
          previous
          onClick={() => previousPage()}
        />
      </PaginationItem>
      {preDots}
      {namedLinks}
      {postDots}
      <PaginationItem disabled={!canNextPage}>
        <PaginationLink
          next
          onClick={() => nextPage()}
        />
      </PaginationItem>
      <PaginationItem disabled={!canNextPage}>
        <PaginationLink
          last
          onClick={() => gotoPage(pageCount - 1)}
        />
      </PaginationItem>
    </Pagination>
  );
}

export default PaginationControls;
