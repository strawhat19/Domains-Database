import { useMemo, useState } from 'react';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import RecentSearchScroller from './RecentSearchScroller.native';
import type { RecentDomainSearchesProps } from './types';
import { newestSearches, searchSuffix } from './presentation';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Search, Trash2, History, AlertTriangle } from 'lucide-react-native';

const RecentDomainSearches = ({ error, records, loading, onClear, onSearch, maxHeight, inline = false, disabled = false }: RecentDomainSearchesProps) => {
  const { palette } = useTheme();
  const [warningHeight, setWarningHeight] = useState(18);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const heightLimit = inline && typeof maxHeight === `number` && Number.isFinite(maxHeight) && maxHeight > 0 ? maxHeight : undefined;
  const warningBudget = error ? warningHeight + 10 : 0;
  const availableHeight = heightLimit === undefined ? 36 : Math.max(0, heightLimit - 52 - warningBudget);
  const maximumRows = Math.max(1, Math.floor(availableHeight / 36));
  const rowCount = Math.max(1, Math.min(maximumRows, loading ? 3 : records.length));
  const scrollHeight = Math.min(rowCount * 36, availableHeight);
  const warningLines = heightLimit === undefined ? undefined : Math.max(1, Math.floor((heightLimit - (loading || records.length ? 98 : 52)) / 18));
  if (!records.length && !loading && !error) return null;

  const clearControl = (records.length > 0 || !!error) && (
    <Pressable
      hitSlop={6}
      onPress={onClear}
      disabled={loading}
      accessibilityRole={`button`}
      accessibilityLabel={`Clear Search History`}
      accessibilityState={{ disabled: loading }}
      {...elementProps(`recent-domain-searches-clear`)}
      style={({ pressed }) => [styles.clear, inline && styles.inlineClear, (pressed || loading) && styles.faded]}
    >
      <Trash2 {...elementProps(`recent-domain-searches-clear-icon`)} size={14} color={palette.muted} />
      <Text {...elementProps(`recent-domain-searches-clear-text`)} style={styles.clearText}>{`Clear`}</Text>
    </Pressable>
  );
  const searchItems = loading
    ? [0, 1, 2].map(index => (
        <View key={index} {...elementProps(`recent-domain-searches-skeleton`, `${index}`)} style={styles.skeleton}>
          <StackPillShape fill={palette.skeleton} stroke={palette.skeleton} id={`recent-domain-searches-skeleton-shape-${index}`} />
        </View>
      ))
    : newestSearches(records).map((record, index) => {
        const accent = index % 2 === 0;
        const color = accent ? palette.accent : palette.ink;
        const suffix = searchSuffix(record.query, index);
        return (
          <Pressable
            hitSlop={4}
            key={record.query}
            disabled={disabled}
            accessibilityRole={`button`}
            accessibilityState={{ disabled }}
            onPress={() => onSearch(record.query)}
            accessibilityLabel={`Search ${record.query} Again`}
            {...elementProps(`recent-domain-search-pill`, suffix)}
            style={({ pressed }) => [styles.pill, inline && styles.inlinePill, (pressed || disabled) && styles.faded]}
          >
            <StackPillShape
              stroke={palette.line}
              fill={accent ? palette.subtle : palette.input}
              id={`recent-domain-search-pill-shape-${suffix}`}
            />
            <Search {...elementProps(`recent-domain-search-pill-icon`, suffix)} size={14} color={color} />
            <Text {...elementProps(`recent-domain-search-pill-label`, suffix)} style={[styles.label, inline && styles.inlineLabel, { color }]} numberOfLines={1}>
              {record.query}
            </Text>
          </Pressable>
        );
      });
  const columns = Array.from({ length: Math.ceil(searchItems.length / rowCount) }, (_, index) => searchItems.slice(index * rowCount, (index + 1) * rowCount));

  return (
    <View {...elementProps(`recent-domain-searches`)} style={[styles.section, inline && styles.inlineSection, heightLimit !== undefined && { maxHeight: heightLimit }]}>
      <View {...elementProps(`recent-domain-searches-strip`)} style={inline ? styles.inlineStrip : styles.strip}>
        <View {...elementProps(`recent-domain-searches-heading`)} style={[styles.heading, inline && styles.inlineHeading]}>
          <View
            style={styles.title}
            accessible
            accessibilityLabel={`Recents`}
            accessibilityRole={`header`}
            {...elementProps(`recent-domain-searches-title`)}
          >
            <History accessible={false} {...elementProps(`recent-domain-searches-icon`)} size={14} color={inline ? palette.accent : palette.muted} />
            <Text {...elementProps(`recent-domain-searches-title-text`)} style={[styles.titleText, inline && styles.inlineTitleText]}>
              {`Recents`}
            </Text>
          </View>
          {clearControl}
        </View>
        {!!searchItems.length && scrollHeight > 0 && (
          <RecentSearchScroller
            styles={styles}
            inline={inline}
            palette={palette}
            height={scrollHeight}
            suffix={inline ? `inline` : `full`}
          >
            <View
              style={styles.columnTrack}
              accessibilityElementsHidden={loading}
              importantForAccessibility={loading ? `no-hide-descendants` : `auto`}
              {...elementProps(loading ? `recent-domain-searches-loading` : `recent-domain-searches-row`)}
            >
              {columns.map((column, index) => (
                <View key={index} {...elementProps(`recent-domain-searches-column`, `${index}`)} style={styles.queryColumn}>
                  {column}
                </View>
              ))}
            </View>
          </RecentSearchScroller>
        )}
      </View>
      {!!error && (
        <View
          style={styles.warning}
          accessibilityLiveRegion={`polite`}
          {...elementProps(`recent-domain-searches-warning`)}
          onLayout={({ nativeEvent }) => setWarningHeight(current => current === nativeEvent.layout.height ? current : nativeEvent.layout.height)}
        >
          <AlertTriangle {...elementProps(`recent-domain-searches-warning-icon`)} size={13} color={palette.warning} />
          <Text {...elementProps(`recent-domain-searches-warning-text`)} style={styles.warningText} numberOfLines={warningLines} accessibilityLabel={error}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default RecentDomainSearches;
