import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { Linking, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { parseContent, parseInline, type ContentBlock } from '../../shared/social/content';

const ContentImage = ({ block, scope }: { block: Extract<ContentBlock, { kind: `image` }>; scope: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [failed, setFailed] = useState(false);
  return (
    <View {...elementProps(`rich-content-image-wrap`, scope)}>
      {failed ? (
        <Text {...elementProps(`rich-content-image-unavailable`, scope)} style={styles.imageCaption}>
          {`Image unavailable`}
        </Text>
      ) : (
        <Image
          {...elementProps(`rich-content-image`, scope)}
          source={{ uri: block.url }}
          style={styles.image}
          contentFit={`contain`}
          accessibilityLabel={block.text}
          onError={() => setFailed(true)}
        />
      )}
      <Text {...elementProps(`rich-content-image-caption`, scope)} style={styles.imageCaption}>
        {block.text}
      </Text>
    </View>
  );
};

const RichTextContent = ({ value, scope }: { value: string; scope: string }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const blocks = useMemo(() => parseContent(value), [value]);
  return (
    <View {...elementProps(`rich-content`, scope)} style={styles.content}>
      {blocks.map((block, index) => {
        const id = `${scope}-${index}`;
        if (block.kind === `image`) return <ContentImage key={id} block={block} scope={id} />;
        if (block.kind === `code`) return (
          <View key={id} {...elementProps(`rich-content-code-block`, id)} style={styles.codeBlock}>
            {!!block.language && (
              <Text {...elementProps(`rich-content-code-language`, id)} style={styles.language}>
                {block.language.toUpperCase()}
              </Text>
            )}
            <Text {...elementProps(`rich-content-code`, id)} style={styles.code} selectable>
              {block.text}
            </Text>
          </View>
        );
        return (
          <Text
            key={id}
            selectable
            {...elementProps(`rich-content-paragraph`, id)}
            style={block.kind === `heading` ? styles.heading : styles.paragraph}
          >
            {parseInline(block.text).map((part, partIndex) => {
              const url = part.url;
              const inlineStyle = { text: undefined, bold: styles.bold, italic: styles.italic, code: styles.inlineCode, link: styles.link }[part.kind];
              const onPress = part.kind === `link` && url ? () => { void Linking.openURL(url).catch(() => undefined); } : undefined;
              return (
                <Text
                  onPress={onPress}
                  style={inlineStyle}
                  key={`${id}-${partIndex}`}
                  accessibilityRole={part.kind === `link` ? `link` : undefined}
                  {...elementProps(`rich-content-inline-${part.kind}`, `${id}-${partIndex}`)}
                >
                  {part.text}
                </Text>
              );
            })}
          </Text>
        );
      })}
    </View>
  );
};

export default RichTextContent;
