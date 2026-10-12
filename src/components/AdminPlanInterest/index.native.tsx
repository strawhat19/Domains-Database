import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { Text, View, Pressable } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useAdminPlanInterest } from './useAdminPlanInterest';
import { useTheme } from '../../shared/themeContext/useTheme';
import { ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react-native';

const AdminPlanInterest = () => {
  const state = useAdminPlanInterest();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  if (!state.allowed) return null;
  return <View {...elementProps(`admin-plan-interest`)} style={styles.section}>
    <View {...elementProps(`admin-plan-interest-heading`)} style={styles.heading}>
      <Text {...elementProps(`admin-plan-interest-title`)} style={styles.title} accessibilityRole={`header`}>{`Plan Interest`}</Text>
      <Pressable disabled={state.loading} onPress={state.refresh} {...elementProps(`admin-plan-interest-refresh`)} style={styles.refresh} accessibilityRole={`button`} accessibilityLabel={`Refresh Plan Interest`} accessibilityState={{ disabled: state.loading }}>
        <RotateCcw size={15} color={palette.accent} {...elementProps(`admin-plan-interest-refresh-icon`)} /><Text {...elementProps(`admin-plan-interest-refresh-label`)} style={styles.refreshLabel}>{`Refresh`}</Text>
      </Pressable>
    </View>
    <Text {...elementProps(`admin-plan-interest-description`)} style={styles.description}>{state.source === `local` ? `Votes And Interest Saved On This Device` : `Saved Plan Votes And Signed-in Interest`}{state.error && state.ready ? ` · Last Confirmed Results` : ``}</Text>
    {state.error && <Text {...elementProps(`admin-plan-interest-error`)} style={styles.error} accessibilityRole={`alert`}>{state.error}</Text>}
    {!state.ready ? <Text {...elementProps(`admin-plan-interest-pending`)} style={styles.description} accessibilityLiveRegion={`polite`}>{state.loading ? `Loading Plan Interest` : `Plan Interest Is Unavailable`}</Text>
      : state.records.length ? state.records.map(record => <View key={record.planId} {...elementProps(`admin-plan-interest-row`, record.planId)} style={styles.row}>
        <Text {...elementProps(`admin-plan-interest-name`, record.planId)} style={styles.planName}>{record.planName}</Text>
        <View {...elementProps(`admin-plan-interest-counts`, record.planId)} style={styles.counts}>
          <View {...elementProps(`admin-plan-interest-up`, record.planId)} style={styles.count}><ThumbsUp size={14} color={palette.success} {...elementProps(`admin-plan-interest-up-icon`, record.planId)} /><Text {...elementProps(`admin-plan-interest-up-label`, record.planId)} style={styles.countText}>{`${record.up} Upvotes`}</Text></View>
          <View {...elementProps(`admin-plan-interest-down`, record.planId)} style={styles.count}><ThumbsDown size={14} color={palette.danger} {...elementProps(`admin-plan-interest-down-icon`, record.planId)} /><Text {...elementProps(`admin-plan-interest-down-label`, record.planId)} style={styles.countText}>{`${record.down} Downvotes`}</Text></View>
          <Text {...elementProps(`admin-plan-interest-interested`, record.planId)} style={styles.countText}>{`${record.interested} Signed-in Interest`}</Text>
        </View>
        <Text {...elementProps(`admin-plan-interest-updated`, record.planId)} style={styles.description}>{new Date(record.updated).toLocaleString()}</Text>
      </View>) : <Text {...elementProps(`admin-plan-interest-empty`)} style={styles.description}>{`No Plan Responses Yet`}</Text>}
  </View>;
};
export default AdminPlanInterest;
