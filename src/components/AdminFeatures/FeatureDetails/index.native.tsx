import { useMemo } from 'react';
import { createStyles } from './styles.native';
import type { FeatureDetailsProps } from './types';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Mail, SunMoon, MoveHorizontal, X } from 'lucide-react-native';
import { useReducedMotion } from '../../../shared/common/useReducedMotion';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

const featureIcons = { contact: Mail, themeToggle: SunMoon, notifications: Bell, domainMarquee: MoveHorizontal };

const FeatureDetails = ({ roles, feature, onClose }: FeatureDetailsProps) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const Icon = featureIcons[feature.key];
  const dismiss = () => { if (!roles.saving) onClose(); };
  return <Modal transparent visible animationType={reducedMotion ? `none` : `fade`} onRequestClose={dismiss} {...elementProps(`admin-feature-details-modal`, feature.key)}>
    <View {...elementProps(`admin-feature-details-overlay`, feature.key)} style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Pressable {...elementProps(`admin-feature-details-backdrop`, feature.key)} style={styles.backdrop} onPress={dismiss} disabled={roles.saving} accessibilityRole={`button`} accessibilityState={{ disabled: roles.saving }} accessibilityLabel={`Close ${feature.label} Details`} />
      <View {...elementProps(`admin-feature-details-panel`, feature.key)} style={[styles.panel, { maxHeight: height - insets.top - insets.bottom - 48 }]} accessibilityViewIsModal onAccessibilityEscape={dismiss}>
        <View {...elementProps(`admin-feature-details-heading`, feature.key)} style={styles.heading}>
          <Icon {...elementProps(`admin-feature-details-title-icon`, feature.key)} size={18} color={palette.accent} />
          <Text {...elementProps(`admin-feature-details-title`, feature.key)} style={styles.title} accessibilityRole={`header`}>{feature.label}</Text>
          <Pressable {...elementProps(`admin-feature-details-close`, feature.key)} style={styles.close} hitSlop={6} onPress={dismiss} disabled={roles.saving} accessibilityRole={`button`} accessibilityState={{ disabled: roles.saving }} accessibilityLabel={`Close ${feature.label} Details`}>
            <X {...elementProps(`admin-feature-details-close-icon`, feature.key)} size={18} color={palette.muted} />
          </Pressable>
        </View>
        <ScrollView {...elementProps(`admin-feature-details-content`, feature.key)} style={styles.scroll} contentContainerStyle={styles.content}>
          <Text {...elementProps(`admin-feature-details-description-label`, feature.key)} style={styles.label}>Description</Text>
          <Text {...elementProps(`admin-feature-details-description`, feature.key)} style={styles.description}>{feature.description}</Text>
          <View {...elementProps(`admin-feature-details-roles`, feature.key)} style={styles.roles}>
            <Text {...elementProps(`admin-feature-details-roles-label`, feature.key)} style={styles.label}>Roles</Text>
            <View {...elementProps(`admin-feature-details-role-options`, feature.key)} style={styles.roleOptions} accessibilityLabel={`${feature.label} Roles`}>
              {roles.options.map(({ value, label }) => {
                const selected = roles.ready && (roles.selected === null || roles.selected.includes(value));
                return <Pressable key={value} {...elementProps(`admin-feature-details-role-option`, `${feature.key}-${value}`)} hitSlop={4} disabled={roles.disabled} accessibilityRole={`checkbox`} accessibilityLabel={`${label} Role For ${feature.label}`} accessibilityState={{ checked: selected, disabled: roles.disabled, busy: roles.saving }} onPress={() => roles.onToggle(value)} style={[styles.roleOption, selected && styles.selectedRole, roles.disabled && !selected && styles.disabled]}>
                  <Text {...elementProps(`admin-feature-details-role-option-label`, `${feature.key}-${value}`)} style={[styles.roleLabel, selected && styles.selectedRoleLabel]}>{label}</Text>
                </Pressable>;
              })}
            </View>
            {roles.saving ? <Text {...elementProps(`admin-feature-details-saving`, feature.key)} style={styles.note} accessibilityLiveRegion={`polite`}>Saving</Text> : null}
            {roles.error ? <Text {...elementProps(`admin-feature-details-error`, feature.key)} style={styles.error} accessibilityRole={`alert`}>{roles.error}</Text> : null}
          </View>
          <Text {...elementProps(`admin-feature-details-audience-note`, feature.key)} style={styles.note}>When enabled, this feature is available to the selected role(s) on the selected plan or higher. No plan selection means Free and above.</Text>
        </ScrollView>
      </View>
    </View>
  </Modal>;
};

export default FeatureDetails;
