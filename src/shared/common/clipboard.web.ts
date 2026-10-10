export const copyText = async (text: string, id = `portfolio-copy-buffer`): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const focusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const buffer = document.createElement(`textarea`);
  buffer.value = text;
  buffer.tabIndex = -1;
  buffer.readOnly = true;
  buffer.id = id;
  buffer.className = `portfolio-copy-buffer`;
  buffer.setAttribute(`aria-hidden`, `true`);
  document.body.appendChild(buffer);
  try {
    buffer.select();
    if (!document.execCommand(`copy`)) throw new Error(`Copy Unavailable`);
  } finally {
    buffer.remove();
    focusedElement?.focus({ preventScroll: true });
  }
};
