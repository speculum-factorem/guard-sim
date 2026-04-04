import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { setDemoModeActive } from "../demoMode";
import { navigateToGuestDashboard } from "../guestDemoNav";
import { loginRequest } from "../api";
import { notifyAuthChanged } from "../authEvents";
import { setAuthToken } from "../authToken";
import { emailValidationMessage, passwordValidationMessage } from "../authValidation";
import { setPlayerId } from "../playerId";
import { safeNextPath } from "../navigationConstants";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const nextAfterAuth = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const authSwitchSearch = location.search;

  function validateFields(): boolean {
    const e = emailValidationMessage(email);
    const p = passwordValidationMessage(password, "login");
    setEmailError(e);
    setPasswordError(p);
    return !e && !p;
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
      setDemoModeActive(false);
      notifyAuthChanged();
      navigate(nextAfterAuth, { replace: true });
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
              Войдите, чтобы сохранять прогресс на сервере под своим профилем.
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

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? "Вход…" : "Войти"}
          </button>
          <button
            type="button"
            className="btn btn-secondary auth-submit auth-demo"
            disabled={busy}
            onClick={() => navigateToGuestDashboard(navigate)}
          >
            Демо
          </button>

          <div className="auth-card-footer">
            <p className="auth-switch">
              Нет аккаунта?{" "}
              <Link to={`/register${authSwitchSearch}`} className="auth-switch-link">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
