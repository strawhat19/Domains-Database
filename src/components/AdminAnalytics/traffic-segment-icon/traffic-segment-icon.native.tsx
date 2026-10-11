import { Image } from 'expo-image';
import { View } from 'react-native';
import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../../shared/elementProps';
import { trafficFlags, trafficBrands } from './assets.native';
import { useTheme } from '../../../shared/themeContext/useTheme';
import type { NativeTrafficSegmentIdentity } from './traffic-segment-identity.native';

const TrafficSegmentIcon = ({ id, color, identity }: { id: string; color?: string; identity: NativeTrafficSegmentIdentity }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [failedAsset, setFailedAsset] = useState(``);
  const { Icon, brand, countryCode } = identity;
  const assetKey = countryCode ? `flag:${countryCode}` : brand ? `brand:${brand.key}` : ``;
  const source = countryCode ? trafficFlags[countryCode] : brand ? trafficBrands[brand.key] : undefined;
  const hasImage = source !== undefined && failedAsset !== assetKey;
  const hasFlag = !!countryCode && hasImage;
  return <View
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility={`no-hide-descendants`}
    {...elementProps(id)}
    style={[styles.root, hasFlag && styles.flag]}
  >
    {hasImage ? <Image
      source={source}
      accessible={false}
      {...elementProps(`${id}-${hasFlag ? `flag` : `brand`}`)}
      contentFit={hasFlag ? `cover` : `contain`}
      recyclingKey={assetKey}
      onError={() => setFailedAsset(assetKey)}
      tintColor={hasFlag ? undefined : brand?.color === `currentColor` ? palette.ink : brand?.color}
      style={hasFlag ? styles.flagImage : styles.brandImage}
    /> : <Icon size={15} color={color ?? palette.muted} {...elementProps(`${id}-glyph`)} />}
  </View>;
};

export default TrafficSegmentIcon;
