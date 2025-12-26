import type { ReactElement } from 'react';
import { Pagination } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface PaginatorProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Paginator({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  loading = false,
}: PaginatorProps): ReactElement | null {
  if (lastPage <= 1) return null;
  const { t } = useTranslation();

  const maxButtons = 7;
  const items: ReactElement[] = [];

  // First page
  items.push(
    <Pagination.First
      key="first"
      onClick={() => onPageChange(1)}
      disabled={currentPage === 1 || loading}
    />
  );

  // Previous page
  items.push(
    <Pagination.Prev
      key="prev"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1 || loading}
    />
  );

  // Calculate range
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(lastPage, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  // First page ellipsis
  if (startPage > 1) {
    items.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
  }

  // Page numbers
  for (let page = startPage; page <= endPage; page++) {
    items.push(
      <Pagination.Item
        key={page}
        active={page === currentPage}
        onClick={() => onPageChange(page)}
        disabled={loading}
      >
        {page}
      </Pagination.Item>
    );
  }

  // Last page ellipsis
  if (endPage < lastPage) {
    items.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
  }

  // Next page
  items.push(
    <Pagination.Next
      key="next"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === lastPage || loading}
    />
  );

  // Last page
  items.push(
    <Pagination.Last
      key="last"
      onClick={() => onPageChange(lastPage)}
      disabled={currentPage === lastPage || loading}
    />
  );

  const showing = {
    from: (currentPage - 1) * perPage + 1,
    to: Math.min(currentPage * perPage, total),
  };

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <div className="text-muted small">
        {t('paginator.showing_range', { from: showing.from, to: showing.to, total })}
      </div>
      <Pagination className="mb-0">{items}</Pagination>
    </div>
  );
}
