export const backdropDots = Array.from({ length: 48 }, (_, index) => ({
  index,
  x: 18 + Math.floor(index / 6) * 22,
  y: 16 + index % 6 * 22,
  opacity: .18 + (index * 17 % 5) * .1,
}));
export const backdropSlabs = [
  { index: 0, x: 68, y: 78 },
  { index: 1, x: 132, y: 124 },
  { index: 2, x: 198, y: 68 },
];
export const slabFaces = {
  top: `M0 -22L36 0L0 22L-36 0Z`,
  left: `M-36 0L0 22L0 32L-36 10Z`,
  right: `M0 22L36 0L36 10L0 32Z`,
};
