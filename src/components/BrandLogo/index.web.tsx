import type { CSSProperties } from 'react';
import { StyleSheet } from 'react-native';
import type { BrandLogoProps } from './types';
import { logoRecords, recordPath, useBrandLogo } from './useBrandLogo';

const BrandLogo = ({ id, style, className, width = 1080, height = 280 }: BrandLogoProps) => {
  const brand = useBrandLogo();
  return (
    <svg role={`img`} width={width} height={height} id={id} className={className} viewBox={`0 0 1080 280`} aria-label={brand.name} style={StyleSheet.flatten(style) as CSSProperties} xmlns={`http://www.w3.org/2000/svg`} fontFamily={`Avenir Next, Inter, Arial, sans-serif`}>
      {logoRecords.map(record => (
        <g key={record.id} id={`${id}-record-${record.id}`} className={`brand-logo-record`} transform={`translate(${record.column * 169} 0)`}>
          <path id={`${id}-record-${record.id}-shape`} className={`brand-logo-record-shape`} fill={brand.ink} d={recordPath(record.row)} />
          <circle r={8} cx={178} cy={81 + record.row * 65} fill={`#19AEAB`} id={`${id}-record-${record.id}-dot`} className={`brand-logo-record-dot`} />
          <text x={70} y={90 + record.row * 65} fontSize={24} fontWeight={800} letterSpacing={-.8} fill={brand.label} id={`${id}-record-${record.id}-label`} className={`brand-logo-record-label`}>{`.${record.id}`}</text>
        </g>
      ))}
      <g id={`${id}-wordmark`} className={`brand-logo-wordmark`} fontSize={112} fontWeight={800} letterSpacing={-3}>
        <text x={442} y={134} fill={brand.ink} id={`${id}-first-word`} className={`brand-logo-first-word`}>{brand.firstWord}</text>
        <text x={442} y={240} fill={brand.accent} id={`${id}-last-word`} className={`brand-logo-last-word`}>{brand.lastWord}</text>
      </g>
    </svg>
  );
};

export default BrandLogo;
