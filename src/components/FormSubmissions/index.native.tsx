import Toast from '../Toast';
import { useMemo } from 'react';
import SubmissionCard from './SubmissionCard';
import { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useFormSubmissions } from './useFormSubmissions';
import { Inbox, RefreshCw, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react-native';

const FormSubmissions = () => {
  const state = useFormSubmissions();
  const styles = useMemo(() => createStyles(state.palette), [state.palette]);
  if (!state.allowed) return null;
  return (
    <View {...elementProps(`form-submissions`)} style={styles.root}>
      <View {...elementProps(`form-submissions-heading`)} style={styles.heading}>
        <View {...elementProps(`form-submissions-intro`)} style={styles.intro}>
          <View {...elementProps(`form-submissions-title-row`)} style={styles.titleRow}>
            <Inbox {...elementProps(`form-submissions-title-icon`)} size={18} color={state.palette.accent} />
            <Text {...elementProps(`form-submissions-title`)} style={styles.title} accessibilityRole={`header`}>{`Form Submissions`}</Text>
          </View>
          <Text {...elementProps(`form-submissions-description`)} style={styles.copy}>{`Contact messages, saved privately for review. Up to 50 per page, newest first.`}</Text>
        </View>
        <Pressable {...elementProps(`form-submissions-refresh`)} style={[styles.refresh, state.disabled && styles.disabled]} disabled={state.disabled} accessibilityRole={`button`} accessibilityState={{ disabled: state.disabled }} onPress={() => { void state.refresh(); }}>
          <RefreshCw {...elementProps(`form-submissions-refresh-icon`)} size={14} color={state.palette.ink} />
          <Text {...elementProps(`form-submissions-refresh-label`)} style={styles.optionLabel}>{state.loading ? `Loading…` : `Latest`}</Text>
        </Pressable>
      </View>
      <Toast id={`form-submissions-error`} message={state.error} />
      {state.loading && !state.submissions.length ? (
        <View {...elementProps(`form-submissions-loading`)} style={styles.list} accessibilityLabel={`Loading Form Submissions`}>
          {[0, 1, 2].map(index => <View key={index} {...elementProps(`form-submissions-skeleton`, String(index))} style={styles.skeleton} />)}
        </View>
      ) : state.submissions.length ? (
        <View {...elementProps(`form-submissions-list`)} style={styles.list}>
          <Text {...elementProps(`form-submissions-count`)} style={styles.copy}>{`${state.submissions.length} Contact Submission(s) On This Page`}</Text>
          {state.submissions.map(submission => <SubmissionCard key={submission.id} styles={styles} palette={state.palette} submission={submission} disabled={state.disabled} saving={state.savingId === submission.id} updateStatus={state.updateStatus} />)}
        </View>
      ) : !state.error && (
        <View {...elementProps(`form-submissions-empty`)} style={styles.empty}>
          <Inbox {...elementProps(`form-submissions-empty-icon`)} size={24} color={state.palette.muted} />
          <Text {...elementProps(`form-submissions-empty-title`)} style={styles.subject}>{state.page > 1 ? `No Submission(s) On This Page` : `No Form Submissions Yet`}</Text>
          <Text {...elementProps(`form-submissions-empty-copy`)} style={[styles.copy, styles.centered]}>{`Messages sent from the contact page will appear here.`}</Text>
        </View>
      )}
      <View {...elementProps(`form-submissions-pagination`)} style={styles.pagination}>
        <Text {...elementProps(`form-submissions-page`)} style={styles.copy}>{`Page ${state.page}`}</Text>
        <Pressable {...elementProps(`form-submissions-previous`)} style={[styles.refresh, (state.disabled || !state.hasPrevious) && styles.disabled]} disabled={state.disabled || !state.hasPrevious} accessibilityRole={`button`} accessibilityState={{ disabled: state.disabled || !state.hasPrevious }} onPress={state.previousPage}>
          <ArrowLeft {...elementProps(`form-submissions-previous-icon`)} size={14} color={state.palette.ink} />
          <Text {...elementProps(`form-submissions-previous-label`)} style={styles.optionLabel}>{`Newer`}</Text>
        </Pressable>
        <Pressable {...elementProps(`form-submissions-next`)} style={[styles.refresh, (state.disabled || !state.hasNext) && styles.disabled]} disabled={state.disabled || !state.hasNext} accessibilityRole={`button`} accessibilityState={{ disabled: state.disabled || !state.hasNext }} onPress={state.nextPage}>
          <Text {...elementProps(`form-submissions-next-label`)} style={styles.optionLabel}>{`Older`}</Text>
          <ArrowRight {...elementProps(`form-submissions-next-icon`)} size={14} color={state.palette.ink} />
        </Pressable>
      </View>
      <View {...elementProps(`form-submissions-privacy`)} style={styles.privacy}>
        <ShieldCheck {...elementProps(`form-submissions-privacy-icon`)} size={13} color={state.palette.muted} />
        <Text {...elementProps(`form-submissions-privacy-copy`)} style={styles.copy}>{`Only Owners Can View These Messages`}</Text>
      </View>
    </View>
  );
};

export default FormSubmissions;
