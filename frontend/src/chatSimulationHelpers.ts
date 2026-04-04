/** Разбить текст сценария на «сообщения» для поочерёдного показа в чате. */
export function splitChatSegments(text: string): string[] {
  const t = text.trim();
  if (!t) {
    return [];
  }
  const paragraphs = t
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paragraphs.length > 1) {
    return paragraphs;
  }
  const lines = t
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length > 1) {
    return lines;
  }
  const sentences = t.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  if (sentences.length > 1 && t.length > 120) {
    return sentences.map((s) => s.trim());
  }
  return [t];
}
