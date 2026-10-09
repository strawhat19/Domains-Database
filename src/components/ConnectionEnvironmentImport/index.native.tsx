import { useMemo } from 'react';
import FilePicker from './FilePicker';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { FileKey2, Server, X } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { ConnectionEnvironmentImportProps } from './types';
import EnvironmentFileDropZone from '../EnvironmentFileDropZone';
import { Text, View, Pressable, TextInput, Platform } from 'react-native';

const ConnectionEnvironmentImport = ({ scope, error, contents, reading, disabled, canImportServer, onLoad, onClose, onServer, onFiles, onChange }: ConnectionEnvironmentImportProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  return (
    <EnvironmentFileDropZone scope={scope} kind={`panel`} disabled={disabled} onFiles={onFiles}>
      <View {...elementProps(`connection-env-panel`, scope)} style={styles.panel}>
        <View {...elementProps(`connection-env-heading`, scope)} style={styles.row}>
          <Text {...elementProps(`connection-env-title`, scope)} style={styles.title}>{`Import From .env`}</Text>
          <Pressable
            disabled={disabled}
            onPress={onClose}
            accessibilityRole={`button`}
            accessibilityState={{ disabled }}
            accessibilityLabel={`Close .env Import`}
            {...elementProps(`connection-env-close`, scope)}
            style={[styles.button, disabled && styles.disabled]}
          >
            <X {...elementProps(`connection-env-close-icon`, scope)} size={15} color={palette.muted} />
            <Text {...elementProps(`connection-env-close-text`, scope)} style={styles.buttonText}>{`Close`}</Text>
          </Pressable>
        </View>
        <Text {...elementProps(`connection-env-description`, scope)} style={styles.copy}>
          {`${Platform.OS === `web` ? `Drop a .env file here or on Import From .env, or choose a file, to fill the registrar fields automatically. For pasted contents, enter` : `Paste`} NAME=value lines below and choose Load Keys. Review the loaded keys, then choose Save All Connections, or Save & Sync for one connection. Existing connections and edits are kept; only supported registrar keys are used.`}
        </Text>
        <FilePicker scope={scope} reading={reading} disabled={disabled} onFiles={onFiles} />
        {reading && <Text {...elementProps(`connection-env-reading`, scope)} style={styles.copy} accessibilityLiveRegion={`polite`}>{`Reading .env File…`}</Text>}
        <TextInput
          multiline
          value={contents}
          editable={!disabled}
          autoCorrect={false}
          autoComplete={`off`}
          autoCapitalize={`none`}
          style={styles.input}
          onChangeText={onChange}
          accessibilityLabel={`Paste .env Contents`}
          placeholderTextColor={palette.placeholder}
          {...elementProps(`connection-env-contents`, scope)}
          placeholder={`VERCEL_API_TOKEN=your_token\nVERCEL_TEAM_ID=team_optional`}
          {...(Platform.OS === `web` ? { 'aria-describedby': `connection-env-description-${scope}` } : {})}
        />
        {!!error && <Text {...elementProps(`connection-env-error`, scope)} style={styles.error} accessibilityRole={`alert`}>{error}</Text>}
        <View {...elementProps(`connection-env-actions`, scope)} style={styles.row}>
          <Pressable
            onPress={onLoad}
            accessibilityRole={`button`}
            accessibilityHint={`Fill Supported Registrar Fields For Review`}
            disabled={disabled || !contents.trim()}
            {...elementProps(`connection-env-load`, scope)}
            accessibilityState={{ disabled: disabled || !contents.trim() }}
            style={[styles.button, styles.primary, (disabled || !contents.trim()) && styles.disabled]}
          >
            <FileKey2 {...elementProps(`connection-env-load-icon`, scope)} size={15} color={palette.contrast} />
            <Text {...elementProps(`connection-env-load-text`, scope)} style={[styles.buttonText, styles.primaryText]}>{`Load Keys`}</Text>
          </Pressable>
          {canImportServer && (
            <Pressable
              onPress={onServer}
              disabled={disabled}
              accessibilityRole={`button`}
              accessibilityState={{ disabled }}
              style={[styles.button, disabled && styles.disabled]}
              {...elementProps(`connection-env-server`, scope)}
              accessibilityHint={`Load Configured Server Registrar Keys Into Connection Fields For Review`}
            >
              <Server {...elementProps(`connection-env-server-icon`, scope)} size={15} color={palette.accent} />
              <Text {...elementProps(`connection-env-server-text`, scope)} style={styles.buttonText}>{`Import Server .env`}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </EnvironmentFileDropZone>
  );
};
export default ConnectionEnvironmentImport;
