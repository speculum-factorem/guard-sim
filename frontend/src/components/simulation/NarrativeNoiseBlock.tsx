export function NarrativeNoiseBlock({ text }: { text: string }) {
  return (
    <aside className="narrative-noise" aria-label="Дополнительный фрагмент текста">
      <span className="narrative-noise-label">Дополнительный фрагмент</span>
      <div className="narrative-noise-body">{text}</div>
    </aside>
  );
}
