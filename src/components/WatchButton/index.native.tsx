import { useMemo } from 'react';
import { useWatchButton } from './useWatchButton';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { Eye, X, LogIn, UserRoundPlus } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { DomainSearchDomainResult } from '../../shared/domainSearch/types';
import { Modal, Pressable, Text, View, ActivityIndicator } from 'react-native';

const WatchButton = ({ result, suffix }: { suffix: string; result: DomainSearchDomainResult }) => {
  const state = useWatchButton(result);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <>
      <Pressable
        {...elementProps(`domain-search-watch-button`, suffix)}
        disabled={state.disabled}
        accessibilityRole={`button`}
        onPress={() => void state.watch()}
        style={[styles.button, state.watched && styles.watched, state.disabled && styles.disabled]}
        accessibilityState={{ disabled: state.disabled, busy: state.saving }}
        accessibilityLabel={state.watched ? `View ${result.domain} In Watching` : `Watch ${result.domain}`}
      >
        {state.saving
          ? <ActivityIndicator {...elementProps(`domain-search-watch-progress`, suffix)} size={`small`} color={palette.accent} />
          : <Eye {...elementProps(`domain-search-watch-icon`, suffix)} size={15} color={palette.accent} />}
        <Text {...elementProps(`domain-search-watch-text`, suffix)} style={styles.buttonText}>
          {state.saving ? `Saving…` : state.watched ? `Watching` : `Watch`}
        </Text>
      </Pressable>
      <Modal
        transparent
        animationType={`none`}
        visible={state.promptOpen}
        onRequestClose={state.dismissPrompt}
      >
        <View {...elementProps(`watch-signin-overlay`, suffix)} style={styles.overlay}>
          <Pressable
            {...elementProps(`watch-signin-backdrop`, suffix)}
            style={styles.backdrop}
            onPress={state.dismissPrompt}
            accessibilityLabel={`Close Sign In Prompt`}
          />
          <View {...elementProps(`watch-signin-dialog`, suffix)} style={styles.dialog} accessibilityViewIsModal>
            <View {...elementProps(`watch-signin-heading`, suffix)} style={styles.heading}>
              <Eye {...elementProps(`watch-signin-icon`, suffix)} size={23} color={palette.accent} />
              <Pressable
                {...elementProps(`watch-signin-close`, suffix)}
                style={styles.close}
                onPress={state.dismissPrompt}
                accessibilityLabel={`Close Sign In Prompt`}
              >
                <X {...elementProps(`watch-signin-close-icon`, suffix)} size={18} color={palette.muted} />
              </Pressable>
            </View>
            <Text {...elementProps(`watch-signin-title`, suffix)} style={styles.title} accessibilityRole={`header`}>
              {`Sign in to watch domains`}
            </Text>
            <Text {...elementProps(`watch-signin-description`, suffix)} style={styles.description}>
              {`Save ${result.domain} to your Watching list and compare registrar availability and prices. Sign in or create an account, then choose Watch to save it.`}
            </Text>
            <View {...elementProps(`watch-signin-actions`, suffix)} style={styles.actions}>
              <Pressable
                {...elementProps(`watch-signin-link`, suffix)}
                style={styles.primary}
                accessibilityRole={`link`}
                onPress={() => state.signIn(`/signin`)}
              >
                <LogIn {...elementProps(`watch-signin-link-icon`, suffix)} size={16} color={palette.contrast} />
                <Text {...elementProps(`watch-signin-link-text`, suffix)} style={styles.primaryText}>{`Sign in`}</Text>
              </Pressable>
              <Pressable
                {...elementProps(`watch-signup-link`, suffix)}
                style={styles.secondary}
                accessibilityRole={`link`}
                onPress={() => state.signIn(`/signup`)}
              >
                <UserRoundPlus {...elementProps(`watch-signup-link-icon`, suffix)} size={16} color={palette.ink} />
                <Text {...elementProps(`watch-signup-link-text`, suffix)} style={styles.secondaryText}>{`Create account`}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default WatchButton;
