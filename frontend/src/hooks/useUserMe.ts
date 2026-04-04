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
    let gen = 0;

    function load(showSpinner: boolean) {
      const myGen = ++gen;
      if (showSpinner) {
        setLoading(true);
      }
      fetchMe()
        .then((m) => {
          if (cancelled || myGen !== gen) {
            return;
          }
          setMe(m);
        })
        .catch(() => {
          if (cancelled || myGen !== gen) {
            return;
          }
          setMe(null);
        })
        .finally(() => {
          if (cancelled || myGen !== gen) {
            return;
          }
          if (showSpinner) {
            setLoading(false);
          }
        });
    }

    load(true);
    const unsub = subscribeAuthChanged(() => load(false));
    return () => {
      cancelled = true;
      gen += 1;
      unsub();
    };
  }, []);

  return { me, loading };
}
