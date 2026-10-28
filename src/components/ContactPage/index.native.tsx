import Toast from '../Toast';
import PageMeta from '../PageMeta';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import FeedbackForm from './FeedbackForm.native';
import { useContactPage } from './useContactPage';
import { useMemo, useEffect, useContext } from 'react';
import { useTheme } from '../../shared/themeContext/useTheme';
import { contactTopics, contactDescription } from './content';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useFeatureFlags } from '../../shared/featureFlags/useFeatureFlags';
import { elementProps, decorativeIconProps } from '../../shared/elementProps';
import { Plug, Globe2, Lightbulb, ArrowUpRight, MessageCircle } from 'lucide-react-native';

const topicIcons = { ideas: Lightbulb, support: Plug };

const ContactPage = () => {
  const state = useContactPage();
  const { error, flags, ready } = useFeatureFlags();
  const available = ready && flags.contact && !state.authLoading && !state.accountUnavailable;
  const loading = state.authLoading || (!ready && !error);
  const message = loading ? `Loading Contact Form…` : state.accountUnavailable ? `Your account is currently unavailable for contact or feedback.` : `The contact form is currently unavailable. Please try again later.`;
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const scroll = useContext(ScrollContext);
  const setHeroBottom = scroll?.setHeroBottom;
  const pageContentHeight = scroll?.pageContentHeight;
  const compact = width <= 900;
  const condensed = !compact && pageContentHeight !== undefined && pageContentHeight < 700;
  const tight = !compact && pageContentHeight !== undefined && pageContentHeight < 540;
  const styles = useMemo(() => createStyles(palette, compact, width, pageContentHeight), [palette, compact, width, pageContentHeight]);
  useEffect(() => () => setHeroBottom?.(null), [setHeroBottom]);

  return (
    <>
      <PageMeta title={`Contact`} canonicalPath={`/contact`} description={contactDescription} />
      <View {...elementProps(`contact-page`)} style={styles.page}>
        <View {...elementProps(`contact-intro`)} style={styles.intro} onLayout={({ nativeEvent }) => setHeroBottom?.(nativeEvent.layout.y + nativeEvent.layout.height)}>
          <View {...elementProps(`contact-eyebrow`)} style={styles.eyebrowRow}>
            <MessageCircle {...decorativeIconProps} {...elementProps(`contact-eyebrow-icon`)} size={15} color={palette.accent} />
            <Text {...elementProps(`contact-eyebrow-copy`)} style={styles.eyebrow}>{`LET'S CONNECT`}</Text>
          </View>
          <Text {...elementProps(`contact-title`)} style={styles.title} accessibilityRole={`header`}>
            {`Good things start\n`}
            <Text {...elementProps(`contact-title-accent`)} style={styles.titleAccent}>{`with a hello.`}</Text>
          </Text>
          {!tight && <Text {...elementProps(`contact-description`)} style={styles.description}>{contactDescription}</Text>}
          {!tight && <View {...elementProps(`contact-illustration`)} style={styles.illustration} accessible={false} pointerEvents={`none`} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
            <View {...elementProps(`contact-orbit`)} style={styles.orbit} />
            <View {...elementProps(`contact-orbit-dot`)} style={styles.orbitDot} />
            <View {...elementProps(`contact-domain-card`)} style={styles.domainCard}>
              <Globe2 {...decorativeIconProps} {...elementProps(`contact-domain-icon`)} size={24} color={palette.accent} />
              <Text {...elementProps(`contact-domain-name`)} style={styles.domainName}>{`your.next.idea`}</Text>
              <Text {...elementProps(`contact-domain-note`)} style={styles.domainNote}>{`Room to grow`}</Text>
            </View>
            <View {...elementProps(`contact-message-card`)} style={styles.messageCard}>
              <MessageCircle {...decorativeIconProps} {...elementProps(`contact-message-icon`)} size={20} color={palette.contrast} />
              <Text {...elementProps(`contact-message-copy`)} style={styles.messageCopy}>{`Let's make it happen.`}</Text>
              <View {...elementProps(`contact-message-line`)} style={styles.messageLine} />
            </View>
            <View {...elementProps(`contact-spark`)} style={styles.spark}>
              <Lightbulb {...decorativeIconProps} {...elementProps(`contact-spark-icon`)} size={19} color={palette.accent} />
            </View>
          </View>}
          <View {...elementProps(`contact-topics`)} style={styles.topics}>
            {contactTopics.map(topic => {
              const Icon = topicIcons[topic.id];
              return (
                <View key={topic.id} {...elementProps(`contact-topic`, topic.id)} style={styles.topic}>
                  <View {...elementProps(`contact-topic-symbol`, topic.id)} style={styles.topicSymbol}><Icon {...decorativeIconProps} {...elementProps(`contact-topic-icon`, topic.id)} size={17} color={palette.accent} /></View>
                  <Text {...elementProps(`contact-topic-title`, topic.id)} style={styles.topicTitle}>{topic.label}</Text>
                  {!condensed && <Text {...elementProps(`contact-topic-copy`, topic.id)} style={styles.topicCopy}>{topic.copy}</Text>}
                </View>
              );
            })}
          </View>
          <View {...elementProps(`contact-help-links`)} style={styles.helpLinks}>
            <Link href={`/about`} asChild>
              <Pressable {...elementProps(`contact-about-link`)} style={styles.helpLink} accessibilityRole={`link`}>
                <Globe2 {...decorativeIconProps} {...elementProps(`contact-about-link-icon`)} size={14} color={palette.accent} />
                <Text {...elementProps(`contact-about-link-copy`)} style={styles.helpLinkText}>{`Meet the workspace`}</Text>
                <ArrowUpRight {...decorativeIconProps} {...elementProps(`contact-about-arrow`)} size={13} color={palette.accent} />
              </Pressable>
            </Link>
            <Link href={`/profile/connections`} asChild>
              <Pressable {...elementProps(`contact-connections-link`)} style={styles.helpLink} accessibilityRole={`link`}>
                <Plug {...decorativeIconProps} {...elementProps(`contact-connections-link-icon`)} size={14} color={palette.accent} />
                <Text {...elementProps(`contact-connections-link-copy`)} style={styles.helpLinkText}>{`Your connections`}</Text>
                <ArrowUpRight {...decorativeIconProps} {...elementProps(`contact-connections-arrow`)} size={13} color={palette.accent} />
              </Pressable>
            </Link>
          </View>
        </View>
        <View {...elementProps(`contact-form-panel`)} style={styles.panel} accessibilityState={{ busy: loading }}>
          {!available ? (
            <View {...elementProps(`contact-unavailable`)} style={styles.formHeading}>
              <Text {...elementProps(`contact-unavailable-title`)} style={styles.formTitle} accessibilityRole={`header`}>{`Contact Form`}</Text>
              <Text {...elementProps(`contact-unavailable-message`)} style={styles.formDescription} accessibilityLiveRegion={`polite`}>{message}</Text>
            </View>
          ) : <FeedbackForm state={state} />}
        </View>
      </View>
      {available && <Toast id={`contact-feedback`} message={state.feedback} kind={state.feedbackKind} onDismiss={state.clearFeedback} />}
    </>
  );
};

export default ContactPage;
