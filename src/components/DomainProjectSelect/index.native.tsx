import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Check, Circle, ChevronDown } from 'lucide-react-native';
import { Text, View, Pressable } from 'react-native';
import { useDomainProjectSelect } from './useDomainProjectSelect';
import DomainProjectBadge from '../DomainProjectBadge/index.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES, DEFAULT_DOMAIN_PROJECT_STATUS, normalizeDomainProjectStatus } from '../../shared/domainProject';

interface DomainProjectSelectProps {
  id: string;
  label: string;
  value?: string;
  disabled?: boolean;
  field: `projectStatus` | `difficulty`;
  onChange: (value: string | undefined) => void;
}

const DomainProjectSelect = ({ id, field, label, value, onChange, disabled = false }: DomainProjectSelectProps) => {
  const { palette } = useTheme();
  const select = useDomainProjectSelect({ onChange, disabled });
  const styles = useMemo(() => createStyles(palette), [palette]);
  const options = field === `projectStatus` ? DOMAIN_PROJECT_STATUSES : DOMAIN_DIFFICULTIES;
  const allowUnset = field !== `projectStatus`;
  const currentValue = allowUnset ? value : normalizeDomainProjectStatus(value);
  const selected = options.find(option => option.value === currentValue);
  const placeholder = allowUnset ? `Not Set` : DEFAULT_DOMAIN_PROJECT_STATUS;
  return (
    <View {...elementProps(`domain-project-select`, id)} style={styles.select}>
      <Pressable
        disabled={disabled}
        {...elementProps(id)}
        accessibilityRole={`combobox`}
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityState={{ expanded: select.open, disabled }}
        onPress={select.toggle}
        style={[styles.trigger, disabled && styles.disabled]}
      >
        <View {...elementProps(`domain-project-select-value`, id)} style={styles.value}>
          {selected ? (
            <DomainProjectBadge id={`${id}-selected`} field={field} value={selected.value} />
          ) : (
            <Text {...elementProps(`domain-project-select-placeholder`, id)} style={styles.placeholder}>
              {placeholder}
            </Text>
          )}
        </View>
        <ChevronDown size={15} color={palette.muted} {...elementProps(`domain-project-select-chevron`, id)} />
      </Pressable>
      {select.open && (
        <View
          style={styles.options}
          accessibilityRole={`radiogroup`}
          accessibilityLabel={label}
          {...elementProps(`domain-project-select-options`, id)}
        >
          {allowUnset && <Pressable
            accessibilityRole={`radio`}
            accessibilityLabel={`Not Set`}
            onPress={() => select.choose(undefined)}
            accessibilityState={{ checked: !selected }}
            {...elementProps(`domain-project-select-option-unset`, id)}
            style={[styles.option, !selected && styles.optionSelected]}
          >
            <View {...elementProps(`domain-project-select-unset-value`, id)} style={styles.unsetValue}>
              <Circle size={14} color={palette.muted} {...elementProps(`domain-project-select-unset-icon`, id)} />
              <Text {...elementProps(`domain-project-select-unset-label`, id)} style={styles.placeholder}>{`Not Set`}</Text>
            </View>
            {!selected && <Check size={14} color={palette.accent} {...elementProps(`domain-project-select-unset-check`, id)} />}
          </Pressable>}
          {options.map(option => {
            const optionId = `${id}-${option.value.toLowerCase().replaceAll(` `, `-`)}`;
            const checked = currentValue === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole={`radio`}
                accessibilityLabel={option.label}
                onPress={() => select.choose(option.value)}
                accessibilityState={{ checked }}
                {...elementProps(`domain-project-select-option`, optionId)}
                style={[styles.option, checked && styles.optionSelected]}
              >
                <DomainProjectBadge id={optionId} field={field} value={option.value} />
                {checked && <Check size={14} color={palette.accent} {...elementProps(`domain-project-select-option-check`, optionId)} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default DomainProjectSelect;
