import Toast from '../Toast';
import { useMemo } from 'react';
import { Link } from 'expo-router';
import { routes } from '../../shared/routes';
import { PlugZap } from 'lucide-react-native';
import { Pressable, Text } from 'react-native';
import { createStyles } from './styles.native';
import { useAuthFeedback } from './useAuthFeedback';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';

const AuthFeedback = () => {
  const auth = useAuthFeedback();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!auth.visible) return null;
  return (
    <Toast
      id={`auth-feedback`}
      message={auth.message}
      kind={auth.error ? `error` : `success`}
      onDismiss={auth.error ? auth.clearError : auth.clearNotice}
      action={auth.showConnections ? (
        <Link href={routes.connections.href} asChild>
          <Pressable
            style={styles.connectionLink}
            onPress={auth.clearNotice}
            accessibilityRole={`link`}
            {...elementProps(`auth-feedback-connections`)}
            accessibilityLabel={`Open Profile Connections`}
          >
            <PlugZap {...elementProps(`auth-feedback-connections-icon`)} size={15} color={palette.accent} />
            <Text {...elementProps(`auth-feedback-connections-text`)} style={styles.connectionText}>{`Profile Connections`}</Text>
          </Pressable>
        </Link>
      ) : undefined}
    />
  );
};

export default AuthFeedback;
