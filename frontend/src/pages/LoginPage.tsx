import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginRequest } from "../api";
import { notifyAuthChanged } from "../authEvents";
import { setAuthToken } from "../authToken";
import { navigateToGuestDashboard } from "../guestDemoNav";
import { setPlayerId } from "../playerId";

export function LoginPage() {
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
    <div className="auth-page">
      <header className="auth-page-hero">
        <h1 className="page-title">Вход</h1>
        <p className="page-subtitle auth-page-lead">Войдите, чтобы привязать прогресс к аккаунту. Гость без входа по-прежнему использует локальный ID игрока.</p>
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
          <span className="auth-label">Пароль</span>
          <input
            className="lc-input auth-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={8}
          />
        </label>
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
        <p className="auth-alt">
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      </form>
    </div>
  );
}
