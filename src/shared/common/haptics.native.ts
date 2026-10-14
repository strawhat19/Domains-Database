import * as Haptics from 'expo-haptics';

export const portfolioHaptic = (kind: `tap` | `lift` | `tick` | `drop` = `tap`) => {
  const feedback = kind === `drop` ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : kind === `tick` ? Haptics.selectionAsync()
      : Haptics.impactAsync(kind === `lift` ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  void feedback.catch(() => undefined);
};
