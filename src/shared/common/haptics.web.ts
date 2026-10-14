export type PortfolioHaptic = `tap` | `lift` | `tick` | `drop`;

export const portfolioHaptic = (kind: PortfolioHaptic) => {
  if (typeof navigator === `undefined` || typeof navigator.vibrate !== `function`) return;
  try { navigator.vibrate(kind === `lift` ? 18 : kind === `drop` ? [10, 30, 10] : 6); } catch { /* Feedback is optional on the web. */ }
};
