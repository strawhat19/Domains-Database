import type { DragEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

export interface CsvDropZoneOptions {
  disabled: boolean;
  importing: boolean;
  onFiles: (files: File[]) => void;
}

const hasFiles = (event: DragEvent<HTMLElement>) => (
  Array.from(event.dataTransfer.types).includes(`Files`)
  || Array.from(event.dataTransfer.items).some(item => item.kind === `file`)
);

export const useCsvDropZone = ({ disabled, importing, onFiles }: CsvDropZoneOptions) => {
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const blocked = disabled || importing;

  const resetDrag = () => {
    depth.current = 0;
    setDragging(false);
  };

  useEffect(() => {
    if (!blocked) return;
    depth.current = 0;
    setDragging(false);
  }, [blocked]);

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (blocked || !hasFiles(event)) return;
    depth.current += 1;
    setDragging(true);
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = blocked || !hasFiles(event) ? `none` : `copy`;
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    depth.current = Math.max(0, depth.current - 1);
    if (!depth.current) setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resetDrag();
    if (blocked) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return {
    blocked,
    onDrop,
    onDragOver,
    onDragLeave,
    onDragEnter,
    dragging: dragging && !blocked,
  };
};
