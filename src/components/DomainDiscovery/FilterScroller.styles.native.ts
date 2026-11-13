import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  fade: { top: 0, bottom: 0, width: 24, position: `absolute` },
  outer: { minWidth: 0, width: `100%`, minHeight: 48, position: `relative` },
  viewport: { minWidth: 0, width: `100%`, maxHeight: 52, flexGrow: 0 },
  track: { gap: 8, paddingTop: 8, paddingLeft: 4, paddingRight: 8, paddingBottom: 4, flexWrap: `nowrap`, flexDirection: `row`, alignItems: `center` },
});
