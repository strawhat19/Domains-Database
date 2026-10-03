import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { createStyles } from './styles.native';
import { Globe2 } from 'lucide-react-native';
import { useDomainSiteIcon } from './useDomainSiteIcon';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

interface DomainSiteIconProps {
  id: string;
  size?: number;
  domain: string;
  compact?: boolean;
}

const SiteIconContent = ({ id, domain, size = 28, compact = false }: DomainSiteIconProps) => {
  const { palette } = useTheme();
  const { failed, loaded, onLoad, onError } = useDomainSiteIcon();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const imageSize = compact ? size : Math.min(20, size);
  const fallbackSize = compact ? size : Math.min(16, size);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      {...elementProps(`domain-site-icon`, id)}
      style={[styles.container, compact && styles.compact, { width: size, height: size }]}
    >
      {(!loaded || failed) && (
        <Globe2
          size={fallbackSize}
          strokeWidth={1.4}
          color={compact ? palette.accent : palette.muted}
          {...elementProps(`domain-site-icon-fallback`, id)}
        />
      )}
      {!failed && (
        <Image
          onLoad={onLoad}
          onError={onError}
          resizeMode={`contain`}
          accessibilityIgnoresInvertColors
          source={{ uri: `https://${domain}/favicon.ico` }}
          {...elementProps(`domain-site-icon-image`, id)}
          style={[styles.image, { width: imageSize, height: imageSize, opacity: loaded ? 1 : 0 }]}
        />
      )}
    </View>
  );
};

const DomainSiteIcon = (props: DomainSiteIconProps) => (
  <SiteIconContent key={props.domain} {...props} />
);

export default DomainSiteIcon;
