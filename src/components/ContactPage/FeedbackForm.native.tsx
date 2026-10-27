import { useMemo } from 'react';
import { feedbackTabs } from './content';
import SupportChat from '../SupportChat';
import { createStyles } from './styles.native';
import type { useContactPage } from './useContactPage';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { Bug, Send, Star, RotateCcw, ArrowRight, MessageCircle, CheckCircle2 } from 'lucide-react-native';

const icons = { bug: Bug, review: Star, contact: MessageCircle };

const FeedbackForm = ({ state }: { state: ReturnType<typeof useContactPage> }) => {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette, width <= 900, width), [palette, width]);
  const channel = feedbackTabs.find(tab => tab.id === state.tab) ?? feedbackTabs[0];
  const Icon = icons[state.tab];
  const content = state.tab === `contact` && state.supportThread ? (
    <SupportChat thread={state.supportThread} onBack={state.closeConversation} />
  ) : state.feedbackSubmission ? (
    <View {...elementProps(`contact-feedback-success`, state.tab)} style={styles.success} accessibilityLiveRegion={`polite`}>
      <View {...elementProps(`contact-feedback-success-symbol`, state.tab)} style={styles.successSymbol}><CheckCircle2 size={32} color={palette.success} accessible={false} {...elementProps(`contact-feedback-success-icon`, state.tab)} /></View>
      <Text {...elementProps(`contact-feedback-success-title`, state.tab)} style={styles.formTitle} accessibilityRole={`header`}>{state.feedbackSubmission.kind === `review` ? `Thank you for your review.` : `Your bug report is saved.`}</Text>
      <Text {...elementProps(`contact-feedback-success-copy`, state.tab)} style={styles.formDescription}>{`Your feedback is saved for the team to review.`}</Text>
      <Text {...elementProps(`contact-feedback-success-reference`, state.tab)} style={styles.successReference}>{`${state.feedbackSubmission.kind === `review` ? `Review` : `Bug Report`} #${state.feedbackSubmission.number}`}</Text>
      <Pressable accessibilityRole={`button`} {...elementProps(`contact-feedback-another`, state.tab)} style={styles.submit} onPress={state.sendAnother}>
        <Icon size={17} color={palette.contrast} accessible={false} {...elementProps(`contact-feedback-another-icon`, state.tab)} />
        <Text {...elementProps(`contact-feedback-another-label`, state.tab)} style={styles.submitText}>{state.tab === `review` ? `Write Another Review` : `Report Another Bug`}</Text>
      </Pressable>
    </View>
  ) : (
    <>
      {state.tab === `contact` && (state.conversationLoading || state.conversationError || state.ownThread) && (
        <View {...elementProps(`contact-conversation-resume`)} style={styles.conversationResume}>
          {state.conversationLoading ? <Text {...elementProps(`contact-conversation-loading`)} style={styles.formDescription} accessibilityLiveRegion={`polite`}>{`Loading Your Conversation…`}</Text> : state.conversationError ? <>
            <Text {...elementProps(`contact-conversation-error`)} style={styles.errorText} accessibilityRole={`alert`}>{state.conversationError}</Text>
            <Pressable accessibilityRole={`button`} disabled={state.pending} {...elementProps(`contact-conversation-refresh`)} style={styles.conversationButton} onPress={state.refreshConversation}><RotateCcw size={15} color={palette.accent} accessible={false} {...elementProps(`contact-conversation-refresh-icon`)} /><Text {...elementProps(`contact-conversation-refresh-label`)} style={styles.conversationButtonLabel}>{`Retry Conversation`}</Text></Pressable>
          </> : state.ownThread ? <Pressable accessibilityRole={`button`} disabled={state.pending} {...elementProps(`contact-conversation-open`)} style={styles.conversationButton} onPress={state.openConversation}>
            <MessageCircle size={16} color={palette.accent} accessible={false} {...elementProps(`contact-conversation-open-icon`)} />
            <Text {...elementProps(`contact-conversation-open-label`)} style={styles.conversationButtonLabel}>{`Continue Conversation`}</Text>
            <Text {...elementProps(`contact-conversation-reference`)} style={styles.conversationReference}>{`#${state.ownThread.number}`}</Text>
          </Pressable> : null}
        </View>
      )}
      <View {...elementProps(`contact-feedback-heading`, state.tab)} style={styles.formHeading}>
        <View {...elementProps(`contact-feedback-symbol`, state.tab)} style={styles.formSymbol}><Icon size={20} color={palette.accent} accessible={false} {...elementProps(`contact-feedback-icon`, state.tab)} /></View>
        <Text {...elementProps(`contact-feedback-title`, state.tab)} style={styles.formTitle} accessibilityRole={`header`}>{channel.title}</Text>
        <Text {...elementProps(`contact-feedback-description`, state.tab)} style={styles.formDescription}>{channel.description}</Text>
      </View>
      <View {...elementProps(`contact-feedback-form`, state.tab)} style={styles.form} accessibilityState={{ busy: state.pending }}>
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
                  <Star size={23} accessible={false} color={state.draft.rating >= rating ? `#fbbf24` : palette.muted} fill={state.draft.rating >= rating ? `#fbbf24` : `none`} {...elementProps(`contact-review-rating-icon`, String(rating))} />
                </Pressable>
              ))}
              <Text {...elementProps(`contact-review-rating-value`)} style={styles.ratingValue}>{state.draft.rating ? `${state.draft.rating} / 5` : `Choose A Rating`}</Text>
            </View>
            {state.draftErrors.rating && <Text {...elementProps(`contact-review-rating-error`)} style={styles.errorText} accessibilityRole={`alert`}>{state.draftErrors.rating}</Text>}
          </View>
        )}
        <View {...elementProps(`contact-feedback-fields`, state.tab)} style={styles.fields}>
          {state.inputFields.map(field => (
            <View key={field.id} {...elementProps(`contact-feedback-field-${state.tab}`, field.id)} style={[styles.field, state.tab === `contact` && field.id !== `message` && width > 520 && styles.halfField]}>
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
                autoCorrect={field.id !== `mediaUrl` && field.id !== `phone`}
                autoCapitalize={field.id === `mediaUrl` || field.id === `phone` ? `none` : `sentences`}
                accessibilityLabel={`${field.label}${field.required ? ` (Required)` : ``}`}
                keyboardType={field.id === `mediaUrl` ? `url` : field.id === `phone` ? `phone-pad` : `default`}
                style={[styles.input, field.multiline && styles.messageInput, Boolean(field.error) && styles.invalidInput]}
              />
              {field.error && <Text {...elementProps(`contact-feedback-error-${state.tab}`, field.id)} style={styles.errorText}>{field.error}</Text>}
            </View>
          ))}
        </View>
        <Pressable accessibilityRole={`button`} disabled={state.pending} accessibilityState={{ busy: state.pending, disabled: state.pending }} {...elementProps(`contact-feedback-submit`, state.tab)} style={[styles.submit, state.pending && styles.disabled]} onPress={() => { void state.submit(); }}>
          <Send size={17} color={palette.contrast} accessible={false} {...elementProps(`contact-feedback-submit-icon`, state.tab)} />
          <Text {...elementProps(`contact-feedback-submit-label`, state.tab)} style={styles.submitText}>{state.pending ? channel.pending : channel.submit}</Text>
          <ArrowRight size={17} color={palette.contrast} accessible={false} {...elementProps(`contact-feedback-submit-arrow`, state.tab)} />
        </Pressable>
        <Text {...elementProps(`contact-feedback-privacy`, state.tab)} style={styles.privacyNote}>{state.tab === `contact` ? `Your conversation is private to you and authorized support staff.` : `Reviews and bug reports are private feedback for the team.`}</Text>
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
              <TabIcon size={15} color={selected ? palette.accent : palette.muted} accessible={false} {...elementProps(`contact-feedback-tab-icon`, tab.id)} />
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
