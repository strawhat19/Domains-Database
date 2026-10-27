import SupportChat from '../SupportChat';
import StatePanel from '../StatePanel';
import FeedbackIdentity from '../FeedbackIdentity';
import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { useSupportInbox } from './useSupportInbox';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Text, View, TextInput, Pressable } from 'react-native';
import { AdminButton, AdminLoading, StatusCell } from '../AdminWidgets';
import { ArrowUpRight, RotateCcw } from 'lucide-react-native';

const SupportInbox = () => {
  const state = useSupportInbox();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (state.selectedThread) return <SupportChat thread={state.selectedThread} onBack={() => state.select(``)} />;
  return <View {...elementProps(`support-inbox`)} style={styles.root}>
    <View {...elementProps(`support-inbox-heading`)} style={styles.heading}>
      <View {...elementProps(`support-inbox-heading-copy`)} style={styles.headingCopy}><Text {...elementProps(`support-inbox-title`)} style={styles.title} accessibilityRole={`header`}>{`Support Conversations`}</Text><Text {...elementProps(`support-inbox-coverage`)} style={styles.copy}>{`Recent 40 conversations · Signed-in contact messages`}</Text></View>
      <AdminButton id={`support-inbox-refresh`} label={`Refresh`} Icon={RotateCcw} disabled={state.loading} onPress={state.refresh} />
    </View>
    {!state.allowed ? <StatePanel id={`support-inbox-locked`} icon={`lock`} variant={`inline`} title={`Owner Access Required`} description={`Only the active Owner can review support conversations.`} /> : state.loading ? <AdminLoading id={`support-inbox`} label={`Loading Support Conversations`} /> : state.error ? <StatePanel id={`support-inbox-error`} icon={`error`} variant={`inline`} alert title={`Support Inbox Unavailable`} description={state.error}><AdminButton id={`support-inbox-retry`} label={`Retry`} Icon={RotateCcw} onPress={state.refresh} /></StatePanel> : <>
      <TextInput {...elementProps(`support-inbox-search`)} style={styles.search} value={state.search} onChangeText={state.setSearch} placeholder={`Search Recent Conversations`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Search Recent Conversations`} />
      {!state.visible.length ? <StatePanel id={`support-inbox-empty`} icon={state.search ? `search` : `community`} variant={`inline`} title={state.search ? `No matching conversations` : `No conversations yet`} description={state.search ? `Try another name or clear the search.` : `Signed-in contact messages will open private conversations here.`} /> : <View {...elementProps(`support-inbox-list`)} style={styles.list}>{state.visible.map(thread => <Pressable key={thread.id} {...elementProps(`support-inbox-thread`, thread.id)} style={styles.thread} accessibilityRole={`button`} accessibilityLabel={`Open Conversation ${thread.number}, ${thread.customerName}, ${thread.subject}`} onPress={() => state.select(thread.id)}>
        <View {...elementProps(`support-inbox-thread-heading`, thread.id)} style={styles.threadHeading}><FeedbackIdentity id={`thread-${thread.id}`} userId={thread.customerId} name={thread.customerName} caption={thread.customerEmail} /><StatusCell id={`support-thread-${thread.id}`} label={thread.status === `open` ? `Open` : `Closed`} tone={thread.status === `open` ? `green` : `gray`} /></View>
        <Text {...elementProps(`support-inbox-thread-subject`, thread.id)} style={styles.subject}>{thread.subject}</Text>
        <Text {...elementProps(`support-inbox-thread-preview`, thread.id)} numberOfLines={2} style={styles.copy}>{thread.lastMessageText}</Text>
        <View {...elementProps(`support-inbox-thread-footer`, thread.id)} style={styles.threadFooter}><Text {...elementProps(`support-inbox-thread-date`, thread.id)} style={styles.small}>{`#${thread.number} · ${new Date(thread.lastMessageAt).toLocaleString()}`}</Text><ArrowUpRight {...elementProps(`support-inbox-thread-icon`, thread.id)} size={15} color={palette.accent} accessible={false} /></View>
      </Pressable>)}</View>}
    </>}
  </View>;
};
export default SupportInbox;
