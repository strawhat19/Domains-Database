import './styles.scss';
import { StyleSheet } from 'react-native';
import type { CSSProperties } from 'react';
import type { ResponsiveDomainHeadingProps } from './types';
import { useResponsiveDomainHeading } from './useResponsiveDomainHeading.web';

const ResponsiveDomainHeading = ({ id, style, htmlFor, fullText, shortText, className, forceCompact, accessibilityRole }: ResponsiveDomainHeadingProps) => {
  const { compact, measureRef, wrapperRef } = useResponsiveDomainHeading(fullText, forceCompact);
  const resolved = StyleSheet.flatten(style);
  const textStyle: CSSProperties | undefined = resolved ? {
    fontSize: resolved.fontSize,
    fontStyle: resolved.fontStyle,
    fontFamily: resolved.fontFamily,
    letterSpacing: resolved.letterSpacing,
    fontWeight: resolved.fontWeight ?? `normal`,
    textAlign: resolved.textAlign === `auto` ? undefined : resolved.textAlign,
    lineHeight: resolved.lineHeight === undefined ? undefined : `${resolved.lineHeight}px`,
    color: typeof resolved.color === `string` ? resolved.color : undefined,
  } : undefined;
  const Tag = htmlFor ? `label` : accessibilityRole === `header` ? `h1` : `span`;
  const headingClass = className ?? id;

  return (
    <div ref={wrapperRef} id={`${id}-wrap`} className={`responsive-domain-heading`}>
      <Tag id={id} style={textStyle} {...(htmlFor ? { htmlFor } : {})} className={`${headingClass} responsive-domain-heading-text`}>
        {compact ? shortText : fullText}
      </Tag>
      <span
        aria-hidden
        ref={measureRef}
        style={textStyle}
        id={`${id}-measure`}
        className={`${headingClass} responsive-domain-heading-probe`}
      >
        {fullText}
      </span>
    </div>
  );
};

export default ResponsiveDomainHeading;
