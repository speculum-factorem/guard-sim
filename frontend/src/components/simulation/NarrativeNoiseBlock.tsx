export function NarrativeNoiseBlock({ text }: { text: string }) {
  return (
    <aside className="narrative-noise" aria-label="Дополнительный текст в письме">
      <span className="narrative-noise-label">Шум и отвлекающие детали</span>
      <div className="narrative-noise-body">{text}</div>
    </aside>
  );
}
