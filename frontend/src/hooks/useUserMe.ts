import { useEffect, useState } from "react";
import { fetchMe } from "../api";
import { subscribeAuthChanged } from "../authEvents";
import type { UserMe } from "../types";

/** Профиль с сервера (гость или аккаунт), без требования JWT — достаточно X-GuardSim-Player. */
export function useUserMe(): { me: UserMe | null; loading: boolean } {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load(showSpinner: boolean) {
      if (showSpinner) {
        setLoading(true);
      }
      fetchMe()
        .then((m) => {
          if (!cancelled) {
            setMe(m);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMe(null);
          }
        })
        .finally(() => {
          if (!cancelled && showSpinner) {
            setLoading(false);
          }
        });
    }

    load(true);
    const unsub = subscribeAuthChanged(() => load(false));
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return { me, loading };
}
