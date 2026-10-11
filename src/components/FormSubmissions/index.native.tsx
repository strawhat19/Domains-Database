import Toast from '../Toast';
import { useMemo } from 'react';
import SubmissionCard from './SubmissionCard';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { Pressable, Text, View, TextInput } from 'react-native';
import { useFormSubmissions, submissionStatuses } from './useFormSubmissions';
import { Inbox, Search, RefreshCw, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react-native';

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
            <Text {...elementProps(`form-submissions-title`)} style={styles.title} accessibilityRole={`header`}>{`Contact Form Submissions`}</Text>
          </View>
          <Text {...elementProps(`form-submissions-description`)} style={styles.copy}>{`Contact messages saved privately for review. New submissions appear automatically. Up to 50 per page, newest first.`}</Text>
        </View>
        <Pressable {...elementProps(`form-submissions-refresh`)} style={[styles.refresh, state.disabled && styles.disabled]} disabled={state.disabled} accessibilityRole={`button`} accessibilityState={{ disabled: state.disabled }} onPress={() => { void state.refresh(); }}>
          <RefreshCw {...elementProps(`form-submissions-refresh-icon`)} size={14} color={state.palette.ink} />
          <Text {...elementProps(`form-submissions-refresh-label`)} style={styles.optionLabel}>{state.loading ? `Loading…` : `Latest`}</Text>
        </Pressable>
      </View>
      <View {...elementProps(`form-submissions-filters`)} style={styles.filters}>
        <View {...elementProps(`form-submissions-search`)} style={styles.search}><Search {...elementProps(`form-submissions-search-icon`)} size={15} color={state.palette.muted} /><TextInput {...elementProps(`form-submissions-search-input`)} style={styles.searchInput} value={state.search} onChangeText={state.setSearch} placeholder={`Search Contact Requests`} placeholderTextColor={state.palette.muted} accessibilityLabel={`Search Requests On This Page`} /></View>
        <View {...elementProps(`form-submissions-status-filters`)} style={styles.statusOptions}>{[{ value: `all`, label: `All Statuses` }, ...submissionStatuses].map(option => <Pressable key={option.value} {...elementProps(`form-submissions-status-filter`, option.value)} style={[styles.statusOption, state.statusFilter === option.value && styles.selectedOption]} accessibilityRole={`button`} accessibilityState={{ selected: state.statusFilter === option.value }} onPress={() => state.setStatusFilter(option.value)}><Text {...elementProps(`form-submissions-filter-label`, option.value)} style={styles.optionLabel}>{option.label}</Text></Pressable>)}</View>
        <Text {...elementProps(`form-submissions-filter-note`)} style={styles.copy}>{`${state.visible.length} Of ${state.submissions.length} Loaded Request(s) · Filters Apply To This Page`}</Text>
      </View>
      <Toast id={`form-submissions-error`} message={state.error} />
      {!!state.notice && <Text {...elementProps(`form-submissions-notice`)} style={styles.notice} accessibilityRole={`alert`}>{state.notice}</Text>}
      {state.loading && !state.submissions.length ? (
        <View {...elementProps(`form-submissions-loading`)} style={styles.list} accessibilityLabel={`Loading Form Submissions`}>
          {[0, 1, 2].map(index => <View key={index} {...elementProps(`form-submissions-skeleton`, String(index))} style={styles.skeleton} />)}
        </View>
      ) : state.visible.length ? (
        <View {...elementProps(`form-submissions-list`)} style={styles.list}>
          <Text {...elementProps(`form-submissions-count`)} style={styles.copy}>{`${state.visible.length} Matching Contact Request(s) On This Page`}</Text>
          {state.visible.map(submission => <SubmissionCard key={submission.id} styles={styles} palette={state.palette} submission={submission} disabled={state.disabled} saving={state.savingId === submission.id} updateStatus={state.updateStatus} />)}
        </View>
      ) : !state.error && (
        <View {...elementProps(`form-submissions-empty`)} style={styles.empty}>
          <Inbox {...elementProps(`form-submissions-empty-icon`)} size={24} color={state.palette.muted} />
          <Text {...elementProps(`form-submissions-empty-title`)} style={styles.subject}>{state.filtered ? `No Matching Requests On This Page` : state.page > 1 ? `No Request(s) On This Page` : `No Form Submissions Yet`}</Text>
          <Text {...elementProps(`form-submissions-empty-copy`)} style={[styles.copy, styles.centered]}>{state.filtered ? `Change The Search Or Status Filter, Or Browse Another Page` : `Messages saved from the contact form will appear here.`}</Text>
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
