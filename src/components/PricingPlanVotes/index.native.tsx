import { useMemo } from 'react';
import { createStyles } from './styles.native';
import type { PricingPlanVotesProps } from './types';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { ThumbsUp } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';

const PricingPlanVotes = ({ id, name, state, onVote }: PricingPlanVotesProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const disabled = !state.ready || state.pending;
  const selected = state.ready && state.vote === `up`;
  return <View {...elementProps(`pricing-plan-votes`, id)} style={styles.votes}>
    <Pressable
      onPress={onVote}
      disabled={disabled}
      accessibilityRole={`button`}
      {...elementProps(`pricing-plan-vote`, `${id}-up`)}
      accessibilityState={{ selected, disabled, busy: state.pending }}
      accessibilityLabel={`${selected ? `Remove Upvote For` : `Upvote`} ${name}`}
      style={[styles.vote, selected && styles.selected, disabled && styles.disabled]}
    ><ThumbsUp {...elementProps(`pricing-plan-vote-icon`, `${id}-up`)} size={15} color={selected ? palette.accent : palette.muted} /><Text {...elementProps(`pricing-plan-vote-label`, `${id}-up`)} style={[styles.label, selected && styles.selectedLabel]}>{selected ? `Remove Upvote` : `Upvote`}</Text></Pressable>
  </View>;
};

export default PricingPlanVotes;
