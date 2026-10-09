import type { DragEvent } from 'react';
import { useRef, useEffect, useState } from 'react';
import type { EnvironmentFileDropZoneProps } from './types';

const hasFiles = (event: DragEvent<HTMLElement>) => (
  Boolean(event.dataTransfer?.files?.length)
  || Array.from(event.dataTransfer?.types ?? []).includes(`Files`)
  || Array.from(event.dataTransfer?.items ?? []).some(item => item.kind === `file`)
);
const suppressFileDrag = (event: DragEvent<HTMLElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

export const useEnvironmentFileDropZone = ({ disabled, onFiles }: Pick<EnvironmentFileDropZoneProps, `disabled` | `onFiles`>) => {
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const resetDrag = () => {
    depth.current = 0;
    setDragging(false);
  };
  useEffect(() => {
    depth.current = 0;
    setDragging(false);
  }, [disabled]);
  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!hasFiles(event)) return;
    suppressFileDrag(event);
    if (disabled) return;
    depth.current += 1;
    setDragging(true);
  };
  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!hasFiles(event)) return;
    suppressFileDrag(event);
    if (event.dataTransfer) event.dataTransfer.dropEffect = disabled ? `none` : `copy`;
  };
  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    const fileDrag = hasFiles(event);
    if (!fileDrag && !depth.current) return;
    if (fileDrag) suppressFileDrag(event);
    depth.current = Math.max(0, depth.current - 1);
    if (!depth.current) setDragging(false);
  };
  const onDrop = (event: DragEvent<HTMLElement>) => {
    const fileDrag = hasFiles(event);
    resetDrag();
    if (!fileDrag) return;
    suppressFileDrag(event);
    if (disabled) return;
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) onFiles(files);
  };
  return { onDrop, onDragOver, onDragLeave, onDragEnter, dragging: dragging && !disabled };
};
