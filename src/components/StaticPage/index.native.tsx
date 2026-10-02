import { Link } from 'expo-router';
import { styles } from './styles.native';
import { ArrowLeft } from 'lucide-react-native';
import { pageContent } from '../../shared/pages';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';

type Page = `about` | `terms` | `contact` | `privacy` | `api`;

const StaticPage = ({ page }: { page: Page }) => {
  const content = pageContent[page];

  return (
    <View {...elementProps(`native-static-page`, page)} style={styles.page}>
      <Link href={`/`} asChild>
        <Pressable {...elementProps(`native-static-back`, page)} style={styles.backLink} accessibilityLabel={`Back To Overview`}>
          <ArrowLeft {...elementProps(`native-static-back-icon`, page)} size={14} color={`#6b7978`} />
          <Text {...elementProps(`native-static-back-text`, page)} style={styles.backText}>
            {`Back to overview`}
          </Text>
        </Pressable>
      </Link>
      <View {...elementProps(`native-static-heading`, page)} style={styles.heading}>
        <Text {...elementProps(`native-static-eyebrow`, page)} style={styles.eyebrow}>
          {content.eyebrow}
        </Text>
        <Text {...elementProps(`native-static-title`, page)} style={styles.title}>
          {content.title}
        </Text>
        <Text {...elementProps(`native-static-description`, page)} style={styles.description}>
          {content.description}
        </Text>
      </View>
      <View {...elementProps(`native-static-sections`, page)} style={styles.sections}>
        {content.sections.map((section, index) => (
          <View {...elementProps(`native-static-section`, `${page}-${index}`)} key={section.title} style={styles.section}>
            <Text {...elementProps(`native-static-section-title`, `${page}-${index}`)} style={styles.sectionTitle}>
              {section.title}
            </Text>
            {section.body.map((paragraph, paragraphIndex) => (
              <Text {...elementProps(`native-static-section-body`, `${page}-${index}-${paragraphIndex}`)} key={paragraphIndex} style={styles.sectionBody}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default StaticPage;
