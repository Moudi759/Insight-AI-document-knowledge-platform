"use client";

import { createContext, useContext } from "react";

interface Preferences {
  notificationsEnabled: boolean;
}

const PreferencesContext = createContext<Preferences>({
  notificationsEnabled: true,
});

export function PreferencesProvider({
  notificationsEnabled,
  children,
}: Preferences & { children: React.ReactNode }) {
  return (
    <PreferencesContext.Provider value={{ notificationsEnabled }}>
      {children}
    </PreferencesContext.Provider>
  );
}

/** Access workspace preferences from any client component. */
export function usePreferences(): Preferences {
  return useContext(PreferencesContext);
}
