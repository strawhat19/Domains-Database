import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { createStyles } from './styles.native';
import { Globe2 } from 'lucide-react-native';
import { useDomainSiteIcon } from './useDomainSiteIcon';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { getDomainSiteIconUrl } from '../../shared/domainSiteIcon';

interface DomainSiteIconProps {
  id: string;
  size?: number;
  domain: string;
  iconUrl?: string;
  compact?: boolean;
}

const SiteIconContent = ({ id, sourceUrl, size = 28, compact = false }: DomainSiteIconProps & { sourceUrl: string }) => {
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
      {(!sourceUrl || !loaded || failed) && (
        <Globe2
          size={fallbackSize}
          strokeWidth={1.4}
          color={compact ? palette.accent : palette.muted}
          {...elementProps(`domain-site-icon-fallback`, id)}
        />
      )}
      {!!sourceUrl && !failed && (
        <Image
          onLoad={onLoad}
          onError={onError}
          resizeMode={`contain`}
          accessibilityIgnoresInvertColors
          source={{ uri: sourceUrl }}
          {...elementProps(`domain-site-icon-image`, id)}
          style={[styles.image, { width: imageSize, height: imageSize, opacity: loaded ? 1 : 0 }]}
        />
      )}
    </View>
  );
};

const DomainSiteIcon = (props: DomainSiteIconProps) => {
  const sourceUrl = getDomainSiteIconUrl({ name: props.domain, meta: { siteIconUrl: props.iconUrl ?? `` } });
  return <SiteIconContent key={sourceUrl} {...props} sourceUrl={sourceUrl} />;
};

export default DomainSiteIcon;
