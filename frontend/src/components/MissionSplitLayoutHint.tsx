/** Одноразовая подсказка к макету «условие слева — симуляция справа». */
export function MissionSplitLayoutHint(props: { onDismiss: () => void }) {
  return (
    <div className="mission-split-hint" role="region" aria-label="Подсказка по интерфейсу">
      <p className="mission-split-hint-text">
        <strong>Как читать экран:</strong> условие и материал — в колонке слева, действия в симуляции — справа.
      </p>
      <button type="button" className="btn btn-secondary mission-split-hint-btn" onClick={props.onDismiss}>
        Понятно
      </button>
    </div>
  );
}
