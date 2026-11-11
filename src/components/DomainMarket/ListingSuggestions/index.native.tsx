import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Globe2, Plus, Tag, X } from 'lucide-react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { decorativeIconProps, elementProps } from '../../../shared/elementProps';
import { useListingSuggestions, type ListingSuggestionsProps } from './useListingSuggestions';

type NativeSuggestionsProps = ListingSuggestionsProps & { style?: StyleProp<ViewStyle> };

const ListingSuggestions = ({ onSelect, onDismiss, excludedDomains, dismissedIds, disabled, style, variant = `browse` }: NativeSuggestionsProps) => {
  const { suggestions, loading, failed, retry, hasDismissedSuggestions } = useListingSuggestions(excludedDomains, dismissedIds);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const sell = variant === `sell`;
  if (!sell && !suggestions.length && !hasDismissedSuggestions) return null;

  const cards = suggestions.map(({ id, name, estimateLabel, fields }) => {
    const detail = <>
      <View {...elementProps(`market-listing-suggestion-heading`, id)} style={[styles.heading, styles.cardHeading]}>
        <Globe2 size={16} color={palette.accent} {...decorativeIconProps} />
        <Text {...elementProps(`market-listing-suggestion-domain`, id)} style={styles.name} numberOfLines={2}>{name}</Text>
      </View>
      <Text {...elementProps(`market-listing-suggestion-estimate`, id)} style={styles.estimate}>
        {estimateLabel ? <>{`Saved Estimate `}<Text style={styles.amount}>{estimateLabel}</Text></> : `No Saved Estimate`}
      </Text>
    </>;
    return <View key={id} {...elementProps(`market-listing-suggestion`, id)} style={[styles.card, sell && styles.sellCard, disabled && styles.disabled]}>
      {sell ? (
        <Pressable
          disabled={disabled}
          accessibilityRole={`button`}
          onPress={() => onSelect(name, fields)}
          accessibilityLabel={`Use ${name} In Listing`}
          accessibilityState={{ disabled: Boolean(disabled) }}
          {...elementProps(`market-listing-suggestion-select`, id)}
          style={({ pressed }) => [styles.cardContent, styles.sellSelect, pressed && styles.pressed]}
        >
          {detail}
          <View style={styles.heading}>
            <Plus size={13} color={palette.accent} {...decorativeIconProps} />
            <Text style={styles.pickText}>{`Use in Listing`}</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.cardContent}>
          {detail}
          <Pressable {...elementProps(`market-listing-suggestion-select`, id)} disabled={disabled} accessibilityRole={`button`} accessibilityLabel={`List ${name} For Sale`} accessibilityState={{ disabled: Boolean(disabled) }} onPress={() => onSelect(name, fields)} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Plus size={14} color={palette.accent} {...decorativeIconProps} />
            <Text style={styles.buttonText}>{`List For Sale`}</Text>
          </Pressable>
        </View>
      )}
      <Pressable
        disabled={disabled}
        accessibilityRole={`button`}
        onPress={() => onDismiss(id)}
        accessibilityLabel={`Dismiss ${name} Suggestion`}
        accessibilityState={{ disabled: Boolean(disabled) }}
        {...elementProps(`market-listing-suggestion-dismiss`, id)}
        style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
      >
        <X size={16} color={palette.muted} {...decorativeIconProps} />
      </Pressable>
    </View>;
  });

  return <View {...elementProps(`market-listing-suggestions`)} style={[styles.section, style]}>
    <View {...elementProps(`market-listing-suggestions-heading`)} style={styles.heading}>
      <Tag size={16} color={palette.accent} {...decorativeIconProps} />
      <Text {...elementProps(`market-listing-suggestions-title`)} accessibilityRole={`header`} style={styles.title}>{`Suggested Domains To List`}</Text>
    </View>
    {sell && loading ? (
      <View {...elementProps(`market-listing-suggestions-loading`)} style={styles.grid} accessible accessibilityRole={`progressbar`} accessibilityLabel={`Loading Your Domains`} accessibilityState={{ busy: true }}>
        {[1, 2, 3, 4].map(index => <View key={index} {...elementProps(`market-listing-suggestion-skeleton`, String(index))} style={[styles.card, styles.sellCard, styles.skeleton]}><View style={styles.skeletonName} /><View style={styles.skeletonEstimate} /></View>)}
      </View>
    ) : sell && failed ? (
      <View {...elementProps(`market-listing-suggestions-error`)} style={styles.section}>
        <Text style={styles.estimate} accessibilityLiveRegion={`polite`}>{`Could not load your domains.`}</Text>
        <Pressable {...elementProps(`market-listing-suggestions-retry`)} style={styles.button} accessibilityRole={`button`} onPress={retry}><Text style={styles.buttonText}>{`Try Again`}</Text></Pressable>
      </View>
    ) : !cards.length ? (
      <Text {...elementProps(`market-listing-suggestions-empty`)} style={styles.estimate} accessibilityLiveRegion={`polite`}>{hasDismissedSuggestions ? `No more domain suggestions.` : `No eligible domains in your portfolio.`}</Text>
    ) : sell ? (
      <View {...elementProps(`market-listing-suggestions-list`)} style={styles.grid}>{cards}</View>
    ) : (
      <ScrollView horizontal {...elementProps(`market-listing-suggestions-list`)} contentContainerStyle={styles.list} keyboardShouldPersistTaps={`handled`}>{cards}</ScrollView>
    )}
  </View>;
};

export default ListingSuggestions;
