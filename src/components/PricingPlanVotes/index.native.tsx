import { useMemo } from 'react';
import { createStyles } from './styles.native';
import type { PricingPlanVotesProps } from './types';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { useTheme } from '../../shared/themeContext/useTheme';

const PricingPlanVotes = ({ id, name, state, onVote }: PricingPlanVotesProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const disabled = !state.ready || state.pending;
  return <View {...elementProps(`pricing-plan-votes`, id)} style={styles.votes}>
    {([`up`, `down`] as const).map(direction => {
      const Icon = direction === `up` ? ThumbsUp : ThumbsDown;
      const label = direction === `up` ? `Upvote` : `Downvote`;
      const selected = state.ready && state.vote === direction;
      return <Pressable
        key={direction}
        disabled={disabled}
        accessibilityRole={`button`}
        onPress={() => onVote(direction)}
        {...elementProps(`pricing-plan-vote`, `${id}-${direction}`)}
        accessibilityState={{ selected, disabled, busy: state.pending }}
        accessibilityLabel={`${selected ? `Remove` : label} ${name}${selected ? ` ${label}` : ``}`}
        style={[styles.vote, selected && styles.selected, disabled && styles.disabled]}
      ><Icon {...elementProps(`pricing-plan-vote-icon`, `${id}-${direction}`)} size={15} color={selected ? palette.accent : palette.muted} /><Text {...elementProps(`pricing-plan-vote-label`, `${id}-${direction}`)} style={[styles.label, selected && styles.selectedLabel]}>{label}</Text></Pressable>;
    })}
  </View>;
};

export default PricingPlanVotes;
