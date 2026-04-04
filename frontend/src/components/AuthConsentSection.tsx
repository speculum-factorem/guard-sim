type Props = {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  onOpenAgreement: () => void;
  disabled?: boolean;
  error?: string | null;
  /** Если false — скрыта отдельная кнопка «Показать полный текст соглашения» (на экране регистрации). */
  showFullAgreementButton?: boolean;
};

export function AuthConsentSection({
  checked,
  onCheckedChange,
  onOpenAgreement,
  disabled,
  error,
  showFullAgreementButton = true,
}: Props) {
  return (
    <div className="auth-consent">
      <label className="auth-consent-row">
        <input
          type="checkbox"
          className="auth-consent-checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <span className="auth-consent-text">
          Я согласен на{" "}
          <button
            type="button"
            className="auth-consent-link"
            onClick={(e) => {
              e.preventDefault();
              onOpenAgreement();
            }}
          >
            обработку персональных данных
          </button>{" "}
          и подтверждаю, что ознакомлен с текстом соглашения.
        </span>
      </label>
      {error ? <p className="auth-field-error">{error}</p> : null}
      {showFullAgreementButton ? (
        <button type="button" className="auth-agreement-open-btn" onClick={onOpenAgreement} disabled={disabled}>
          Показать полный текст соглашения
        </button>
      ) : null}
    </div>
  );
}
