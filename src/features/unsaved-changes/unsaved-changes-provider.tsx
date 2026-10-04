"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UnsavedRegistration = {
  save: () => Promise<boolean>;
  discard?: () => void;
};

type UnsavedChangesContextValue = {
  register: (id: string, registration: UnsavedRegistration | null) => void;
  requestNavigation: (action: () => void) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const registrations = useRef(new Map<string, UnsavedRegistration>());
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);

  const register = useCallback(
    (id: string, registration: UnsavedRegistration | null) => {
      if (registration) registrations.current.set(id, registration);
      else registrations.current.delete(id);
    },
    [],
  );

  const requestNavigation = useCallback((action: () => void) => {
    if (registrations.current.size === 0) {
      action();
      return;
    }
    setPendingAction(() => action);
  }, []);

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        registrations.current.size === 0
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.download || (anchor.target && anchor.target !== "_self")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.href === window.location.href) return;

      event.preventDefault();
      event.stopPropagation();
      requestNavigation(() => {
        if (url.origin === window.location.origin) {
          router.push(`${url.pathname}${url.search}${url.hash}`);
        } else {
          window.location.assign(url.href);
        }
      });
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (registrations.current.size === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("click", handleLinkClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("click", handleLinkClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [requestNavigation, router]);

  const continueNavigation = () => {
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  };

  const saveAndContinue = async () => {
    setSaving(true);
    try {
      for (const registration of registrations.current.values()) {
        if (!(await registration.save())) return;
      }
      continueNavigation();
    } finally {
      setSaving(false);
    }
  };

  const discardAndContinue = () => {
    for (const registration of registrations.current.values()) {
      registration.discard?.();
    }
    continueNavigation();
  };

  return (
    <UnsavedChangesContext.Provider value={{ register, requestNavigation }}>
      {children}
      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setPendingAction(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Есть несохранённые данные</DialogTitle>
            <DialogDescription>
              Сохраните изменения перед переходом или продолжите без сохранения.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={discardAndContinue} disabled={saving}>
              Не сохранять
            </Button>
            <Button type="button" onClick={() => void saveAndContinue()} disabled={saving}>
              {saving && <LoaderCircle className="animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges({
  active,
  onSave,
  onDiscard,
}: {
  active: boolean;
  onSave: () => Promise<boolean>;
  onDiscard?: () => void;
}) {
  const context = useContext(UnsavedChangesContext);
  const id = useId();

  useEffect(() => {
    if (!context || !active) return;
    context.register(id, {
      save: onSave,
      discard: onDiscard,
    });
    return () => context.register(id, null);
  }, [active, context, id, onDiscard, onSave]);
}

export function useUnsavedNavigation() {
  const context = useContext(UnsavedChangesContext);
  return {
    requestNavigation: context?.requestNavigation ?? ((action: () => void) => action()),
  };
}
