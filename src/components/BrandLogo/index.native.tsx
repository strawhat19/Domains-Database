import { Platform } from 'react-native';
import type { BrandLogoProps } from './types';
import Svg, { G, Text, Path, Circle } from 'react-native-svg';
import { elementProps } from '../../shared/elementProps';
import { logoRecords, recordPath, useBrandLogo } from './useBrandLogo';

const BrandLogo = ({ id, width = 214, height = 56, style }: BrandLogoProps) => {
  const brand = useBrandLogo();
  return (
    <Svg accessible width={width} height={height} style={style} viewBox={`0 0 1080 280`} accessibilityRole={`image`} accessibilityLabel={brand.name} fontFamily={Platform.OS === `ios` ? `Avenir Next` : `sans-serif`} {...elementProps(id)}>
      {logoRecords.map(record => (
        <G key={record.id} transform={`translate(${record.column * 169} 0)`} {...elementProps(`${id}-record`, record.id)}>
          <Path fill={brand.ink} d={recordPath(record.row)} {...elementProps(`${id}-record-shape`, record.id)} />
          <Circle r={8} cx={178} cy={81 + record.row * 65} fill={`#19AEAB`} {...elementProps(`${id}-record-dot`, record.id)} />
          <Text x={70} y={90 + record.row * 65} fontSize={24} fontWeight={800} letterSpacing={-.8} fill={brand.label} {...elementProps(`${id}-record-label`, record.id)}>{`.${record.id}`}</Text>
        </G>
      ))}
      <G fontSize={112} fontWeight={800} letterSpacing={-3} {...elementProps(`${id}-wordmark`)}>
        <Text x={442} y={134} fill={brand.ink} {...elementProps(`${id}-first-word`)}>{brand.firstWord}</Text>
        <Text x={442} y={240} fill={brand.accent} {...elementProps(`${id}-last-word`)}>{brand.lastWord}</Text>
      </G>
    </Svg>
  );
};

export default BrandLogo;
