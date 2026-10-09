import { useMemo } from 'react';
import { Info, X } from 'lucide-react-native';
import { createStyles } from './styles.native';
import type { GoogleAuthButtonProps } from './types';
import { elementProps } from '../../shared/elementProps';
import { Image, Pressable, Text, View } from 'react-native';
import { useGoogleAuthButton } from './useGoogleAuthButton';
import { useTheme } from '../../shared/themeContext/useTheme';

const googleLogo = require('../../../assets/icons/google-g.png');

const GoogleAuthButton = ({ mode, disabled = false }: GoogleAuthButtonProps) => {
  const { palette } = useTheme();
  const state = useGoogleAuthButton({ mode, disabled });
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`google-auth-group`, mode)} style={styles.group}>
      <Pressable
        disabled={disabled}
        onPress={state.showNotice}
        accessibilityRole={`button`}
        accessibilityLabel={state.label}
        accessibilityState={{ disabled }}
        {...elementProps(`google-auth-button`, mode)}
        style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
      >
        <Image
          accessible={false}
          source={googleLogo}
          style={styles.logo}
          resizeMode={`contain`}
          accessibilityElementsHidden
          accessibilityIgnoresInvertColors
          importantForAccessibility={`no`}
          {...elementProps(`google-auth-logo`, mode)}
        />
        <Text {...elementProps(`google-auth-label`, mode)} style={styles.label}>{state.label}</Text>
      </Pressable>
      {!!state.message && (
        <View {...elementProps(`google-auth-notice`, mode)} style={styles.notice} accessibilityRole={`alert`} accessibilityLiveRegion={`polite`}>
          <Info {...elementProps(`google-auth-notice-icon`, mode)} size={16} color={palette.muted} />
          <Text {...elementProps(`google-auth-notice-text`, mode)} style={styles.noticeText}>{state.message}</Text>
          <Pressable
            style={styles.dismiss}
            onPress={state.dismissNotice}
            accessibilityRole={`button`}
            accessibilityLabel={`Dismiss Message`}
            {...elementProps(`google-auth-notice-dismiss`, mode)}
          >
            <X {...elementProps(`google-auth-notice-dismiss-icon`, mode)} size={15} color={palette.muted} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default GoogleAuthButton;
