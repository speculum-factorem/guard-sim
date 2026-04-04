import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { StepPublic } from "../../types";
import { OrphanHotspotRow } from "./OrphanHotspotRow";
import { hotspotByVariant } from "./hotspotHelpers";

export function OAuthApprovalSimulation(props: {
  step: StepPublic;
  disabled: boolean;
  onChoose: (choiceId: string) => void;
  childrenFooter?: ReactNode;
  splitLayout?: boolean;
}) {
  const { step, disabled, onChoose, childrenFooter } = props;

  const appName = step.simExtensionName?.trim() || "Приложение";
  const publisher = step.simExtensionPublisher?.trim() || "Неизвестный разработчик";
  const blurb = step.simExtensionBlurb?.trim() || "";

  const permissions = useMemo(
    () =>
      step.narrative
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [step.narrative],
  );

  const authorizeHs = useMemo(() => hotspotByVariant(step, "LINK"), [step]);
  const orphan = useMemo(
    () => step.hotspots.filter((h) => h.variant.toUpperCase() !== "LINK"),
    [step.hotspots],
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [miniToast, setMiniToast] = useState<string | null>(null);

  useEffect(() => {
    setDetailsOpen(false);
    setMiniToast(null);
  }, [step.id]);

  useEffect(() => {
    if (!miniToast) return;
    const t = window.setTimeout(() => setMiniToast(null), 2500);
    return () => clearTimeout(t);
  }, [miniToast]);

  return (
    <div className="ui-frame ui-frame-oauth sim-oauth-root">
      {miniToast ? <div className="sim-mini-toast">{miniToast}</div> : null}

      {/* ── Microsoft-style header ── */}
      <header className="sim-oauth-ms-header" aria-label="Microsoft Azure AD">
        <div className="sim-oauth-ms-logo" aria-label="Microsoft" aria-hidden>
          <span className="sim-oauth-ms-sq sim-oauth-ms-sq--r" />
          <span className="sim-oauth-ms-sq sim-oauth-ms-sq--g" />
          <span className="sim-oauth-ms-sq sim-oauth-ms-sq--b" />
          <span className="sim-oauth-ms-sq sim-oauth-ms-sq--y" />
        </div>
        <span className="sim-oauth-ms-wordmark">Microsoft</span>
        <span className="sim-oauth-breadcrumb" aria-hidden>
          › Sign in › Permissions requested
        </span>
      </header>

      {/* ── Consent card ── */}
      <div className="sim-oauth-body">
        <div className="sim-oauth-card">
          {/* App identity */}
          <div className="sim-oauth-app-row">
            <div className="sim-oauth-app-icon" aria-hidden>
              ⚙
            </div>
            <div className="sim-oauth-app-meta">
              <h2 className="sim-oauth-app-name">{appName}</h2>
              <p className="sim-oauth-app-publisher">
                {publisher}
                <span className="sim-oauth-unverified" title="Издатель не верифицирован Microsoft">
                  {" "}
                  · Не верифицировано ⚠
                </span>
              </p>
            </div>
          </div>

          <p className="sim-oauth-headline">Это приложение запрашивает разрешение на:</p>

          {/* Permissions */}
          <ul className="sim-oauth-perms" aria-label="Запрашиваемые разрешения">
            {permissions.map((perm, i) => (
              <li key={i} className="sim-oauth-perm-item">
                <span className="sim-oauth-perm-x" aria-hidden>
                  ✕
                </span>
                <span className="sim-oauth-perm-text">{perm}</span>
              </li>
            ))}
          </ul>

          {/* Details toggle */}
          <button
            type="button"
            className="sim-oauth-details-toggle"
            onClick={() => setDetailsOpen(!detailsOpen)}
            aria-expanded={detailsOpen}
          >
            {detailsOpen ? "▴" : "▾"} Подробнее о разрешениях
          </button>
          {detailsOpen ? (
            <div className="sim-oauth-details-body" role="note">
              <p>
                Авторизуя это приложение, вы выдаёте ему токен доступа к вашей учётной записи
                Microsoft 365. Токен действует до его явного отзыва в Azure AD и позволяет
                приложению использовать перечисленные права{" "}
                <strong>без повторного ввода пароля и даже при включённом MFA</strong>.
              </p>
              <p>
                Не верифицированные издатели не имеют соглашения с Microsoft о безопасности
                данных и могут передавать информацию третьим лицам.
              </p>
            </div>
          ) : null}

          {blurb ? <p className="sim-oauth-blurb">{blurb}</p> : null}

          {/* Accept / Deny */}
          <div className="sim-oauth-actions">
            {authorizeHs ? (
              <button
                type="button"
                className="sim-oauth-accept-btn"
                disabled={disabled}
                onClick={() => onChoose(authorizeHs.choiceId)}
              >
                Разрешить
              </button>
            ) : null}
            <OrphanHotspotRow hotspots={orphan} disabled={disabled} onChoose={onChoose} />
          </div>

          <p className="sim-oauth-disclaimer">
            Принятие условий означает, что вы разрешаете приложению и его поставщику
            использовать ваши данные согласно их политике конфиденциальности.
          </p>
        </div>
      </div>

      {childrenFooter}
    </div>
  );
}
