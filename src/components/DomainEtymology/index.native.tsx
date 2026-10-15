import { useMemo } from 'react';
import type { Props } from './types';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { urlParts, wordOrigins, exampleUrl, etymologyCaption, type UrlPartKey } from './content';

const DomainEtymology = ({ id, compact = false }: Props) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const renderPart = (key: UrlPartKey) => {
    const isHostname = key === `subdomain` || key === `name` || key === `tld`;
    return (
      <View key={key} {...elementProps(`domain-etymology-part`, `${id}-${key}`)} style={[styles.part, compact && styles.compactPart]}>
        <Text {...elementProps(`domain-etymology-part-value`, `${id}-${key}`)} style={[styles.partValue, isHostname && styles.hostnameValue, compact && styles.compactValue]}>{urlParts[key].value}</Text>
        <Text {...elementProps(`domain-etymology-part-label`, `${id}-${key}`)} style={styles.partLabel}>{urlParts[key].label}</Text>
      </View>
    );
  };

  if (compact) return (
    <View
      accessible
      style={styles.compact}
      {...elementProps(`domain-etymology-compact`, id)}
      accessibilityLabel={`URL Anatomy: ${Object.values(urlParts).map(part => `${part.label}: ${part.value}`).join(`. `)}`}
    >
      {(Object.keys(urlParts) as UrlPartKey[]).map(renderPart)}
    </View>
  );

  return (
    <View {...elementProps(`domain-etymology`, id)} style={styles.figure}>
      <View {...elementProps(`domain-etymology-heading`, id)} style={styles.heading}>
        <Text {...elementProps(`domain-etymology-eyebrow`, id)} style={styles.eyebrow}>{`WORDS & WEB ADDRESSES`}</Text>
        <Text accessibilityRole={`header`} {...elementProps(`domain-etymology-title`, id)} style={styles.title}>{`A Word With Roots In Ownership`}</Text>
        <Text {...elementProps(`domain-etymology-intro`, id)} style={styles.intro}>{`Before it named a place on the web, “domain” described land or an area under someone's control.`}</Text>
      </View>
      <View {...elementProps(`domain-etymology-origins`, id)} style={styles.origins}>
        {wordOrigins.map((origin, index) => (
          <View key={origin.word} {...elementProps(`domain-etymology-origin-row`, `${id}-${origin.word}`)} style={styles.originRow}>
            <View {...elementProps(`domain-etymology-origin`, `${id}-${origin.word}`)} style={styles.origin}>
              <Text {...elementProps(`domain-etymology-language`, `${id}-${origin.word}`)} style={styles.language}>{origin.language}</Text>
              <Text {...elementProps(`domain-etymology-word`, `${id}-${origin.word}`)} style={styles.word}>{origin.word}</Text>
              <Text {...elementProps(`domain-etymology-meaning`, `${id}-${origin.word}`)} style={styles.meaning}>{origin.meaning}</Text>
            </View>
            {index < wordOrigins.length - 1 && <Text accessible={false} {...elementProps(`domain-etymology-origin-arrow`, `${id}-${index}`)} style={styles.originArrow}>{`↓`}</Text>}
          </View>
        ))}
      </View>
      <Text {...elementProps(`domain-etymology-roots-note`, id)} style={styles.rootsNote}>{`Word roots, simplified`}</Text>
      <View {...elementProps(`domain-etymology-anatomy`, id)} style={styles.anatomy}>
        <Text accessibilityRole={`header`} {...elementProps(`domain-etymology-anatomy-title`, id)} style={styles.anatomyTitle}>{`A Domain Is Part Of A URL`}</Text>
        <Text selectable {...elementProps(`domain-etymology-full-url`, id)} style={styles.fullUrl}>{exampleUrl}</Text>
        <View {...elementProps(`domain-etymology-url-parts`, id)} style={styles.urlParts}>
          {renderPart(`scheme`)}
          <View {...elementProps(`domain-etymology-hostname`, id)} style={styles.hostname}>
            <View {...elementProps(`domain-etymology-hostname-parts`, id)} style={styles.hostnameParts}>
              {renderPart(`subdomain`)}
              <View {...elementProps(`domain-etymology-registered-domain`, id)} style={styles.registeredDomain}>
                <View {...elementProps(`domain-etymology-registered-parts`, id)} style={styles.registeredParts}>
                  {renderPart(`name`)}
                  {renderPart(`tld`)}
                </View>
                <Text {...elementProps(`domain-etymology-registered-label`, id)} style={styles.groupLabel}>{`Registered Domain · This Example`}</Text>
              </View>
            </View>
            <Text {...elementProps(`domain-etymology-hostname-label`, id)} style={[styles.groupLabel, styles.hostnameLabel]}>{`Hostname · shop.example.com`}</Text>
          </View>
          {renderPart(`path`)}
          {renderPart(`query`)}
          {renderPart(`fragment`)}
        </View>
      </View>
      <Text {...elementProps(`domain-etymology-caption`, id)} style={styles.caption}>{etymologyCaption}</Text>
    </View>
  );
};

export default DomainEtymology;
