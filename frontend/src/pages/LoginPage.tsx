import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginRequest } from "../api";
import { notifyAuthChanged } from "../authEvents";
import { setAuthToken } from "../authToken";
import { emailValidationMessage, passwordValidationMessage } from "../authValidation";
import { AuthConsentSection } from "../components/AuthConsentSection";
import { PersonalDataAgreementDialog } from "../components/PersonalDataAgreementDialog";
import { navigateToGuestDashboard } from "../guestDemoNav";
import { setPlayerId } from "../playerId";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);

  function validateFields(): boolean {
    const e = emailValidationMessage(email);
    const p = passwordValidationMessage(password, "login");
    setEmailError(e);
    setPasswordError(p);
    if (!consent) {
      setConsentError("Нужно согласие на обработку персональных данных");
    } else {
      setConsentError(null);
    }
    return !e && !p && consent;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateFields()) {
      return;
    }
    setBusy(true);
    try {
      const r = await loginRequest(email.trim(), password);
      setAuthToken(r.accessToken);
      setPlayerId(r.playerId);
      notifyAuthChanged();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page auth-page--enhanced auth-page--login lc-theme">
      <div className="auth-page-shell">
        <div className="auth-page-visual">
          <header className="auth-page-hero">
            <span className="auth-page-visual-badge">Аккаунт</span>
            <h1 className="page-title">Вход</h1>
            <p className="page-subtitle auth-page-lead">
              Войдите, чтобы сохранять прогресс на сервере. Без входа можно продолжить в режиме «Демо» с локальным ID в
              браузере.
            </p>
          </header>
        </div>

        <form className="auth-card auth-card--enhanced" onSubmit={onSubmit} noValidate>
          {error ? (
            <div className="auth-inline-error" role="alert">
              {error}
            </div>
          ) : null}
        <label className="auth-field">
          <span className="auth-label">Email</span>
          <div className="auth-input-wrap">
            <input
              className={`lc-input auth-input${emailError ? " auth-input--invalid" : ""}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
                if (emailError) {
                  setEmailError(emailValidationMessage(ev.target.value));
                }
              }}
              onBlur={() => setEmailError(email.trim() ? emailValidationMessage(email) : null)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "login-email-err" : undefined}
            />
          </div>
          {emailError ? (
            <p id="login-email-err" className="auth-field-error" role="alert">
              {emailError}
            </p>
          ) : null}
        </label>
        <label className="auth-field">
          <span className="auth-label">Пароль</span>
          <div className="auth-input-wrap">
            <input
              className={`lc-input auth-input${passwordError ? " auth-input--invalid" : ""}`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => {
                setPassword(ev.target.value);
                if (passwordError) {
                  setPasswordError(passwordValidationMessage(ev.target.value, "login"));
                }
              }}
              onBlur={() => setPasswordError(password ? passwordValidationMessage(password, "login") : null)}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "login-pw-err" : undefined}
            />
          </div>
          {passwordError ? (
            <p id="login-pw-err" className="auth-field-error" role="alert">
              {passwordError}
            </p>
          ) : null}
        </label>

        <AuthConsentSection
          checked={consent}
          onCheckedChange={(v) => {
            setConsent(v);
            if (v) {
              setConsentError(null);
            }
          }}
          onOpenAgreement={() => setAgreementOpen(true)}
          disabled={busy}
          error={consentError}
        />

        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? "Вход…" : "Войти"}
        </button>
        <button
          type="button"
          className="btn btn-secondary auth-submit auth-demo"
          onClick={() => navigateToGuestDashboard(navigate)}
        >
          Демо
        </button>

        <div className="auth-card-footer">
          <p className="auth-switch">
            Нет аккаунта?{" "}
            <Link to="/register" className="auth-switch-link">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </form>
      </div>

      <PersonalDataAgreementDialog open={agreementOpen} onClose={() => setAgreementOpen(false)} />
    </div>
  );
}
