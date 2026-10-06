import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  fade: { top: 0, bottom: 0, width: 24, position: `absolute` },
  outer: { minWidth: 0, width: `100%`, minHeight: 44, position: `relative` },
  viewport: { minWidth: 0, width: `100%`, maxHeight: 48, flexGrow: 0 },
  track: { gap: 8, flexWrap: `nowrap`, paddingVertical: 4, paddingHorizontal: 4, flexDirection: `row`, alignItems: `center` },
});
