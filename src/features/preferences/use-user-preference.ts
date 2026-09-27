"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@/features/auth/useAuth";

const PREFERENCES_PREFIX = "vera:preferences:v1";
const PREFERENCE_CHANGE_EVENT = "vera:preference-change";
const preferenceMemory = new Map<string, string>();

function readPreference<T extends string>(
  storageKey: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  try {
    const storedValue = preferenceMemory.get(storageKey) ??
      window.localStorage.getItem(storageKey);
    if (storedValue === null) return fallback;
    return isValid(storedValue) ? storedValue : fallback;
  } catch {
    const memoryValue = preferenceMemory.get(storageKey);
    return isValid(memoryValue) ? memoryValue : fallback;
  }
}

export function useUserPreference<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): readonly [T, (value: T) => void] {
  const { user } = useAuth();
  const storageKey = useMemo(() => {
    const username = user?.username.trim().toLocaleLowerCase("ru") || "current";
    return `${PREFERENCES_PREFIX}:${encodeURIComponent(username)}:${key}`;
  }, [key, user?.username]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== storageKey) {
        return;
      }
      preferenceMemory.delete(storageKey);
      onStoreChange();
    };

    const syncInCurrentTab = (event: Event) => {
      if (
        event instanceof CustomEvent &&
        event.detail?.storageKey === storageKey
      ) {
        onStoreChange();
      }
    };

    window.addEventListener("storage", syncFromAnotherTab);
    window.addEventListener(PREFERENCE_CHANGE_EVENT, syncInCurrentTab);
    return () => {
      window.removeEventListener("storage", syncFromAnotherTab);
      window.removeEventListener(PREFERENCE_CHANGE_EVENT, syncInCurrentTab);
    };
  }, [storageKey]);

  const getSnapshot = useCallback(
    () => readPreference(storageKey, fallback, isValid),
    [fallback, isValid, storageKey],
  );
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const updateValue = useCallback((nextValue: T) => {
    preferenceMemory.set(storageKey, nextValue);

    try {
      window.localStorage.setItem(storageKey, nextValue);
    } catch {
      // The in-memory preference keeps the interface operational.
    }

    window.dispatchEvent(new CustomEvent(PREFERENCE_CHANGE_EVENT, {
      detail: { storageKey },
    }));
  }, [storageKey]);

  return [value, updateValue] as const;
}
