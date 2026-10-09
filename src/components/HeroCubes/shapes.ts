type TileFace = `top` | `left` | `right`;
type TilePoint = { x: number; y: number };
type TileGeometry = { x?: number; y?: number; depth: number; faceSkew: number; halfWidth: number; halfHeight: number };

export const getTileDepth = (row: number, column: number) => {
  const depthIndex = (row * 7 + column * 11) % 10;
  const variation = (row * 37 + column * 19) % 101 / 100;
  return depthIndex < 7 ? 6 + variation * 4 : depthIndex < 9 ? 12 + variation * 8 : 22 + variation * 10;
};

const blendPoint = (start: TilePoint, end: TilePoint, amount: number): TilePoint => ({
  x: start.x + (end.x - start.x) * amount,
  y: start.y + (end.y - start.y) * amount,
});
const pointPath = ({ x, y }: TilePoint) => `${x.toFixed(2)} ${y.toFixed(2)}`;
const roundCorner = (previous: TilePoint, vertex: TilePoint, next: TilePoint) => {
  const enter = blendPoint(vertex, previous, .17);
  const exit = blendPoint(vertex, next, .17);
  const enterControl = blendPoint(enter, vertex, .5);
  const exitControl = blendPoint(vertex, exit, .5);
  return { enter, exit, vertex, enterControl, exitControl, middle: blendPoint(enterControl, exitControl, .5) };
};

export const roundedTilePath = (face: TileFace, height: number, geometry: TileGeometry) => {
  const { x = 0, y = 0, depth, faceSkew, halfWidth, halfHeight } = geometry;
  const upper = { x, y: y - halfHeight - height };
  const lower = { x, y: y + halfHeight - height };
  const farLeft = { x: x - halfWidth, y: y - faceSkew - height };
  const farRight = { x: x + halfWidth, y: y + faceSkew - height };
  const top = roundCorner(farLeft, upper, farRight);
  const right = roundCorner(upper, farRight, lower);
  const bottom = roundCorner(farRight, lower, farLeft);
  const left = roundCorner(lower, farLeft, upper);
  const lowered = (point: TilePoint) => pointPath({ x: point.x, y: point.y + depth });

  if (face === `top`) return [
    `M${pointPath(top.enter)}Q${pointPath(top.vertex)} ${pointPath(top.exit)}`,
    `L${pointPath(right.enter)}Q${pointPath(right.vertex)} ${pointPath(right.exit)}`,
    `L${pointPath(bottom.enter)}Q${pointPath(bottom.vertex)} ${pointPath(bottom.exit)}`,
    `L${pointPath(left.enter)}Q${pointPath(left.vertex)} ${pointPath(left.exit)}Z`,
  ].join(``);
  if (face === `left`) return [
    `M${pointPath(left.middle)}Q${pointPath(left.enterControl)} ${pointPath(left.enter)}`,
    `L${pointPath(bottom.exit)}Q${pointPath(bottom.exitControl)} ${pointPath(bottom.middle)}`,
    `L${lowered(bottom.middle)}Q${lowered(bottom.exitControl)} ${lowered(bottom.exit)}`,
    `L${lowered(left.enter)}Q${lowered(left.enterControl)} ${lowered(left.middle)}Z`,
  ].join(``);
  return [
    `M${pointPath(bottom.middle)}Q${pointPath(bottom.enterControl)} ${pointPath(bottom.enter)}`,
    `L${pointPath(right.exit)}Q${pointPath(right.exitControl)} ${pointPath(right.middle)}`,
    `L${lowered(right.middle)}Q${lowered(right.exitControl)} ${lowered(right.exit)}`,
    `L${lowered(bottom.enter)}Q${lowered(bottom.enterControl)} ${lowered(bottom.middle)}Z`,
  ].join(``);
};
