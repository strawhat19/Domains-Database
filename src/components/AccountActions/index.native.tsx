import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { useAccountActions } from './useAccountActions';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { Modal, Text, View, Platform, Pressable, ScrollView } from 'react-native';
import { X, UserX, Trash2, Unplug, LogOut, Database, CirclePause, ChevronDown } from 'lucide-react-native';

const actionIcons = {
  deactivate: CirclePause,
  [`delete-data`]: Database,
  [`delete-account`]: UserX,
  [`delete-data-connections`]: Unplug,
};

const AccountActions = ({ stacked = false }: { stacked?: boolean }) => {
  const state = useAccountActions();
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const scope = state.selected?.id ?? `account`;
  const ActionIcon = state.selected ? actionIcons[state.selected.id] : Trash2;
  const sections = state.selected?.sections ?? [];
  const leadingColumns = state.extraWideDialog ? 2 : 1;
  const sectionColumns = state.wideDialog
    ? [...sections.slice(0, leadingColumns).map(section => [section]), sections.slice(leadingColumns)].filter(column => column.length)
    : sections.map(section => [section]);

  return (
    <View
      {...elementProps(`account-actions`)}
      style={[styles.root, state.roomy && !stacked && styles.roomyRoot]}
      {...(Platform.OS === `web` ? { dataSet: { class: `account-actions`, stacked: String(stacked) } } : {})}
    >
      <View {...elementProps(`account-actions-heading`)} style={styles.heading}>
        {state.roomy ? (
          <View {...elementProps(`account-actions-summary`)} style={[styles.heading, styles.headingText]}>
            <UserX {...elementProps(`account-actions-icon`)} size={16} color={palette.danger} />
            <Text {...elementProps(`account-actions-title`)} style={styles.text} accessibilityRole={`header`}>{`Account`}</Text>
          </View>
        ) : (
          <Pressable
            disabled={state.disabled}
            onPress={state.toggleOpen}
            accessibilityRole={`button`}
            accessibilityLabel={`Account`}
            {...elementProps(`account-actions-toggle`)}
            style={[styles.heading, styles.headingText]}
            accessibilityState={{ expanded: state.open, disabled: state.disabled }}
          >
            <UserX {...elementProps(`account-actions-icon`)} size={16} color={palette.danger} />
            <Text {...elementProps(`account-actions-title`)} style={[styles.text, styles.headingText]}>{`Account`}</Text>
            <ChevronDown {...elementProps(`account-actions-chevron`)} size={16} color={palette.muted} style={{ transform: [{ rotate: state.open ? `180deg` : `0deg` }] }} />
          </Pressable>
        )}
        <Pressable
          disabled={state.disabled}
          accessibilityRole={`button`}
          accessibilityLabel={`Sign Out`}
          onPress={() => void state.signOut()}
          {...elementProps(`account-signout`)}
          style={[styles.button, state.disabled && styles.disabled]}
        >
          <LogOut {...elementProps(`account-signout-icon`)} size={16} color={palette.danger} />
          <Text {...elementProps(`account-signout-text`)} style={styles.text}>{`Sign Out`}</Text>
        </Pressable>
      </View>
      {Boolean(state.signOutError) && <Text {...elementProps(`account-signout-error`)} style={styles.error} accessibilityRole={`alert`}>{state.signOutError}</Text>}
      {state.expanded && (
        <View {...elementProps(`account-actions-options`)} style={styles.body}>
          <View {...elementProps(`account-actions-grid`)} style={[styles.body, state.roomy && !stacked && styles.roomyGrid]}>
            {state.accountActions.map(action => {
              const Icon = actionIcons[action.id];
              return (
                <Pressable
                  key={action.id}
                  disabled={state.disabled}
                  accessibilityRole={`button`}
                  accessibilityLabel={action.label}
                  {...elementProps(`account-action`, action.id)}
                  onPress={() => state.selectAction(action.id)}
                  style={[styles.button, state.roomy && !stacked && styles.roomyButton, state.disabled && styles.disabled]}
                >
                  <Icon {...elementProps(`account-action-icon`, action.id)} size={16} color={palette.danger} />
                  <Text {...elementProps(`account-action-text`, action.id)} style={[styles.text, styles.buttonText, styles.dangerText]}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      <Modal
        transparent
        visible={Boolean(state.selected)}
        onRequestClose={state.closeConfirmation}
        animationType={reducedMotion ? `none` : `fade`}
        accessibilityLabel={state.selected?.label ?? `Confirm Account Action`}
      >
        <View
          style={[styles.overlay, state.dialogPadding]}
          {...elementProps(`account-action-overlay`, scope)}
        >
          <View {...elementProps(`account-action-dialog`, scope)} style={[styles.dialog, { maxHeight: state.dialogMaxHeight }]} accessibilityViewIsModal>
            <View {...elementProps(`account-action-dialog-header`, scope)} style={[styles.dialogHeader, state.compactDialog && styles.compactDialogHeader]}>
              <View {...elementProps(`account-action-heading`, scope)} style={styles.heading}>
                <Text {...elementProps(`account-action-title`, scope)} style={styles.title} accessibilityRole={`header`}>{state.selected?.label}</Text>
                <Pressable
                  style={styles.close}
                  disabled={state.disabled}
                  accessibilityRole={`button`}
                  accessibilityLabel={`Cancel Account Action`}
                  onPress={state.closeConfirmation}
                  {...elementProps(`account-action-close`, scope)}
                >
                  <X {...elementProps(`account-action-close-icon`, scope)} size={18} color={palette.muted} />
                </Pressable>
              </View>
            </View>
            <ScrollView
              style={styles.dialogScroll}
              keyboardShouldPersistTaps={`handled`}
              contentContainerStyle={styles.dialogContent}
              {...elementProps(`account-action-dialog-scroll`, scope)}
            >
              <View {...elementProps(`account-action-intro`, scope)} style={styles.details}>
                <Text {...elementProps(`account-action-description`, scope)} style={styles.dialogCopy}>{state.selected?.copy}</Text>
                <Text {...elementProps(`account-action-outcome`, scope)} style={[styles.dialogCopy, state.selected?.id !== `deactivate` && styles.dangerText]}>{state.selected?.outcome}</Text>
              </View>
              <View {...elementProps(`account-action-sections`, scope)} style={[styles.sections, state.wideDialog && styles.wideSections]}>
                {sectionColumns.map((column, columnIndex) => (
                  <View key={column[0]?.id} {...elementProps(`account-action-section-column`, `${scope}-${columnIndex}`)} style={[styles.sections, state.wideDialog && styles.wideDetails, state.extraWideDialog && styles.extraWideDetails]}>
                    {column.map(section => (
                      <View key={section.id} {...elementProps(`account-action-details`, `${scope}-${section.id}`)} style={[styles.details, styles.detailCard]}>
                        <Text {...elementProps(`account-action-details-title`, `${scope}-${section.id}`)} style={styles.detailsTitle} accessibilityRole={`header`}>{section.title}</Text>
                        {section.items.map((item, index) => (
                          <Text key={index} {...elementProps(`account-action-details-item`, `${scope}-${section.id}-${index}`)} style={styles.dialogCopy}>{`• ${item}`}</Text>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
              <View {...elementProps(`account-action-scope`, scope)} style={styles.details}>
                <Text {...elementProps(`account-action-scope-title`, scope)} style={styles.detailsTitle} accessibilityRole={`header`}>{`Scope`}</Text>
                <Text {...elementProps(`account-action-scope-copy`, scope)} style={styles.dialogCopy}>{state.accountActionScope}</Text>
              </View>
              {Boolean(state.error) && <Text {...elementProps(`account-action-error`, scope)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
            </ScrollView>
            <View {...elementProps(`account-action-confirmation-buttons`, scope)} style={[styles.actions, state.compactDialog && styles.compactDialogActions]}>
              <Pressable
                disabled={state.disabled}
                accessibilityRole={`button`}
                onPress={state.closeConfirmation}
                {...elementProps(`account-action-cancel`, scope)}
                style={[styles.button, state.disabled && styles.disabled]}
              >
                <X {...elementProps(`account-action-cancel-icon`, scope)} size={16} color={palette.muted} />
                <Text {...elementProps(`account-action-cancel-text`, scope)} style={styles.text}>{`Cancel`}</Text>
              </Pressable>
              <Pressable
                accessibilityRole={`button`}
                accessibilityLabel={state.selected?.label}
                disabled={state.disabled}
                onPress={() => void state.confirmAction()}
                {...elementProps(`account-action-confirm`, scope)}
                style={[styles.button, styles.confirm, state.disabled && styles.disabled]}
              >
                <ActionIcon {...elementProps(`account-action-confirm-icon`, scope)} size={16} color={palette.danger} />
                <Text {...elementProps(`account-action-confirm-text`, scope)} style={[styles.text, styles.dangerText]}>{state.disabled ? `Please Wait…` : `Confirm`}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AccountActions;
