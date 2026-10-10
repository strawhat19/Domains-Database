export const scrollToPortfolioGroup = (groupId: string | null, collectionId?: string) => {
  // Wait for the group move, modal cleanup, and sticky header measurements to finish.
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    const scope = collectionId ? `portfolio-collection-${collectionId}` : `portfolio`;
    const key = `custom:${groupId ?? `ungrouped`}`;
    const heading = document.getElementById(`portfolio-group-${encodeURIComponent(key)}-heading`)
      ?? document.getElementById(`${scope}-group-${encodeURIComponent(key)}-heading`);
    if (!heading) return;
    const tableHeader = heading.closest(`.portfolio-records-table`)?.querySelector<HTMLElement>(`.portfolio-sticky-head:not([hidden])`);
    const targetCollectionId = heading.closest(`tbody`)?.dataset.portfolioCollectionKey ?? collectionId;
    const collectionHeading = tableHeader && targetCollectionId
      ? Array.from(heading.closest(`table`)?.tBodies ?? []).find(body => body.dataset.portfolioCollectionKey === targetCollectionId
        && body.querySelector(`.portfolio-collection-heading-row`))?.querySelector<HTMLTableRowElement>(`.portfolio-collection-heading-row`)
      : null;
    const collectionToolbar = heading.closest(`.portfolio-collection`)?.querySelector<HTMLElement>(`.portfolio-collection-titlebar`);
    const stickyElement = tableHeader ?? collectionToolbar ?? document.getElementById(`portfolio-toolbar`);
    const offset = stickyElement
      ? (Number.parseFloat(window.getComputedStyle(stickyElement).top) || 0) + stickyElement.offsetHeight + (collectionHeading?.getBoundingClientRect().height ?? 0) + 8
      : 8;
    window.scrollTo({
      left: window.scrollX,
      top: Math.max(0, window.scrollY + heading.getBoundingClientRect().top - offset),
      behavior: window.matchMedia(`(prefers-reduced-motion: reduce)`).matches ? `auto` : `smooth`,
    });
  }));
};

export const scrollToPortfolioCollection = (collectionId: string | null) => {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    const heading = document.getElementById(collectionId ? `portfolio-collection-${collectionId}` : `portfolio-main-database-heading`);
    if (!heading) return;
    const stickyElement = heading.closest(`.portfolio-records-table`)?.querySelector<HTMLElement>(`.portfolio-sticky-head:not([hidden])`)
      ?? document.getElementById(`portfolio-toolbar`);
    const offset = stickyElement ? (Number.parseFloat(window.getComputedStyle(stickyElement).top) || 0) + stickyElement.offsetHeight + 8 : 8;
    window.scrollTo({
      left: window.scrollX,
      top: Math.max(0, window.scrollY + heading.getBoundingClientRect().top - offset),
      behavior: window.matchMedia(`(prefers-reduced-motion: reduce)`).matches ? `auto` : `smooth`,
    });
  }));
};
