import StatePanel from '../StatePanel';
import FeedbackIdentity from '../FeedbackIdentity';
import { useMemo, useState } from 'react';
import { createStyles } from './styles.native';
import { useFeedbackEntries } from './useFeedbackEntries';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { FeedbackKind } from '../../shared/feedback/types';
import { normalizePublicMediaUrl } from '../../shared/feedback/validation';
import { AdminButton, AdminLoading, StatusCell } from '../AdminWidgets';
import { Bug, Star, Archive, BookOpen, RotateCcw, ExternalLink } from 'lucide-react-native';
import { Text, View, Linking, TextInput, Pressable } from 'react-native';

const statuses = [{ id: `new`, label: `New`, Icon: RotateCcw }, { id: `read`, label: `Read`, Icon: BookOpen }, { id: `archived`, label: `Archived`, Icon: Archive }] as const;
const FeedbackEntries = ({ kind }: { kind: FeedbackKind }) => {
  const state = useFeedbackEntries(kind);
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [mediaError, setMediaError] = useState(``);
  const title = kind === `review` ? `Reviews` : `Bug`;
  const Icon = kind === `review` ? Star : Bug;
  const openMedia = async (value: string) => {
    setMediaError(``);
    try { const url = normalizePublicMediaUrl(value); if (url) await Linking.openURL(url); }
    catch { setMediaError(`Media Link Could Not Be Opened`); }
  };
  return <View {...elementProps(`feedback-entries`, kind)} style={styles.root}>
    <View {...elementProps(`feedback-entries-heading`, kind)} style={styles.heading}>
      <View {...elementProps(`feedback-entries-heading-copy`, kind)} style={styles.headingCopy}><View {...elementProps(`feedback-entries-title-row`, kind)} style={styles.titleRow}><Icon {...elementProps(`feedback-entries-title-icon`, kind)} size={20} color={palette.accent} accessible={false} /><Text {...elementProps(`feedback-entries-title`, kind)} style={styles.title} accessibilityRole={`header`}>{title}</Text></View><Text {...elementProps(`feedback-entries-coverage`, kind)} style={styles.copy}>{`Recent 50 ${kind === `review` ? `reviews` : `bug reports`} · Private feedback`}</Text></View>
      <AdminButton id={`feedback-${kind}-refresh`} label={`Refresh`} Icon={RotateCcw} disabled={state.loading || !!state.pendingId} onPress={state.refresh} />
    </View>
    {!state.allowed ? <StatePanel id={`feedback-${kind}-locked`} icon={`lock`} variant={`inline`} title={`Owner Access Required`} description={`Only the active Owner can review this feedback.`} /> : state.loading ? <AdminLoading id={`feedback-${kind}`} label={`Loading ${title}`} /> : state.error ? <StatePanel id={`feedback-${kind}-error`} icon={`error`} variant={`inline`} alert title={`${title} Unavailable`} description={state.error}><AdminButton id={`feedback-${kind}-retry`} label={`Retry`} Icon={RotateCcw} onPress={state.refresh} /></StatePanel> : <>
      <TextInput {...elementProps(`feedback-entries-search`, kind)} style={styles.search} value={state.search} onChangeText={state.setSearch} placeholder={`Search Recent ${title}`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Search Recent ${title}`} />
      <View {...elementProps(`feedback-entries-status-filters`, kind)} style={styles.actions}>{[{ id: `all`, label: `All` }, ...statuses].map(status => <Pressable key={status.id} {...elementProps(`feedback-entries-status-filter`, `${kind}-${status.id}`)} accessibilityRole={`button`} accessibilityState={{ selected: state.status === status.id }} style={[styles.statusButton, state.status === status.id && styles.selected]} onPress={() => state.setStatus(status.id)}><Text {...elementProps(`feedback-entries-status-filter-label`, `${kind}-${status.id}`)} style={[styles.statusText, state.status === status.id && styles.selectedText]}>{status.label}</Text></Pressable>)}</View>
      {state.notice ? <Text {...elementProps(`feedback-entries-notice`, kind)} style={styles.notice} accessibilityLiveRegion={`polite`}>{state.notice}</Text> : null}
      {state.mutationError ? <Text {...elementProps(`feedback-entries-save-error`, kind)} style={styles.error} accessibilityRole={`alert`}>{state.mutationError}</Text> : null}
      {mediaError ? <Text {...elementProps(`feedback-entries-media-error`, kind)} style={styles.error} accessibilityRole={`alert`}>{mediaError}</Text> : null}
      {!state.visible.length ? <StatePanel id={`feedback-${kind}-empty`} icon={state.search || state.status !== `all` ? `search` : `community`} variant={`inline`} title={state.search || state.status !== `all` ? `No matching feedback` : `No ${kind === `review` ? `reviews` : `bug reports`} yet`} description={state.search || state.status !== `all` ? `Try another search or status.` : `Signed-in feedback submitted through Contact will appear here.`} /> : <View {...elementProps(`feedback-entries-list`, kind)} style={styles.list}>{state.visible.map(entry => <View key={entry.id} {...elementProps(`feedback-entry`, entry.id)} style={styles.entry}>
        <View {...elementProps(`feedback-entry-heading`, entry.id)} style={styles.entryHeading}><FeedbackIdentity id={`entry-${entry.id}`} userId={entry.authorId} name={entry.authorName} caption={entry.authorEmail} /><StatusCell id={`feedback-entry-${entry.id}`} label={statuses.find(status => status.id === entry.status)?.label ?? entry.status} tone={entry.status === `new` ? `green` : entry.status === `archived` ? `red` : `gray`} /></View>
        {entry.rating !== null ? <View {...elementProps(`feedback-entry-rating`, entry.id)} style={styles.rating} accessibilityLabel={`${entry.rating} Out Of 5 Stars`}>{[0, 1, 2, 3, 4].map(index => <Star key={index} {...elementProps(`feedback-entry-rating-star`, `${entry.id}-${index}`)} size={15} color={index < (entry.rating ?? 0) ? `#fbbf24` : palette.muted} fill={index < (entry.rating ?? 0) ? `#fbbf24` : `none`} accessible={false} />)}<Text {...elementProps(`feedback-entry-rating-value`, entry.id)} style={styles.small}>{`${entry.rating} / 5`}</Text></View> : null}
        {entry.title ? <Text {...elementProps(`feedback-entry-title`, entry.id)} style={styles.entryTitle}>{entry.title}</Text> : null}
        {entry.description ? <Text {...elementProps(`feedback-entry-description`, entry.id)} selectable style={styles.description}>{entry.description}</Text> : null}
        {entry.mediaUrl ? <AdminButton id={`feedback-entry-media-${entry.id}`} label={`Open Screenshot Or Video`} Icon={ExternalLink} onPress={() => { void openMedia(entry.mediaUrl); }} /> : null}
        <Text {...elementProps(`feedback-entry-created`, entry.id)} style={styles.small}>{`#${entry.number} · ${new Date(entry.created).toLocaleString()}`}</Text>
        <View {...elementProps(`feedback-entry-status-actions`, entry.id)} style={styles.actions}>{statuses.map(({ id, label, Icon: StatusIcon }) => <AdminButton key={id} id={`feedback-entry-${entry.id}-${id}`} label={label} Icon={StatusIcon} disabled={!!state.pendingId || entry.status === id} onPress={() => { void state.updateStatus(entry.id, id); }} />)}{state.pendingId === entry.id ? <Text {...elementProps(`feedback-entry-status-pending`, entry.id)} style={styles.small}>{`Saving Status…`}</Text> : null}</View>
      </View>)}</View>}
    </>}
  </View>;
};
export default FeedbackEntries;
