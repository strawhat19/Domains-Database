import StatePanel from '../StatePanel';
import FeedbackIdentity from '../FeedbackIdentity';
import { createStyles } from './styles.native';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useSupportChat } from './useSupportChat';
import { useTheme } from '../../shared/themeContext/useTheme';
import { elementProps } from '../../shared/elementProps';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import type { SupportThread } from '../../shared/feedback/types';
import { AdminButton, AdminLoading } from '../AdminWidgets';
import { ArrowLeft, ChevronDown, RotateCcw, Send } from 'lucide-react-native';
import { Text, View, TextInput, ScrollView, Pressable } from 'react-native';

const formatDate = (value: string) => new Date(value).toLocaleString();
const SupportChat = ({ thread, onBack }: { thread: SupportThread; onBack?: () => void }) => {
  const state = useSupportChat(thread);
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const scrollRef = useRef<ScrollView>(null);
  const position = useRef({ height: 0, offset: 0, nearBottom: true });
  const olderPosition = useRef<{ height: number; offset: number } | null>(null);
  const [newMessages, setNewMessages] = useState(false);
  const scope = state.scope;
  const latestScope = useRef(scope);
  latestScope.current = scope;
  useEffect(() => { position.current = { height: 0, offset: 0, nearBottom: true }; olderPosition.current = null; setNewMessages(false); }, [scope]);
  const scrollToEnd = () => { position.current.nearBottom = true; setNewMessages(false); scrollRef.current?.scrollToEnd({ animated: !reducedMotion }); };
  return <View {...elementProps(`support-chat`, thread.id)} style={styles.root}>
    <View {...elementProps(`support-chat-heading`, thread.id)} style={styles.heading}>
      <View {...elementProps(`support-chat-heading-copy`, thread.id)} style={styles.headingCopy}>
        <Text {...elementProps(`support-chat-title`, thread.id)} style={styles.title} accessibilityRole={`header`}>{thread.subject}</Text>
        <Text {...elementProps(`support-chat-reference`, thread.id)} style={styles.muted}>{`Conversation #${thread.number} · Private Support`}</Text>
      </View>
      <View {...elementProps(`support-chat-actions`, thread.id)} style={styles.actions}>
        {onBack ? <AdminButton id={`support-chat-back-${thread.id}`} label={`Back`} Icon={ArrowLeft} disabled={state.pending} onPress={onBack} /> : null}
        <AdminButton id={`support-chat-refresh-${thread.id}`} label={`Refresh`} Icon={RotateCcw} disabled={state.pending || state.loading} onPress={state.refresh} />
      </View>
    </View>
    {!state.allowed ? <StatePanel id={`support-chat-locked-${thread.id}`} icon={`lock`} variant={`inline`} title={`Sign In To View This Conversation`} description={`This conversation is private to its sender and the support team.`} /> : state.loading ? <AdminLoading id={`support-chat-${thread.id}`} label={`Loading Conversation`} /> : <>
      {state.error ? <View {...elementProps(`support-chat-error`, thread.id)} style={styles.errorBox} accessibilityRole={`alert`}><Text {...elementProps(`support-chat-error-text`, thread.id)} style={styles.error}>{state.error}</Text><AdminButton id={`support-chat-retry-${thread.id}`} label={`Retry`} Icon={RotateCcw} onPress={state.refresh} /></View> : null}
      <Text {...elementProps(`support-chat-coverage`, thread.id)} style={styles.muted}>{`Latest 50 messages update live · Load older messages below`}</Text>
      {state.hasMore ? <AdminButton id={`support-chat-older-${thread.id}`} label={state.olderPending ? `Loading Older Messages…` : `Load Older Messages`} disabled={state.olderPending} onPress={() => { olderPosition.current = { height: position.current.height, offset: position.current.offset }; void state.loadOlder().then(added => { if (latestScope.current === scope && !added) olderPosition.current = null; }); }} /> : null}
      {state.olderError ? <Text {...elementProps(`support-chat-older-error`, thread.id)} style={styles.error} accessibilityRole={`alert`}>{state.olderError}</Text> : null}
      <ScrollView
        key={state.scope}
        ref={scrollRef}
        nestedScrollEnabled
        scrollEventThrottle={80}
        style={styles.messages}
        contentContainerStyle={styles.messageList}
        {...elementProps(`support-chat-messages`, thread.id)}
        onScroll={({ nativeEvent }) => { position.current.offset = nativeEvent.contentOffset.y; position.current.nearBottom = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y < 48; if (position.current.nearBottom) setNewMessages(false); }}
        onContentSizeChange={(_, height) => {
          const older = olderPosition.current;
          position.current.height = height;
          if (older && height > older.height) { scrollRef.current?.scrollTo({ y: older.offset + height - older.height, animated: false }); olderPosition.current = null; }
          else if (position.current.nearBottom) scrollRef.current?.scrollToEnd({ animated: !reducedMotion });
          else setNewMessages(true);
        }}
      >
        {!state.records.length && !state.error ? <Text {...elementProps(`support-chat-no-messages`, thread.id)} style={styles.muted}>{`No messages yet`}</Text> : null}
        {state.records.map(message => {
          const own = message.senderId === state.user?.id;
          return <View key={message.id} {...elementProps(`support-chat-message`, message.id)} style={[styles.message, own && styles.ownMessage]}>
            <FeedbackIdentity id={`message-${message.id}`} userId={message.senderId} name={message.senderName} caption={`${message.senderKind === `owner` ? `Support` : `Customer`} · ${formatDate(message.created)}`} />
            <Text {...elementProps(`support-chat-message-body`, message.id)} selectable style={styles.body}>{message.body}</Text>
          </View>;
        })}
      </ScrollView>
      {newMessages ? <AdminButton id={`support-chat-new-${thread.id}`} label={`View New Messages`} Icon={ChevronDown} onPress={scrollToEnd} /> : null}
      {state.readError ? <View {...elementProps(`support-chat-read-error`, thread.id)} style={styles.errorBox}><Text {...elementProps(`support-chat-read-error-text`, thread.id)} style={styles.error}>{state.readError}</Text><AdminButton id={`support-chat-read-retry-${thread.id}`} label={`Retry Marking Read`} onPress={() => { void state.retryRead(); }} /></View> : null}
      {thread.status === `closed` ? <Text {...elementProps(`support-chat-closed`, thread.id)} style={styles.muted}>{`This conversation is closed`}</Text> : <View {...elementProps(`support-chat-composer`, thread.id)} style={styles.composer}>
        <Text {...elementProps(`support-chat-composer-label`, thread.id)} style={styles.label}>{`Your Message`}</Text>
        <TextInput multiline maxLength={5000} value={state.body} editable={!state.pending} style={styles.input} placeholder={`Write a reply…`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Your Message`} {...elementProps(`support-chat-input`, thread.id)} onChangeText={state.updateBody} />
        <View {...elementProps(`support-chat-composer-actions`, thread.id)} style={styles.composerActions}><Text {...elementProps(`support-chat-message-count`, thread.id)} style={styles.muted}>{`${state.body.length.toLocaleString()} / 5,000`}</Text><Pressable {...elementProps(`support-chat-send`, thread.id)} accessibilityRole={`button`} accessibilityState={{ busy: state.pending, disabled: state.pending || !state.body.trim() }} disabled={state.pending || !state.body.trim()} style={[styles.send, (state.pending || !state.body.trim()) && styles.disabled]} onPress={() => { void state.send(); }}><Send {...elementProps(`support-chat-send-icon`, thread.id)} size={15} color={palette.contrast} accessible={false} /><Text {...elementProps(`support-chat-send-label`, thread.id)} style={styles.sendText}>{state.pending ? `Sending…` : `Send`}</Text></Pressable></View>
        {state.sendError ? <Text {...elementProps(`support-chat-send-error`, thread.id)} style={styles.error} accessibilityRole={`alert`}>{state.sendError}</Text> : null}
      </View>}
    </>}
  </View>;
};
export default SupportChat;
