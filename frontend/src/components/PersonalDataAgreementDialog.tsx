import { useEffect, useRef } from "react";

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
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const handler = () => onClose();
    el.addEventListener("close", handler);
    return () => el.removeEventListener("close", handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="auth-agreement-dialog"
      aria-labelledby="auth-agreement-title"
      onClick={(e) => {
        if (e.target === ref.current) {
          ref.current?.close();
        }
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
            onClick={() => ref.current?.close()}
          >
            ×
          </button>
        </header>
        <div className="auth-agreement-dialog-body">
          <p className="auth-agreement-lead">
            Настоящий текст разъясняет, какие данные обрабатываются в учебном сервисе GuardSim и в каких целях.
            Реальная юридическая обработка в вашем развёртывании должна соответствовать локальному законодательству
            (в т.ч. 152-ФЗ при обработке данных на территории РФ).
          </p>
          <h3 className="auth-agreement-h3">1. Оператор и состав данных</h3>
          <p>
            При регистрации и входе обрабатываются: адрес электронной почты, хэш пароля на стороне сервера,
            идентификатор игрока и игровой прогресс (сценарии, баллы, достижения), необходимые для работы сервиса.
          </p>
          <h3 className="auth-agreement-h3">2. Цели обработки</h3>
          <ul className="auth-agreement-list">
            <li>создание и ведение учётной записи;</li>
            <li>аутентификация и защита доступа;</li>
            <li>хранение и отображение прогресса в симуляциях.</li>
          </ul>
          <h3 className="auth-agreement-h3">3. Правовые основания и срок</h3>
          <p>
            Обработка осуществляется на основании вашего согласия, выраженного при отметке соответствующего поля
            и отправке формы. Данные хранятся до удаления учётной записи или отзыва согласия, если иное не требуется
            для исполнения закона.
          </p>
          <h3 className="auth-agreement-h3">4. Передача третьим лицам</h3>
          <p>
            Данные не передаются третьим лицам для рекламы. Используются только инфраструктура и сервисы,
            необходимые для хостинга приложения (по соглашениям с провайдером), если вы их подключаете сами.
          </p>
          <h3 className="auth-agreement-h3">5. Права субъекта</h3>
          <p>
            Вы можете запросить уточнение данных, их копию, блокирование или удаление — через контакт администратора
            вашего экземпляра GuardSim, если такой процесс настроен.
          </p>
          <p className="auth-agreement-note">
            В демо-режиме без регистрации локальный идентификатор игрока хранится только в браузере и не связывается с
            email, пока вы не войдёте в аккаунт.
          </p>
        </div>
        <footer className="auth-agreement-dialog-footer">
          <button type="button" className="btn btn-primary auth-agreement-dialog-ok" onClick={() => ref.current?.close()}>
            Понятно
          </button>
        </footer>
      </div>
    </dialog>
  );
}
