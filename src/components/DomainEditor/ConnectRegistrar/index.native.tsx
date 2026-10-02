import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import { useConnectRegistrar } from './useConnectRegistrar';
import { Cable, LogIn, UserPlus } from 'lucide-react-native';
import { elementProps } from '../../../shared/elementProps';
import { useTheme } from '../../../shared/themeContext/useTheme';

interface ConnectRegistrarProps {
  onClose: () => void;
  disabled?: boolean;
  scope?: string;
}

const ConnectRegistrar = ({ onClose, disabled = false, scope = `domain-editor` }: ConnectRegistrarProps) => {
  const { palette } = useTheme();
  const state = useConnectRegistrar(onClose, disabled);
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <View {...elementProps(`connect-registrar`, scope)} style={styles.root}>
      <Pressable
        onPress={state.connect}
        disabled={state.busy}
        accessibilityRole={`button`}
        accessibilityLabel={`Connect Registrar`}
        {...elementProps(`connect-registrar-button`, scope)}
        style={[styles.button, state.busy && styles.disabled]}
      >
        <Cable {...elementProps(`connect-registrar-icon`, scope)} size={15} color={palette.accent} />
        <Text {...elementProps(`connect-registrar-label`, scope)} style={styles.label}>
          {`Connect Registrar`}
        </Text>
      </Pressable>
      {state.prompt && (
        <View {...elementProps(`connect-registrar-prompt`, scope)} style={styles.prompt} accessibilityLiveRegion={`polite`}>
          <Text {...elementProps(`connect-registrar-prompt-copy`, scope)} style={styles.copy}>
            {`Sign in or create an account to connect a registrar. You can keep adding domains manually as a guest.`}
          </Text>
          <View {...elementProps(`connect-registrar-prompt-links`, scope)} style={styles.links}>
            <Pressable disabled={state.busy} accessibilityRole={`link`} style={styles.link} {...elementProps(`connect-registrar-signin`, scope)} onPress={() => state.navigate(`/signin`)}>
              <LogIn {...elementProps(`connect-registrar-signin-icon`, scope)} size={14} color={palette.accent} />
              <Text {...elementProps(`connect-registrar-signin-label`, scope)} style={styles.label}>
                {`Sign In`}
              </Text>
            </Pressable>
            <Pressable disabled={state.busy} accessibilityRole={`link`} style={styles.link} {...elementProps(`connect-registrar-signup`, scope)} onPress={() => state.navigate(`/signup`)}>
              <UserPlus {...elementProps(`connect-registrar-signup-icon`, scope)} size={14} color={palette.accent} />
              <Text {...elementProps(`connect-registrar-signup-label`, scope)} style={styles.label}>
                {`Create Account`}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default ConnectRegistrar;
