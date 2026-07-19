"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { getDriver, resolveAuthDriver } from "@/lib/actions";
import {
  clearSelectedDriverId,
  getSelectedDriverId,
  setSelectedDriverId,
} from "@/lib/driver-session";
import type { Driver } from "@/lib/types";

type Ctx = {
  driver: Driver | null;
  driverId: string | null;
  loading: boolean;
  refresh: () => void;
  selectDriver: (id: string) => void;
  logout: () => void;
};

const DriverAppContext = createContext<Ctx | null>(null);

export function DriverAppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      try {
        const authDriver = await resolveAuthDriver();
        if (authDriver) {
          setSelectedDriverId(authDriver.id);
          setDriver(authDriver);
          return;
        }
        const id = getSelectedDriverId();
        if (!id) {
          setDriver(null);
          return;
        }
        const row = await getDriver(id);
        if (!row) {
          clearSelectedDriverId();
          setDriver(null);
          return;
        }
        setDriver(row);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<Ctx>(
    () => ({
      driver,
      driverId: driver?.id ?? null,
      loading,
      refresh: load,
      selectDriver: (id: string) => {
        setSelectedDriverId(id);
        load();
      },
      logout: () => {
        clearSelectedDriverId();
        setDriver(null);
        router.push("/driver");
      },
    }),
    [driver, loading, load, router],
  );

  return (
    <DriverAppContext.Provider value={value}>
      {children}
    </DriverAppContext.Provider>
  );
}

export function useDriverApp() {
  const ctx = useContext(DriverAppContext);
  if (!ctx) {
    throw new Error("useDriverApp must be used within DriverAppProvider");
  }
  return ctx;
}
