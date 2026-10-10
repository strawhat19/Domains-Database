import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { RefreshCw, X } from 'lucide-react-native';
import { elementProps } from '../../shared/elementProps';
import type { PortfolioSyncOptionsProps } from './types';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

const PortfolioSyncOptions = ({ busy, onClose, choices, onSync, onSyncAll }: PortfolioSyncOptionsProps) => {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const close = () => { if (!busy) onClose(); };
  return (
    <Modal visible transparent onRequestClose={close} animationType={reducedMotion ? `none` : `fade`}>
      <View
        {...elementProps(`native-portfolio-sync-overlay`)}
        style={[styles.overlay, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}
      >
        <View
          accessibilityViewIsModal
          style={styles.dialog}
          onAccessibilityEscape={close}
          accessibilityLabel={`Sync Domains`}
          {...elementProps(`native-portfolio-sync-dialog`)}
        >
          <View {...elementProps(`native-portfolio-sync-header`)} style={styles.header}>
            <Text style={styles.title} accessibilityRole={`header`} {...elementProps(`native-portfolio-sync-title`)}>{`Sync Domains`}</Text>
            <Pressable
              disabled={busy}
              onPress={close}
              accessibilityRole={`button`}
              accessibilityState={{ disabled: busy }}
              accessibilityLabel={`Close Sync Options`}
              {...elementProps(`native-portfolio-sync-close`)}
              style={[styles.iconButton, busy && styles.disabled]}
            >
              <X {...elementProps(`native-portfolio-sync-close-icon`)} size={18} color={palette.muted} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps={`handled`}
            {...elementProps(`native-portfolio-sync-content`)}
          >
            <Text {...elementProps(`native-portfolio-sync-description`)} style={styles.description}>{`Choose a registrar connection or sync all listed connections.`}</Text>
            <Pressable
              disabled={busy}
              accessibilityRole={`button`}
              accessibilityState={{ disabled: busy }}
              onPress={() => { if (!busy) onSyncAll(); }}
              {...elementProps(`native-portfolio-sync-all`)}
              style={[styles.choiceButton, busy && styles.disabled]}
              accessibilityLabel={`Sync Domains From All Listed Connections`}
            >
              <RefreshCw {...elementProps(`native-portfolio-sync-all-icon`)} size={16} color={palette.accent} />
              <Text {...elementProps(`native-portfolio-sync-all-label`)} style={styles.choiceLabel}>{`Sync All`}</Text>
            </Pressable>
            {choices.map(choice => (
              <Pressable
                key={choice.id}
                disabled={busy}
                accessibilityRole={`button`}
                accessibilityLabel={`Sync ${choice.label}`}
                accessibilityState={{ disabled: busy }}
                onPress={() => { if (!busy) onSync(choice.id); }}
                {...elementProps(`native-portfolio-sync-choice`, choice.id)}
                style={[styles.choiceButton, busy && styles.disabled]}
              >
                <RefreshCw {...elementProps(`native-portfolio-sync-choice-icon`, choice.id)} size={16} color={palette.accent} />
                <Text {...elementProps(`native-portfolio-sync-choice-label`, choice.id)} style={styles.choiceLabel}>{choice.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View {...elementProps(`native-portfolio-sync-footer`)} style={styles.footer}>
            <Pressable
              disabled={busy}
              onPress={close}
              accessibilityRole={`button`}
              accessibilityState={{ disabled: busy }}
              {...elementProps(`native-portfolio-sync-cancel`)}
              style={[styles.cancelButton, busy && styles.disabled]}
            >
              <X {...elementProps(`native-portfolio-sync-cancel-icon`)} size={15} color={palette.muted} />
              <Text {...elementProps(`native-portfolio-sync-cancel-label`)} style={styles.cancelLabel}>{`Cancel`}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
export default PortfolioSyncOptions;
