import { useEffect, useRef } from "react";
import { SITE_NAME } from "../siteMeta";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PersonalDataAgreementDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="auth-agreement-dialog"
      aria-labelledby="auth-agreement-title"
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="auth-agreement-dialog-panel" onClick={(e) => e.stopPropagation()}>
        <header className="auth-agreement-dialog-head">
          <h2 id="auth-agreement-title" className="auth-agreement-dialog-title">
            Согласие на обработку персональных данных
          </h2>
          <button
            type="button"
            className="auth-agreement-dialog-close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="auth-agreement-dialog-body">
          <p className="auth-agreement-lead">
            Настоящий документ описывает порядок обработки персональных данных при использовании учебного симулятора{" "}
            {SITE_NAME}.
          </p>
          <h3 className="auth-agreement-h3">1. Оператор и состав данных</h3>
          <p>
            Обрабатываются данные, которые вы указываете при регистрации (адрес электронной почты), а также технические
            сведения, необходимые для работы сервиса (идентификатор сессии, сведения о действиях в симуляции в рамках
            учебного сценария).
          </p>
          <h3 className="auth-agreement-h3">2. Цели обработки</h3>
          <ul className="auth-agreement-list">
            <li>создание и ведение учётной записи;</li>
            <li>сохранение прогресса и результатов обучения;</li>
            <li>обеспечение работоспособности и безопасности приложения.</li>
          </ul>
          <h3 className="auth-agreement-h3">3. Правовые основания и срок</h3>
          <p>
            Обработка осуществляется на основании согласия субъекта данных. Данные хранятся в течение срока
            использования сервиса и удаляются при удалении учётной записи либо по отзыву согласия, если иное не
            предусмотрено законом.
          </p>
          <h3 className="auth-agreement-h3">4. Передача третьим лицам</h3>
          <p>
            Данные не передаются третьим лицам для маркетинга. Могут обрабатываться инфраструктурой хостинга в объёме,
            необходимом для хостинга приложения (по соглашениям с провайдером), если вы их подключаете сами.
          </p>
          <h3 className="auth-agreement-h3">5. Права субъекта</h3>
          <p>
            Вы вправе запросить доступ, исправление или удаление данных, ограничить обработку или отозвать согласие —
            через настройки профиля или обращение к администратору сервиса.
          </p>
          <p className="auth-agreement-note">
            Текст носит учебный и информационный характер. Для продакшена согласуйте формулировки с юристом и политикой
            вашей организации.
          </p>
        </div>
        <footer className="auth-agreement-dialog-footer">
          <button type="button" className="btn btn-primary auth-agreement-dialog-ok" onClick={onClose}>
            Понятно
          </button>
        </footer>
      </div>
    </dialog>
  );
}
