import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest } from "../api";
import { setAuthToken } from "../authToken";
import { navigateToGuestDashboard } from "../guestDemoNav";
import { setPlayerId } from "../playerId";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await registerRequest(email.trim(), password);
      setAuthToken(r.accessToken);
      setPlayerId(r.playerId);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-page-hero">
        <h1 className="page-title">Регистрация</h1>
        <p className="page-subtitle auth-page-lead">Создайте аккаунт — прогресс хранится на сервере под вашим профилем игрока.</p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <form className="auth-card" onSubmit={onSubmit}>
        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            className="lc-input auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
          />
        </label>
        <label className="auth-field">
          <span className="auth-label">Пароль (от 8 символов)</span>
          <input
            className="lc-input auth-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={8}
          />
        </label>
        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
          {busy ? "Создание…" : "Зарегистрироваться"}
        </button>
        <button
          type="button"
          className="btn btn-secondary auth-submit auth-demo"
          onClick={() => navigateToGuestDashboard(navigate)}
        >
          Демо
        </button>
        <p className="auth-alt">
          Уже есть аккаунт? <Link to="/login">Вход</Link>
        </p>
      </form>
    </div>
  );
}
