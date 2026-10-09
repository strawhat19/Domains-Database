import Toast from '../Toast';
import PageMeta from '../PageMeta';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { useContactPage } from './useContactPage';
import { useMemo, useEffect, useContext } from 'react';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { contactFields, contactTopics, contactDescription } from './content';
import { ScrollContext } from '../../shared/scrollContext/ScrollContext';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Mail, Send, Plug, Globe2, Lightbulb, ArrowRight, ArrowUpRight, MessageCircle, CheckCircle2 } from 'lucide-react-native';

const topicIcons = { ideas: Lightbulb, support: Plug };

const ContactPage = () => {
  const state = useContactPage();
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
            <MessageCircle {...elementProps(`contact-eyebrow-icon`)} size={15} color={palette.accent} />
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
              <Globe2 {...elementProps(`contact-domain-icon`)} size={24} color={palette.accent} />
              <Text {...elementProps(`contact-domain-name`)} style={styles.domainName}>{`your.next.idea`}</Text>
              <Text {...elementProps(`contact-domain-note`)} style={styles.domainNote}>{`Room to grow`}</Text>
            </View>
            <View {...elementProps(`contact-message-card`)} style={styles.messageCard}>
              <MessageCircle {...elementProps(`contact-message-icon`)} size={20} color={palette.contrast} />
              <Text {...elementProps(`contact-message-copy`)} style={styles.messageCopy}>{`Let's make it happen.`}</Text>
              <View {...elementProps(`contact-message-line`)} style={styles.messageLine} />
            </View>
            <View {...elementProps(`contact-spark`)} style={styles.spark}>
              <Lightbulb {...elementProps(`contact-spark-icon`)} size={19} color={palette.accent} />
            </View>
          </View>}
          <View {...elementProps(`contact-topics`)} style={styles.topics}>
            {contactTopics.map(topic => {
              const Icon = topicIcons[topic.id];
              return (
                <View key={topic.id} {...elementProps(`contact-topic`, topic.id)} style={styles.topic}>
                  <View {...elementProps(`contact-topic-symbol`, topic.id)} style={styles.topicSymbol}><Icon {...elementProps(`contact-topic-icon`, topic.id)} size={17} color={palette.accent} /></View>
                  <Text {...elementProps(`contact-topic-title`, topic.id)} style={styles.topicTitle}>{topic.label}</Text>
                  {!condensed && <Text {...elementProps(`contact-topic-copy`, topic.id)} style={styles.topicCopy}>{topic.copy}</Text>}
                </View>
              );
            })}
          </View>
          <View {...elementProps(`contact-help-links`)} style={styles.helpLinks}>
            <Link href={`/about`} asChild>
              <Pressable {...elementProps(`contact-about-link`)} style={styles.helpLink} accessibilityRole={`link`}>
                <Globe2 {...elementProps(`contact-about-link-icon`)} size={14} color={palette.accent} />
                <Text {...elementProps(`contact-about-link-copy`)} style={styles.helpLinkText}>{`Meet the workspace`}</Text>
                <ArrowUpRight {...elementProps(`contact-about-arrow`)} size={13} color={palette.accent} />
              </Pressable>
            </Link>
            <Link href={`/profile/connections`} asChild>
              <Pressable {...elementProps(`contact-connections-link`)} style={styles.helpLink} accessibilityRole={`link`}>
                <Plug {...elementProps(`contact-connections-link-icon`)} size={14} color={palette.accent} />
                <Text {...elementProps(`contact-connections-link-copy`)} style={styles.helpLinkText}>{`Your connections`}</Text>
                <ArrowUpRight {...elementProps(`contact-connections-arrow`)} size={13} color={palette.accent} />
              </Pressable>
            </Link>
          </View>
        </View>
        <View {...elementProps(`contact-form-panel`)} style={styles.panel}>
          {state.submitted ? (
            <View {...elementProps(`contact-success`)} style={styles.success} accessibilityLiveRegion={`polite`}>
              <View {...elementProps(`contact-success-symbol`)} style={styles.successSymbol}><CheckCircle2 {...elementProps(`contact-success-icon`)} size={32} color={palette.success} /></View>
              <Text {...elementProps(`contact-success-eyebrow`)} style={styles.eyebrow}>{state.copy.eyebrow}</Text>
              <Text {...elementProps(`contact-success-title`)} style={styles.formTitle} accessibilityRole={`header`}>{state.copy.title}</Text>
              <Text {...elementProps(`contact-success-copy`)} style={styles.formDescription}>{state.copy.description}</Text>
              <Text {...elementProps(`contact-success-reference`)} style={styles.successReference}>{`Message #${state.submitted.number}`}</Text>
              <Pressable {...elementProps(`contact-another`)} style={styles.submit} accessibilityRole={`button`} onPress={state.sendAnother}>
                <MessageCircle {...elementProps(`contact-another-icon`)} size={17} color={palette.contrast} />
                <Text {...elementProps(`contact-another-copy`)} style={styles.submitText}>{state.copy.another}</Text>
                <ArrowRight {...elementProps(`contact-another-arrow`)} size={17} color={palette.contrast} />
              </Pressable>
            </View>
          ) : (
            <>
              <View {...elementProps(`contact-form-heading`)} style={styles.formHeading}>
                {!condensed && <View {...elementProps(`contact-form-symbol`)} style={styles.formSymbol}><Mail {...elementProps(`contact-form-icon`)} size={20} color={palette.accent} /></View>}
                <Text {...elementProps(`contact-form-title`)} style={styles.formTitle} accessibilityRole={`header`}>{`Drop us a note.`}</Text>
                {!tight && <Text {...elementProps(`contact-form-description`)} style={styles.formDescription}>{`Big ideas and small questions are equally welcome.`}</Text>}
              </View>
              <View {...elementProps(`contact-form`)} style={styles.form} accessibilityState={{ busy: state.pending }}>
                <View {...elementProps(`contact-fields`)} style={styles.fields}>
                  {contactFields.map(field => (
                    <View key={field.id} {...elementProps(`contact-field`, field.id)} style={[styles.field, (field.id === `name` || field.id === `email`) && width > 520 && styles.halfField]}>
                      <Text {...elementProps(`contact-label`, field.id)} style={styles.label}>{field.label}</Text>
                      <TextInput
                        autoCorrect={field.id !== `email`}
                        editable={!state.pending}
                        maxLength={field.limit}
                        style={[styles.input, field.id === `message` && styles.messageInput, Boolean(state.errors[field.id]) && styles.invalidInput]}
                        value={state.fields[field.id]}
                        placeholder={field.placeholder}
                        multiline={field.id === `message`}
                        accessibilityLabel={`${field.label} (Required)`}
                        accessibilityHint={state.errors[field.id]}
                        placeholderTextColor={palette.placeholder}
                        {...elementProps(`contact-input`, field.id)}
                        autoCapitalize={field.id === `email` ? `none` : `sentences`}
                        autoComplete={field.id === `email` ? `email` : field.id === `name` ? `name` : `off`}
                        keyboardType={field.id === `email` ? `email-address` : `default`}
                        onChangeText={value => state.updateField(field.id, value)}
                      />
                      {state.errors[field.id] && <Text {...elementProps(`contact-error`, field.id)} style={styles.errorText}>{state.errors[field.id]}</Text>}
                    </View>
                  ))}
                </View>
                <View {...elementProps(`contact-message-hint`)} style={styles.messageHint}>
                  <Text {...elementProps(`contact-message-safety`)} style={styles.messageSafety}>{`Please leave out passwords and API keys.`}</Text>
                  <Text {...elementProps(`contact-message-count`)} style={styles.messageCount}>{`${state.fields.message.length.toLocaleString()} / 5,000`}</Text>
                </View>
                <Pressable {...elementProps(`contact-submit`)} style={[styles.submit, state.pending && styles.disabled]} disabled={state.pending} accessibilityRole={`button`} accessibilityState={{ busy: state.pending, disabled: state.pending }} onPress={() => { void state.submit(); }}>
                  <Send {...elementProps(`contact-submit-icon`)} size={17} color={palette.contrast} />
                  <Text {...elementProps(`contact-submit-copy`)} style={styles.submitText}>{state.pending ? state.copy.pending : state.copy.submit}</Text>
                  <ArrowRight {...elementProps(`contact-submit-arrow`)} size={17} color={palette.contrast} />
                </Pressable>
                <Text {...elementProps(`contact-privacy-note`)} style={styles.privacyNote}>
                  {`Your message and contact details are handled according to our `}
                  <Link href={`/privacy`} asChild><Text {...elementProps(`contact-privacy-link`)} style={styles.privacyLink}>{`Privacy Policy`}</Text></Link>
                  {`.`}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
      <Toast id={`contact-feedback`} message={state.feedback} kind={state.submitted ? `success` : `error`} onDismiss={state.clearFeedback} />
    </>
  );
};

export default ContactPage;
