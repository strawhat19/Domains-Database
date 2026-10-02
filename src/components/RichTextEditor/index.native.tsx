import { useMemo } from 'react';
import { createStyles } from './styles.native';
import RichTextContent from './RichTextContent';
import { elementProps } from '../../shared/elementProps';
import { MAX_POST_LENGTH } from '../../shared/social/content';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, TextInput, Pressable, View } from 'react-native';
import { useRichTextEditor, type RichTextEditorProps } from './useRichTextEditor';
import { Bold, Italic, Code2, ImagePlus, Eye, PenLine, Plus } from 'lucide-react-native';

const RichTextEditor = ({ value, onChange, disabled = false, scope = `composer` }: RichTextEditorProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const state = useRichTextEditor({ value, onChange });
  const tools = [
    { id: `bold`, label: `Bold`, Icon: Bold, action: () => state.format(`bold`) },
    { id: `italic`, label: `Italic`, Icon: Italic, action: () => state.format(`italic`) },
    { id: `code`, label: `Code`, Icon: Code2, action: () => state.format(`code`) },
    { id: `image`, label: `Image URL`, Icon: ImagePlus, action: () => state.setImageOpen(!state.imageOpen) },
    { id: `preview`, label: state.preview ? `Write` : `Preview`, Icon: state.preview ? PenLine : Eye, action: () => state.setPreview(!state.preview) },
  ];
  return (
    <View {...elementProps(`rich-editor`, scope)} style={styles.root}>
      <View {...elementProps(`rich-editor-toolbar`, scope)} style={styles.toolbar}>
        {tools.map(tool => (
          <Pressable
            key={tool.id}
            style={styles.tool}
            disabled={disabled}
            onPress={tool.action}
            accessibilityRole={`button`}
            accessibilityLabel={tool.label}
            {...elementProps(`rich-editor-tool`, `${scope}-${tool.id}`)}
          >
            <tool.Icon {...elementProps(`rich-editor-tool-icon`, `${scope}-${tool.id}`)} size={14} color={palette.ink} />
            <Text {...elementProps(`rich-editor-tool-label`, `${scope}-${tool.id}`)} style={styles.toolText}>
              {tool.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {state.imageOpen && (
        <View {...elementProps(`rich-editor-image-row`, scope)} style={styles.imageRow}>
          <TextInput
            editable={!disabled}
            value={state.imageUrl}
            keyboardType={`url`}
            autoCapitalize={`none`}
            style={styles.imageInput}
            onChangeText={state.setImageUrl}
            placeholderTextColor={palette.placeholder}
            accessibilityLabel={`Public HTTPS Image URL`}
            {...elementProps(`rich-editor-image-url`, scope)}
            placeholder={`https://your-public-site.com/image.jpg`}
          />
          <Pressable
            style={styles.tool}
            disabled={disabled}
            onPress={state.insertImage}
            accessibilityRole={`button`}
            accessibilityLabel={`Insert Image URL`}
            {...elementProps(`rich-editor-image-insert`, scope)}
          >
            <Plus {...elementProps(`rich-editor-image-insert-icon`, scope)} size={14} color={palette.ink} />
            <Text {...elementProps(`rich-editor-image-insert-label`, scope)} style={styles.toolText}>
              {`Insert`}
            </Text>
          </Pressable>
        </View>
      )}
      {state.preview ? (
        <View {...elementProps(`rich-editor-preview`, scope)} style={styles.preview}>
          {value.trim() ? <RichTextContent value={value} scope={`${scope}-preview`} /> : (
            <Text {...elementProps(`rich-editor-preview-empty`, scope)} style={styles.helper}>
              {`Your formatted post will appear here`}
            </Text>
          )}
        </View>
      ) : (
        <TextInput
          {...elementProps(`rich-editor-input`, scope)}
          style={styles.input}
          value={value}
          multiline
          editable={!disabled}
          selection={state.selection}
          maxLength={MAX_POST_LENGTH}
          onChangeText={onChange}
          onSelectionChange={event => state.setSelection(event.nativeEvent.selection)}
          placeholder={`Share a domain discovery, a project, or a useful snippet…`}
          placeholderTextColor={palette.placeholder}
          accessibilityLabel={`Post Content`}
        />
      )}
      <Text {...elementProps(`rich-editor-helper`, scope)} style={styles.helper}>
        {`${value.length}/${MAX_POST_LENGTH} · Markdown, code blocks, and public HTTPS images · Images load from their original website`}
      </Text>
      {!!state.error && (
        <Text {...elementProps(`rich-editor-error`, scope)} style={styles.error} accessibilityRole={`alert`}>
          {state.error}
        </Text>
      )}
    </View>
  );
};

export default RichTextEditor;
