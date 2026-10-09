import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { useTagPicker } from './useTagPickerState';
import type { TagPillsProps, TagPickerProps } from './types';
import { Text, View, Pressable, ScrollView } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { DOMAIN_TAGS, normalizeDomainTags } from '../../shared/domainTags';

export const TagPills = ({ id, value }: TagPillsProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`tag-picker-pills`, id)} style={styles.pills}>
      {normalizeDomainTags(value).map(tag => (
        <Text key={tag} {...elementProps(`tag-picker-pill`, `${id}-${tag.toLowerCase()}`)} style={styles.pill}>
          {tag}
        </Text>
      ))}
    </View>
  );
};

const TagPicker = (props: TagPickerProps) => {
  const { id, label, disabled = false } = props;
  const { palette } = useTheme();
  const picker = useTagPicker(props);
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View {...elementProps(`tag-picker`, id)} style={styles.picker} onAccessibilityEscape={picker.close}>
      <Pressable
        disabled={disabled}
        {...elementProps(id)}
        onPress={picker.toggle}
        accessibilityRole={`combobox`}
        accessibilityState={{ expanded: picker.open, disabled }}
        style={[styles.trigger, disabled && styles.disabled]}
        accessibilityLabel={`${label}: ${picker.tags.length ? picker.tags.join(`, `) : `No Tags`}`}
      >
        {Boolean(picker.tags.length) && <TagPills id={`${id}-values`} value={picker.tags} />}
        <Text {...elementProps(`tag-picker-cue`, id)} style={styles.cue}>
          {picker.tags.length ? `Add Tags` : `Choose Tags`}
        </Text>
      </Pressable>
      {picker.open && (
        <View {...elementProps(`tag-picker-options`, id)} style={styles.options} accessibilityLabel={label}>
          <ScrollView
            nestedScrollEnabled
            style={styles.optionScroll}
            keyboardShouldPersistTaps={`handled`}
            {...elementProps(`tag-picker-option-scroll`, id)}
          >
            {DOMAIN_TAGS.map(tag => {
              const selected = picker.tags.includes(tag);
              const optionId = `${id}-${tag.toLowerCase()}`;
              return (
                <Pressable
                  key={tag}
                  accessibilityLabel={tag}
                  accessibilityRole={`checkbox`}
                  onPress={() => picker.choose(tag)}
                  accessibilityState={{ checked: selected }}
                  {...elementProps(`tag-picker-option`, optionId)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text {...elementProps(`tag-picker-option-pill`, optionId)} style={styles.pill}>{tag}</Text>
                  {selected && <Text {...elementProps(`tag-picker-option-selection`, optionId)} style={styles.selection}>{`Selected`}</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={picker.close}
            style={styles.done}
            accessibilityRole={`button`}
            {...elementProps(`tag-picker-done`, id)}
            accessibilityLabel={`Done Choosing ${label}`}
          >
            <Text {...elementProps(`tag-picker-done-label`, id)} style={styles.doneLabel}>{`Done`}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export type { TagPillsProps, TagPickerProps } from './types';
export default TagPicker;
