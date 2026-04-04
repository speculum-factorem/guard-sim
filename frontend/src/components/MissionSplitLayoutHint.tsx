/** Одноразовая подсказка: сначала экран «Условие», затем кнопка перехода к симуляции. */
export function MissionSplitLayoutHint(props: { onDismiss: () => void }) {
  return (
    <div className="mission-split-hint" role="region" aria-label="Подсказка по интерфейсу">
      <p className="mission-split-hint-text">
        <strong>Как проходить шаг:</strong> сначала прочитайте условие и материал ниже, затем нажмите «Перейти к
        симуляции». Вернуться к тексту можно кнопкой «К условию» вверху экрана симуляции.
      </p>
      <button type="button" className="btn btn-secondary mission-split-hint-btn" onClick={props.onDismiss}>
        Понятно
      </button>
    </div>
  );
}
