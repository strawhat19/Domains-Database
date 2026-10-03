export interface StackPillShapeProps {
  id: string;
  fill?: string;
  stroke?: string;
}

export const stackPillPath = (width: number, height: number) => {
  if (width <= 2 || height <= 2) return ``;
  const left = 1, top = 1;
  const right = width - 1, bottom = height - 1;
  const chamfer = Math.min(10, (width - 2) / 3, (height - 2) / 2);
  const radius = Math.min(3, chamfer / 3, (width - 2) / 6, (height - 2) / 6);
  const diagonal = radius / Math.SQRT2;
  return `M${left + radius} ${top} H${right - chamfer - radius}
    Q${right - chamfer} ${top} ${right - chamfer + diagonal} ${top + diagonal}
    L${right - diagonal} ${top + chamfer - diagonal}
    Q${right} ${top + chamfer} ${right} ${top + chamfer + radius}
    V${bottom - radius} Q${right} ${bottom} ${right - radius} ${bottom}
    H${left + radius} Q${left} ${bottom} ${left} ${bottom - radius}
    V${top + radius} Q${left} ${top} ${left + radius} ${top} Z`;
};
