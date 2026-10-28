import { useMemo } from 'react';
import { Link } from 'expo-router';
import { feedbackTabs } from './content';
import SupportChat from '../SupportChat';
import { createStyles } from './styles.native';
import type { useContactPage } from './useContactPage';
import { useTheme } from '../../shared/themeContext/useTheme';
import { elementProps, decorativeIconProps } from '../../shared/elementProps';
import { Text, View, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { Bug, Send, Star, RotateCcw, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react-native';

const icons = { bug: Bug, review: Star, contact: MessageCircle };

const FeedbackForm = ({ state }: { state: ReturnType<typeof useContactPage> }) => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette, width <= 900, width), [palette, width]);
  const selectedChannel = feedbackTabs.find(tab => tab.id === state.tab) ?? feedbackTabs[0];
  const guestContact = !state.signedIn && state.tab === `contact`;
  const channel = guestContact ? { ...selectedChannel, title: `Drop us a note.`, description: `Big ideas and small questions are equally welcome.`, submit: state.copy.submit, pending: state.copy.pending } : selectedChannel;
  const separateIdentityFields = !state.signedIn && state.tab !== `contact`;
  const isIdentityField = (field: typeof state.inputFields[number]) => field.id === `name` || field.id === `email` || field.id === `phone`;
  const identityFields = separateIdentityFields ? state.inputFields.filter(isIdentityField) : [];
  const channelFields = separateIdentityFields ? state.inputFields.filter(field => !isIdentityField(field)) : state.inputFields;
  const Icon = icons[state.tab];
  const renderField = (field: typeof state.inputFields[number]) => (
    <View key={field.id} {...elementProps(`contact-feedback-field-${state.tab}`, field.id)} style={[styles.field, !field.multiline && width > 520 && (state.tab === `contact` || field.id === `name` || field.id === `email`) && styles.halfField]}>
      <Text {...elementProps(`contact-feedback-label-${state.tab}`, field.id)} style={styles.label}>{field.label}</Text>
      <TextInput
        value={field.value}
        editable={!state.pending}
        maxLength={field.limit}
        multiline={field.multiline}
        placeholder={field.placeholder}
        onChangeText={field.onChange}
        accessibilityHint={field.error}
        placeholderTextColor={palette.placeholder}
        {...elementProps(`contact-feedback-input-${state.tab}`, field.id)}
        autoCorrect={field.id !== `mediaUrl` && field.id !== `phone` && field.id !== `email`}
        autoComplete={field.id === `phone` ? `tel` : field.id === `email` ? `email` : field.id === `name` ? `name` : `off`}
        autoCapitalize={field.id === `mediaUrl` || field.id === `phone` || field.id === `email` ? `none` : field.id === `name` ? `words` : `sentences`}
        textContentType={field.id === `phone` ? `telephoneNumber` : field.id === `email` ? `emailAddress` : field.id === `name` ? `name` : undefined}
        accessibilityLabel={`${field.label}${field.required ? ` (Required)` : ``}`}
        keyboardType={field.id === `mediaUrl` ? `url` : field.id === `phone` ? `phone-pad` : field.id === `email` ? `email-address` : `default`}
        style={[styles.input, field.multiline && styles.messageInput, Boolean(field.error) && styles.invalidInput]}
      />
      {field.error && <Text {...elementProps(`contact-feedback-error-${state.tab}`, field.id)} style={styles.errorText} accessibilityRole={`alert`}>{field.error}</Text>}
    </View>
  );
  const content = state.signedIn && state.tab === `contact` && state.supportThread ? (
    <SupportChat thread={state.supportThread} onBack={state.closeConversation} />
  ) : guestContact && state.submitted ? (
    <View {...elementProps(`contact-success`)} style={styles.success} accessibilityLiveRegion={`polite`}>
      <View {...elementProps(`contact-success-symbol`)} style={styles.successSymbol}><CheckCircle2 {...decorativeIconProps} {...elementProps(`contact-success-icon`)} size={32} color={palette.success} /></View>
      <Text {...elementProps(`contact-success-eyebrow`)} style={styles.eyebrow}>{state.copy.eyebrow}</Text>
      <Text {...elementProps(`contact-success-title`)} style={styles.formTitle} accessibilityRole={`header`}>{state.copy.title}</Text>
      <Text {...elementProps(`contact-success-copy`)} style={styles.formDescription}>{state.copy.description}</Text>
      <Text {...elementProps(`contact-success-reference`)} style={styles.successReference}>{`Message #${state.submitted.number}`}</Text>
      <Pressable {...elementProps(`contact-another`)} style={styles.submit} accessibilityRole={`button`} onPress={state.sendAnother}>
        <MessageCircle {...decorativeIconProps} {...elementProps(`contact-another-icon`)} size={17} color={palette.contrast} />
        <Text {...elementProps(`contact-another-copy`)} style={styles.submitText}>{state.copy.another}</Text>
        <ArrowRight {...decorativeIconProps} {...elementProps(`contact-another-arrow`)} size={17} color={palette.contrast} />
      </Pressable>
    </View>
  ) : state.feedbackSubmission ? (
    <View {...elementProps(`contact-feedback-success`, state.tab)} style={styles.success} accessibilityLiveRegion={`polite`}>
      <View {...elementProps(`contact-feedback-success-symbol`, state.tab)} style={styles.successSymbol}><CheckCircle2 size={32} color={palette.success} {...decorativeIconProps} {...elementProps(`contact-feedback-success-icon`, state.tab)} /></View>
      <Text {...elementProps(`contact-feedback-success-title`, state.tab)} style={styles.formTitle} accessibilityRole={`header`}>{state.feedbackSubmission.kind === `review` ? `Thank you for your review.` : `Your bug report is saved.`}</Text>
      <Text {...elementProps(`contact-feedback-success-copy`, state.tab)} style={styles.formDescription}>{`Your feedback is saved for the team to review.`}</Text>
      <Text {...elementProps(`contact-feedback-success-reference`, state.tab)} style={styles.successReference}>{`${state.feedbackSubmission.kind === `review` ? `Review` : `Bug Report`} #${state.feedbackSubmission.number}`}</Text>
      <Pressable accessibilityRole={`button`} {...elementProps(`contact-feedback-another`, state.tab)} style={styles.submit} onPress={state.sendAnother}>
        <Icon size={17} color={palette.contrast} {...decorativeIconProps} {...elementProps(`contact-feedback-another-icon`, state.tab)} />
        <Text {...elementProps(`contact-feedback-another-label`, state.tab)} style={styles.submitText}>{state.tab === `review` ? `Write Another Review` : `Report Another Bug`}</Text>
      </Pressable>
    </View>
  ) : (
    <>
      {state.signedIn && state.tab === `contact` && (state.conversationLoading || state.conversationError || state.ownThread) && (
        <View {...elementProps(`contact-conversation-resume`)} style={styles.conversationResume}>
          {state.conversationLoading ? <Text {...elementProps(`contact-conversation-loading`)} style={styles.formDescription} accessibilityLiveRegion={`polite`}>{`Loading Your Conversation…`}</Text> : state.conversationError ? <>
            <Text {...elementProps(`contact-conversation-error`)} style={styles.errorText} accessibilityRole={`alert`}>{state.conversationError}</Text>
            <Pressable accessibilityRole={`button`} disabled={state.pending} {...elementProps(`contact-conversation-refresh`)} style={styles.conversationButton} onPress={state.refreshConversation}><RotateCcw size={15} color={palette.accent} {...decorativeIconProps} {...elementProps(`contact-conversation-refresh-icon`)} /><Text {...elementProps(`contact-conversation-refresh-label`)} style={styles.conversationButtonLabel}>{`Retry Conversation`}</Text></Pressable>
          </> : state.ownThread ? <Pressable accessibilityRole={`button`} disabled={state.pending} {...elementProps(`contact-conversation-open`)} style={styles.conversationButton} onPress={state.openConversation}>
            <MessageCircle size={16} color={palette.accent} {...decorativeIconProps} {...elementProps(`contact-conversation-open-icon`)} />
            <Text {...elementProps(`contact-conversation-open-label`)} style={styles.conversationButtonLabel}>{`Continue Conversation`}</Text>
            <Text {...elementProps(`contact-conversation-reference`)} style={styles.conversationReference}>{`#${state.ownThread.number}`}</Text>
          </Pressable> : null}
        </View>
      )}
      <View {...elementProps(`contact-feedback-heading`, state.tab)} style={styles.formHeading}>
        <View {...elementProps(`contact-feedback-symbol`, state.tab)} style={styles.formSymbol}><Icon size={20} color={palette.accent} {...decorativeIconProps} {...elementProps(`contact-feedback-icon`, state.tab)} /></View>
        <Text {...elementProps(`contact-feedback-title`, state.tab)} style={styles.formTitle} accessibilityRole={`header`}>{channel.title}</Text>
        <Text {...elementProps(`contact-feedback-description`, state.tab)} style={styles.formDescription}>{channel.description}</Text>
      </View>
      <View {...elementProps(`contact-feedback-form`, state.tab)} style={styles.form} accessibilityState={{ busy: state.pending }}>
        {!state.signedIn && (
          <View {...elementProps(`contact-website-field`, state.tab)} style={styles.honeypot} pointerEvents={`none`} accessible={false} accessibilityElementsHidden importantForAccessibility={`no-hide-descendants`}>
            <TextInput
              tabIndex={-1}
              autoComplete={`off`}
              accessible={false}
              focusable={false}
              autoCapitalize={`none`}
              editable={!state.pending}
              value={state.fields.website}
              {...elementProps(`contact-website`, state.tab)}
              onChangeText={value => state.updateField(`website`, value)}
            />
          </View>
        )}
        {identityFields.length > 0 && <View {...elementProps(`contact-feedback-identity-fields`, state.tab)} style={styles.fields}>{identityFields.map(renderField)}</View>}
        {state.tab === `review` && (
          <View {...elementProps(`contact-review-rating-field`)} style={styles.field}>
            <Text {...elementProps(`contact-review-rating-label`)} style={styles.label}>{`Rating`}</Text>
            <View {...elementProps(`contact-review-rating`)} style={styles.rating} accessibilityLabel={`Review Rating`}>
              {[1, 2, 3, 4, 5].map(rating => (
                <Pressable
                  key={rating}
                  disabled={state.pending}
                  accessibilityRole={`button`}
                  style={styles.ratingChoice}
                  {...elementProps(`contact-review-rating`, String(rating))}
                  accessibilityLabel={`${rating} Of 5 Stars`}
                  accessibilityState={{ selected: state.draft.rating === rating, disabled: state.pending }}
                  onPress={() => state.updateDraft(`rating`, rating)}
                >
                  <Star size={23} {...decorativeIconProps} color={state.draft.rating >= rating ? `#fbbf24` : palette.muted} fill={state.draft.rating >= rating ? `#fbbf24` : `none`} {...elementProps(`contact-review-rating-icon`, String(rating))} />
                </Pressable>
              ))}
              <Text {...elementProps(`contact-review-rating-value`)} style={styles.ratingValue}>{state.draft.rating ? `${state.draft.rating} / 5` : `Choose A Rating`}</Text>
            </View>
            {state.draftErrors.rating && <Text {...elementProps(`contact-review-rating-error`)} style={styles.errorText} accessibilityRole={`alert`}>{state.draftErrors.rating}</Text>}
          </View>
        )}
        <View {...elementProps(`contact-feedback-fields`, state.tab)} style={styles.fields}>
          {channelFields.map(renderField)}
        </View>
        {state.tab === `contact` && <View {...elementProps(`contact-message-hint`)} style={styles.messageHint}>
          <Text {...elementProps(`contact-message-safety`)} style={styles.messageSafety}>{`Please leave out passwords and API keys.`}</Text>
          <Text {...elementProps(`contact-message-count`)} style={styles.messageCount}>{`${state.fields.message.length.toLocaleString()} / 5,000`}</Text>
        </View>}
        <Pressable accessibilityRole={`button`} disabled={state.pending} accessibilityState={{ busy: state.pending, disabled: state.pending }} {...elementProps(`contact-feedback-submit`, state.tab)} style={[styles.submit, state.pending && styles.disabled]} onPress={() => { void state.submit(); }}>
          <Send size={17} color={palette.contrast} {...decorativeIconProps} {...elementProps(`contact-feedback-submit-icon`, state.tab)} />
          <Text {...elementProps(`contact-feedback-submit-label`, state.tab)} style={styles.submitText}>{state.pending ? channel.pending : channel.submit}</Text>
          <ArrowRight size={17} color={palette.contrast} {...decorativeIconProps} {...elementProps(`contact-feedback-submit-arrow`, state.tab)} />
        </Pressable>
        <Text {...elementProps(`contact-feedback-privacy`, state.tab)} style={styles.privacyNote}>
          {state.tab === `contact` ? state.signedIn ? `Your conversation is private to you and authorized support staff.` : `Your message and contact details are private to the team.` : `Reviews and bug reports are private feedback for the team.`}
          {` `}<Link href={`/privacy`} asChild><Text {...elementProps(`contact-privacy-link`, state.tab)} style={styles.privacyLink}>{`Privacy Policy`}</Text></Link>
        </Text>
      </View>
    </>
  );
  return (
    <View {...elementProps(`contact-feedback-content`)} style={styles.feedbackRoot}>
      <View {...elementProps(`contact-feedback-tabs`)} style={styles.feedbackTabs} accessibilityRole={`tablist`} accessibilityLabel={`Contact And Feedback`}>
        {feedbackTabs.map(tab => {
          const TabIcon = icons[tab.id];
          const selected = state.tab === tab.id;
          return (
            <Pressable key={tab.id} disabled={state.pending} accessibilityRole={`tab`} accessibilityState={{ selected, disabled: state.pending }} {...elementProps(`contact-feedback-tab`, tab.id)} style={[styles.feedbackTab, selected && styles.feedbackTabSelected]} onPress={() => state.setTab(tab.id)}>
              <TabIcon size={15} color={selected ? palette.accent : palette.muted} {...decorativeIconProps} {...elementProps(`contact-feedback-tab-icon`, tab.id)} />
              <Text {...elementProps(`contact-feedback-tab-label`, tab.id)} style={[styles.feedbackTabLabel, selected && styles.feedbackTabLabelSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View {...elementProps(`contact-feedback-panel`, state.tab)} style={styles.feedbackPanel}>{content}</View>
    </View>
  );
};

export default FeedbackForm;
