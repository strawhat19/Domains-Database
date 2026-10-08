import type { DomainRecord } from '../../shared/types';
import { getDomainStatus } from '../../shared/domainUtils';
import { getDomainPreviewLink, getDomainGithubRepoLink } from '../../shared/domainLinks';
import { getDomainColumnKey } from '../DomainRow/domainRow';
import { getDomainSourceBadge } from '../DomainSourceBadge/domainSourceBadge';
import { PORTFOLIO_COLUMNS, getPortfolioColumnDisplay, getPortfolioColumnValue, type PortfolioColumn, type PortfolioColumnDefinition } from '../../shared/portfolioColumns';

type ColumnWidths = Partial<Record<PortfolioColumn, number>>;
type TextFont = { font: string; spacing: number; transform: string };

export const DEFAULT_COLUMN_WIDTHS = Object.fromEntries(PORTFOLIO_COLUMNS.map(({ field, price }) => [
  field,
  field === `name` ? 320 : field === `registrar` ? 160 : field === `expiresAt` ? 155 : field === `autoRenew` ? 110 : price || field === `monthlyCost` ? 125 : 140,
])) as Record<PortfolioColumn, number>;

export const getPortfolioColumnWidth = (field: PortfolioColumn, widths: ColumnWidths) => {
  const width = widths[field];
  return typeof width === `number` && Number.isFinite(width) ? width : DEFAULT_COLUMN_WIDTHS[field];
};

const readPixels = (value?: string, fallback = 0) => {
  const number = Number.parseFloat(value ?? ``);
  return Number.isFinite(number) ? number : fallback;
};

const readStyle = (element?: Element | null) => (
  element?.ownerDocument.defaultView?.getComputedStyle(element)
);

const horizontalBox = (element?: Element | null, fallback = 0) => {
  const style = readStyle(element);
  return style ? readPixels(style.paddingLeft) + readPixels(style.paddingRight) + readPixels(style.borderLeftWidth) + readPixels(style.borderRightWidth) : fallback;
};

const elementWidth = (element?: Element | null, fallback = 0) => {
  const style = readStyle(element);
  if (style?.display === `none`) return 0;
  const width = element?.getBoundingClientRect().width;
  return width ? width + readPixels(style?.marginLeft) + readPixels(style?.marginRight) : fallback;
};

const elementGap = (element?: Element | null, fallback = 0) => readPixels(readStyle(element)?.columnGap, fallback);

export const fitPortfolioColumns = (
  domains: readonly DomainRecord[],
  columns: readonly PortfolioColumnDefinition[],
  root: HTMLElement | null,
): ColumnWidths => {
  const document = root?.ownerDocument ?? (typeof window === `undefined` ? undefined : window.document);
  const context = document?.createElement(`canvas`).getContext(`2d`);
  if (!context) return Object.fromEntries(columns.map(({ field }) => [field, DEFAULT_COLUMN_WIDTHS[field]]));
  const rootStyle = readStyle(root);
  const family = (variable: string) => rootStyle?.getPropertyValue(variable).trim() || rootStyle?.fontFamily || `sans-serif`;
  const find = (selector: string, parent?: Element | null) => parent?.querySelector(selector) ?? root?.querySelector(selector);
  const readFont = (element: Element | null | undefined, size = 12, fontFamily = family(`--font-body`)): TextFont => {
    const style = readStyle(element);
    return {
      spacing: readPixels(style?.letterSpacing),
      transform: style?.textTransform ?? `none`,
      font: style?.font || `${style?.fontStyle || `normal`} ${style?.fontWeight || `400`} ${style?.fontSize || `${size}px`} ${style?.fontFamily || fontFamily}`,
    };
  };
  const measure = (value: string, font: TextFont) => {
    let text = value.replace(/\s+/g, ` `);
    if (font.transform === `uppercase`) text = text.toUpperCase();
    if (font.transform === `lowercase`) text = text.toLowerCase();
    if (font.transform === `capitalize`) text = text.replace(/\b\p{L}/gu, letter => letter.toUpperCase());
    if (context.font !== font.font) context.font = font.font;
    return context.measureText(text).width + Math.max(0, [...text].length - 1) * font.spacing;
  };
  const widths: ColumnWidths = {};
  for (const column of columns) {
    const field = column.field;
    const key = getDomainColumnKey(field);
    const cell = find(`.domain-row:not(.domain-row-skeleton) .domain-${key}-cell`);
    const cellPadding = horizontalBox(cell, 32);
    const textElement = field === `name` ? find(`.domain-site-link-label`, cell)
      : field === `registrar` ? find(`.domain-registrar-name`, cell)
      : field === `expiresAt` ? find(`.domain-renewal-date`, cell)
      : field === `autoRenew` ? find(`.domain-auto-renew-text`, cell)
      : field === `renewalPrice` ? find(`.domain-annual-cost`, cell)
      : field === `renewalEstimate` ? find(`.domain-renewal-estimate`, cell)
      : field === `difficulty` ? find(`.domain-project-badge-label`, cell)
      : find(`.domain-column-value-${key}`, cell);
    const font = readFont(textElement ?? cell, field === `name` ? 13 : field === `autoRenew` ? 11 : 12,
      family(field === `name` || field === `autoRenew` ? `--font-bold` : column.price ? `--font-mono` : `--font-body`));
    const secondaryElement = field === `registrar` ? find(`.domain-source-status .statusText`, cell) : find(`.rowStatus .statusText`, cell);
    const secondaryFont = readFont(secondaryElement, 9);
    const identity = find(`.domain-identity`, cell);
    const link = find(`.domain-site-link`, cell);
    const reorder = find(`.domain-reorder`, cell);
    const nameCopy = find(`.domain-name-copy`, cell);
    const heading = find(`.domain-name-heading`, cell);
    const description = find(`.domain-description`, cell);
    const readMore = description?.querySelector(`.domain-description-read-more`);
    const descriptionTrigger = description?.querySelector(`.domain-description-trigger`);
    const descriptionCopy = find(`.domain-name-copy:has(.domain-site-description)`, cell) ?? nameCopy;
    const stackedName = readStyle(descriptionCopy)?.flexDirection === `column`;
    const linkDecoration = horizontalBox(link);
    const nameDecoration = horizontalBox(identity) + horizontalBox(nameCopy)
      + elementWidth(find(`.domain-site-icon`, cell), 28) + elementGap(identity, 9)
      + (reorder || !cell ? elementWidth(reorder, 36) + elementGap(identity, 9) : 0);
    const attentionDecoration = elementWidth(find(`.domain-attention-dot`, cell), 5) + elementGap(link, 6);
    const descriptionFont = readFont(description?.querySelector(`.domain-site-description`), 12);
    const nameGap = elementGap(nameCopy, 6);
    const headingGap = elementGap(heading, 6);
    const previewWidth = elementWidth(cell?.querySelector(`.domain-preview-link`), 22);
    const githubWidth = elementWidth(cell?.querySelector(`.domain-github-link`), 22);
    const descriptionDecoration = horizontalBox(description) + horizontalBox(descriptionTrigger, 8) + elementGap(descriptionTrigger, 4);
    const readMoreDecoration = elementWidth(readMore)
      + (readMore ? elementGap(description, 6) : 0);
    const projectBadge = find(`.domain-project-badge`, cell);
    const projectFont = readFont(find(`.domain-project-badge-label`, projectBadge), field === `name` ? 11 : 12);
    const projectDecoration = horizontalBox(projectBadge, field === `name` ? 12 : 0)
      + elementWidth(find(`.domain-project-badge-icon`, cell), field === `name` ? 11 : 13) + elementGap(projectBadge, field === `name` ? 4 : 6)
      + (field === `name` ? elementWidth(find(`.domain-project-badge-chevron`, projectBadge), 11) + elementGap(projectBadge, 4) : 0);
    const registrar = find(`.domain-registrar`, cell);
    const registrarDecoration = horizontalBox(registrar) + horizontalBox(find(`.domain-registrar-copy`, cell))
      + elementWidth(find(`.registrar-mark`, cell), 25) + elementGap(registrar, 9);
    const sourceDecoration = horizontalBox(find(`.domain-source-status`, cell))
      + elementWidth(find(`.domain-source-icon`, cell), 11) + elementGap(find(`.domain-source-status`, cell), 4);
    const statusDecoration = horizontalBox(find(`.rowStatus`, cell))
      + elementWidth(find(`.statusDotWrap`, cell), 8) + elementGap(find(`.rowStatus`, cell), 4);
    const toggle = find(`.domain-auto-renew`, cell);
    const toggleDecoration = horizontalBox(toggle, 18)
      + elementWidth(find(`.domain-auto-renew-icon`, cell), 13) + elementGap(toggle, 5);
    let contentWidth = measure(`—`, font) + cellPadding;
    for (const domain of domains) {
      const value = getPortfolioColumnDisplay(domain, field);
      let width = measure(value, font);
      if (field === `name`) {
        const hasDescription = Boolean(domain.description?.trim());
        const projectWidth = measure(getPortfolioColumnDisplay(domain, `projectStatus`), projectFont) + projectDecoration;
        const descriptionWidth = hasDescription
          ? Math.min(280, measure(domain.description?.trim() ?? ``, descriptionFont)) + descriptionDecoration
            + elementWidth(description?.querySelector(`.domain-description-edit-icon`), 12) + readMoreDecoration
          : elementWidth(find(`.domain-description-empty`, cell), 22);
        const linkWidth = width + linkDecoration + (getDomainStatus(domain) !== `Active` ? attentionDecoration : 0);
        const headingWidth = linkWidth + projectWidth + headingGap + horizontalBox(heading)
          + (getDomainPreviewLink(domain) ? previewWidth + headingGap : 0)
          + (getDomainGithubRepoLink(domain) ? githubWidth + headingGap : 0);
        width = nameDecoration + (stackedName && hasDescription
          ? Math.max(headingWidth, descriptionWidth)
          : headingWidth + descriptionWidth + (descriptionWidth ? nameGap : 0));
      } else if (field === `registrar`) {
        width = Math.max(width, measure(getDomainSourceBadge(domain).label, secondaryFont) + sourceDecoration) + registrarDecoration;
      } else if (field === `expiresAt`) {
        width = Math.max(width, measure(getDomainStatus(domain), secondaryFont) + statusDecoration);
      } else if (field === `autoRenew`) {
        width = Math.max(width, measure(getPortfolioColumnValue(domain, field) === undefined ? `Unknown` : value, font)) + toggleDecoration;
      } else if (field === `difficulty` && getPortfolioColumnValue(domain, field) !== undefined) {
        width += projectDecoration;
      }
      contentWidth = Math.max(contentWidth, width + cellPadding);
    }
    widths[field] = Math.max(72, Math.min(10000, Math.ceil(contentWidth + 2)));
  }
  return widths;
};
