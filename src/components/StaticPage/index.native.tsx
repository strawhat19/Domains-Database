import { Link } from 'expo-router';
import { useMemo, useContext } from 'react';
import { createStyles } from './styles.native';
import { useStaticPage } from './useStaticPage';
import type { PageName } from '../../shared/pages';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Alert, Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Mail, Code2, Layers3, FileText, ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react-native';

const pageIcons = { api: Code2, about: Layers3, contact: Mail, terms: FileText, privacy: ShieldCheck };

const StaticPage = ({ page }: { page: PageName }) => {
  const { palette } = useTheme();
  const { width, height } = useWindowDimensions();
  const pageContentHeight = useContext(ScrollContext)?.pageContentHeight ?? Math.max(0, height - 240);
  const detailLength = pageContentHeight < 280 ? 90 : width >= 800 ? 310 : pageContentHeight < 400 ? 160 : 220;
  const state = useStaticPage(page, detailLength);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const compact = width < 700 || pageContentHeight < 500;
  const tight = pageContentHeight < 400;
  const cramped = pageContentHeight < 280;
  const Icon = pageIcons[page];
  const openPiratechs = async () => {
    try {
      await Linking.openURL(`https://piratechs.com/`);
    } catch {
      Alert.alert(`Unable To Open Link`, `Visit piratechs.com in your browser`);
    }
  };

  const readerNavigation = (
    <View {...elementProps(`native-static-reader-navigation`, page)} style={[styles.readerNavigation, cramped && styles.crampedNavigation]}>
      <Pressable
        disabled={state.first}
        accessibilityRole={`button`}
        accessibilityLabel={`Previous Detail`}
        onPress={() => state.moveDetail(-1)}
        accessibilityState={{ disabled: state.first }}
        {...elementProps(`native-static-previous-detail`, page)}
        style={[styles.readerButton, state.first && styles.disabledButton]}
      >
        <ArrowLeft {...elementProps(`native-static-previous-detail-icon`, page)} size={16} color={palette.ink} />
        {!cramped && (
          <Text {...elementProps(`native-static-previous-detail-text`, page)} style={styles.readerButtonText}>
            {`Previous`}
          </Text>
        )}
      </Pressable>
      <Text {...elementProps(`native-static-detail-count`, page)} style={styles.detailCount}>
        {state.section.details.length > 1 ? `${state.detail + 1} / ${state.section.details.length}` : `${state.topic + 1} / ${state.sections.length}`}
      </Text>
      <Pressable
        disabled={state.last}
        accessibilityRole={`button`}
        accessibilityLabel={`Next Detail`}
        onPress={() => state.moveDetail(1)}
        accessibilityState={{ disabled: state.last }}
        {...elementProps(`native-static-next-detail`, page)}
        style={[styles.readerButton, state.last && styles.disabledButton]}
      >
        {!cramped && (
          <Text {...elementProps(`native-static-next-detail-text`, page)} style={styles.readerButtonText}>
            {`Next`}
          </Text>
        )}
        <ArrowRight {...elementProps(`native-static-next-detail-icon`, page)} size={16} color={palette.ink} />
      </Pressable>
    </View>
  );

  return (
    <View
      {...elementProps(`native-static-page`, page)}
      style={[styles.page, { minHeight: pageContentHeight }, compact && styles.compactPage, width >= 800 && styles.widePage]}
    >
      <View {...elementProps(`native-static-intro`, page)} style={[styles.intro, width >= 800 && styles.wideIntro]}>
        {!tight && (
          <Link href={`/`} asChild>
            <Pressable {...elementProps(`native-static-back`, page)} style={styles.backLink} accessibilityLabel={`Back To Overview`}>
              <ArrowLeft {...elementProps(`native-static-back-icon`, page)} size={15} color={palette.muted} />
              <Text {...elementProps(`native-static-back-text`, page)} style={styles.backText}>
                {`Back to overview`}
              </Text>
            </Pressable>
          </Link>
        )}
        {!compact && (
          <View {...elementProps(`native-static-brand-mark`, page)} style={styles.brandMark}>
            <Icon {...elementProps(`native-static-brand-icon`, page)} size={28} color={palette.accent} />
          </View>
        )}
        <View {...elementProps(`native-static-heading`, page)} style={[styles.heading, compact && styles.compactHeading]}>
          {!tight && (
            <Text {...elementProps(`native-static-eyebrow`, page)} style={styles.eyebrow}>
              {state.content.eyebrow}
            </Text>
          )}
          <Text {...elementProps(`native-static-title`, page)} style={[styles.title, compact && styles.compactTitle]}>
            {state.content.title}
          </Text>
          {!tight && (
            <Text {...elementProps(`native-static-description`, page)} style={styles.description}>
              {state.content.description}
            </Text>
          )}
        </View>
        {page === `contact` && (
          <Pressable
            accessibilityRole={`link`}
            style={styles.contactLink}
            accessibilityLabel={`Visit Piratechs`}
            {...elementProps(`native-contact-piratechs-link`)}
            onPress={() => void openPiratechs()}
          >
            <Text {...elementProps(`native-contact-piratechs-text`)} style={styles.contactText}>
              {`Visit Piratechs`}
            </Text>
            <ArrowUpRight {...elementProps(`native-contact-piratechs-icon`)} size={16} color={`#ffffff`} />
          </Pressable>
        )}
      </View>
      <View {...elementProps(`native-static-reader`, page)} style={[styles.reader, compact && styles.compactReader, width >= 800 && styles.wideReader, cramped && styles.crampedReader]}>
        {cramped ? (
          <View {...elementProps(`native-static-reader-toolbar`, page)} style={styles.readerToolbar}>
            <Text {...elementProps(`native-static-toolbar-title`, `${page}-${state.topic}`)} style={styles.toolbarTitle}>
              {state.section.title}
            </Text>
            {readerNavigation}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            {...elementProps(`native-static-topics`, page)}
            contentContainerStyle={styles.topics}
            style={styles.topicScroll}
          >
            {state.sections.map((section, index) => (
              <Pressable
                key={section.title}
                accessibilityRole={`button`}
                accessibilityLabel={section.title}
                onPress={() => state.selectTopic(index)}
                accessibilityState={{ selected: state.topic === index }}
                {...elementProps(`native-static-topic`, `${page}-${index}`)}
                style={[styles.topic, state.topic === index && styles.activeTopic]}
              >
                <Text
                  {...elementProps(`native-static-topic-text`, `${page}-${index}`)}
                  style={[styles.topicText, state.topic === index && styles.activeTopicText]}
                >
                  {section.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View {...elementProps(`native-static-section`, `${page}-${state.topic}`)} style={styles.section} accessibilityLiveRegion={`polite`}>
          {!compact && (
            <Text {...elementProps(`native-static-section-count`, page)} style={styles.sectionCount}>
              {`TOPIC ${state.topic + 1} / ${state.sections.length}`}
            </Text>
          )}
          {!cramped && (
            <Text {...elementProps(`native-static-section-title`, `${page}-${state.topic}`)} style={[styles.sectionTitle, tight && styles.tightSectionTitle]}>
              {state.section.title}
            </Text>
          )}
          <Text {...elementProps(`native-static-section-body`, `${page}-${state.topic}-${state.detail}`)} style={[styles.sectionBody, compact && styles.compactBody]}>
            {state.paragraph}
          </Text>
        </View>
        {!cramped && readerNavigation}
      </View>
    </View>
  );
};

export default StaticPage;
