import { useMemo } from 'react';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { RecentDomainSearchesProps } from './types';
import { newestSearches, searchSuffix } from './presentation';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Search, Trash2, History, AlertTriangle } from 'lucide-react-native';

const RecentDomainSearches = ({ error, records, loading, onClear, onSearch, inline = false, disabled = false }: RecentDomainSearchesProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!records.length && !loading && !error) return null;

  const clearControl = (records.length > 0 || !!error) && (
    <Pressable
      onPress={onClear}
      disabled={loading}
      accessibilityRole={`button`}
      accessibilityLabel={`Clear Search History`}
      accessibilityState={{ disabled: loading }}
      {...elementProps(`recent-domain-searches-clear`)}
      style={({ pressed }) => [styles.clear, inline && styles.inlineClear, (pressed || loading) && styles.faded]}
    >
      <Trash2 {...elementProps(`recent-domain-searches-clear-icon`)} size={12} color={palette.muted} />
      <Text {...elementProps(`recent-domain-searches-clear-text`)} style={styles.clearText}>{`Clear History`}</Text>
    </Pressable>
  );
  const searchRow = loading ? (
    <View
      accessibilityElementsHidden
      importantForAccessibility={`no-hide-descendants`}
      style={[styles.row, inline && styles.inlineRow]}
      {...elementProps(`recent-domain-searches-loading`)}
    >
      {[0, 1, 2].map(index => (
        <View key={index} {...elementProps(`recent-domain-searches-skeleton`, `${index}`)} style={styles.skeleton}>
          <StackPillShape fill={palette.skeleton} stroke={palette.skeleton} id={`recent-domain-searches-skeleton-shape-${index}`} />
        </View>
      ))}
    </View>
  ) : records.length > 0 && (
    <View {...elementProps(`recent-domain-searches-row`)} style={[styles.row, inline && styles.inlineRow]}>
      {newestSearches(records).map((record, index) => {
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
      })}
    </View>
  );

  return (
    <View {...elementProps(`recent-domain-searches`)} style={[styles.section, inline && styles.inlineSection]}>
      <View {...elementProps(`recent-domain-searches-strip`)} style={inline ? styles.inlineStrip : styles.strip}>
        <View {...elementProps(`recent-domain-searches-heading`)} style={[styles.heading, inline && styles.inlineHeading]}>
          <View {...elementProps(`recent-domain-searches-title`)} style={styles.title}>
            <History {...elementProps(`recent-domain-searches-icon`)} size={14} color={inline ? palette.accent : palette.muted} />
            <Text {...elementProps(`recent-domain-searches-title-text`)} style={[styles.titleText, inline && styles.inlineTitleText]} accessibilityRole={`header`}>
              {`Recent Searches`}
            </Text>
          </View>
          {!inline && clearControl}
        </View>
        {inline && searchRow ? (
          <ScrollView
            horizontal
            style={styles.inlineScroll}
            contentContainerStyle={styles.inlineTrack}
            keyboardShouldPersistTaps={`handled`}
            {...elementProps(`recent-domain-searches-scroll`)}
          >
            {searchRow}
          </ScrollView>
        ) : searchRow}
        {inline && clearControl}
      </View>
      {!!error && (
        <View {...elementProps(`recent-domain-searches-warning`)} style={styles.warning} accessibilityLiveRegion={`polite`}>
          <AlertTriangle {...elementProps(`recent-domain-searches-warning-icon`)} size={13} color={palette.warning} />
          <Text {...elementProps(`recent-domain-searches-warning-text`)} style={styles.warningText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default RecentDomainSearches;
