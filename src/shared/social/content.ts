export const MAX_POST_LENGTH = 8000;
export type ContentBlock = { kind: `text` | `heading` | `code`; text: string; language?: string } | { kind: `image`; url: string; text: string };
export type InlinePart = { kind: `text` | `bold` | `italic` | `code` | `link`; text: string; url?: string };
export type EditorFormat = `bold` | `italic` | `code`;

export const publicHttpsUrl = (value: string): string | null => {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/\.$/, ``);
    if (url.protocol !== `https:` || url.username || url.password || !host.includes(`.`)
      || host.includes(`:`) || /^[\d.]+$/.test(host) || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)) return null;
    return url.toString();
  } catch { return null; }
};

export const validatePostContent = (body: string) => {
  if (typeof body !== `string` || !body.trim() || body.length > MAX_POST_LENGTH) throw new Error(`Write A Post Of 1 To ${MAX_POST_LENGTH} Characters`);
  let inCode = false;
  for (const line of body.replace(/\r\n?/g, `\n`).split(`\n`)) {
    if (line.startsWith(`\`\`\``)) { inCode = !inCode; continue; }
    if (inCode) continue;
    const imageContent = line.replace(/\`[^\`\n]+\`/g, ``);
    for (const match of imageContent.matchAll(/!\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
      if (!publicHttpsUrl(match?.[1] ?? ``)) throw new Error(`Images Need A Public HTTPS URL`);
    }
  }
  return body.trim();
};

export const parseContent = (body: string): ContentBlock[] => {
  const blocks: ContentBlock[] = [];
  const lines = body.slice(0, MAX_POST_LENGTH).replace(/\r\n?/g, `\n`).split(`\n`);
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? ``;
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith(`\`\`\``)) {
      const language = line.slice(3).trim().replace(/[^a-z\d+#.-]/gi, ``).slice(0, 24);
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index]?.startsWith(`\`\`\``)) code.push(lines[index++] ?? ``);
      if (index < lines.length) index += 1;
      blocks.push({ kind: `code`, language, text: code.join(`\n`) });
      continue;
    }
    const image = /^!\[([^\]\n]*)\]\(([^)\s]+)\)$/.exec(line.trim());
    if (image) {
      const url = publicHttpsUrl(image?.[2] ?? ``);
      blocks.push(url ? { kind: `image`, url, text: image?.[1] || `Post image` } : { kind: `text`, text: `[Image URL unavailable]` });
      index += 1;
      continue;
    }
    const heading = /^#{1,3}\s+(.+)$/.exec(line);
    if (heading) { blocks.push({ kind: `heading`, text: heading?.[1] ?? `` }); index += 1; continue; }
    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index]?.trim() && !/^(\`\`\`|#{1,3}\s|!\[)/.test(lines[index] ?? ``)) paragraph.push(lines[index++] ?? ``);
    blocks.push({ kind: `text`, text: paragraph.join(`\n`) });
  }
  return blocks;
};

export const parseInline = (text: string): InlinePart[] => {
  const parts: InlinePart[] = [];
  const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\`[^\`\n]+\`|\[[^\]\n]+\]\([^)\s]+\))/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const token = match?.[0] ?? ``;
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ kind: `text`, text: text.slice(cursor, index) });
    if (token.startsWith(`**`)) parts.push({ kind: `bold`, text: token.slice(2, -2) });
    else if (token.startsWith(`*`)) parts.push({ kind: `italic`, text: token.slice(1, -1) });
    else if (token.startsWith(`\``)) parts.push({ kind: `code`, text: token.slice(1, -1) });
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const url = publicHttpsUrl(link?.[2] ?? ``);
      parts.push(url ? { kind: `link`, url, text: link?.[1] ?? token } : { kind: `text`, text: token });
    }
    cursor = index + token.length;
  }
  if (cursor < text.length) parts.push({ kind: `text`, text: text.slice(cursor) });
  return parts;
};

export const insertFormatting = (value: string, selection: { start: number; end: number }, format: EditorFormat) => {
  const start = Math.min(selection.start, value.length);
  const end = Math.max(start, Math.min(selection.end, value.length));
  const selected = value.slice(start, end) || (format === `code` ? `Your code` : `Your text`);
  const marker = format === `bold` ? `**` : format === `italic` ? `*` : `\n\`\`\`\n`;
  const suffix = format === `code` ? `\n\`\`\`\n` : marker;
  const body = `${value.slice(0, start)}${marker}${selected}${suffix}${value.slice(end)}`;
  return { body, selection: { start: start + marker.length, end: start + marker.length + selected.length } };
};
