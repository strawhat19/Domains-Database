import { useMemo, useState } from 'react';

export const PORTFOLIO_PAGE_SIZES = [25, 50, 100] as const;

export const usePortfolioPagination = (ids: string[], resetKey: string, enabled = true) => {
  const [pageSize, updatePageSize] = useState<number>(50);
  const key = `${enabled}|${resetKey}|${JSON.stringify(ids)}`;
  const [position, setPosition] = useState({ key, page: 1 });
  const total = ids.length;
  const pageCount = enabled ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const page = position.key === key ? Math.min(position.page, pageCount) : 1;
  if (position.key !== key || position.page !== page) setPosition({ key, page });
  const offset = enabled ? (page - 1) * pageSize : 0;
  const domainIds = useMemo(() => enabled ? ids.slice(offset, offset + pageSize) : ids, [ids, offset, enabled, pageSize]);
  const visibleDomainIds = useMemo(() => new Set(domainIds), [domainIds]);
  const setPage = (value: number) => {
    if (Number.isInteger(value)) setPosition({ key, page: Math.max(1, Math.min(value, pageCount)) });
  };
  const setPageSize = (value: number) => {
    if (!PORTFOLIO_PAGE_SIZES.some(size => size === value)) return;
    updatePageSize(value);
    setPosition({ key, page: 1 });
  };
  return {
    page, total, pageSize, pageCount, domainIds, setPage, setPageSize, visibleDomainIds,
    start: total ? offset + 1 : 0,
    end: offset + domainIds.length,
  };
};
