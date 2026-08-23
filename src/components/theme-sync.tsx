"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * Applies the user's persisted theme preference (SYSTEM | LIGHT | DARK)
 * from the database once per session. After hydration, next-themes and
 * the settings page keep both localStorage and the database in sync.
 */
export function ThemeSync({
  theme,
}: {
  theme: "SYSTEM" | "LIGHT" | "DARK";
}) {
  const { setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    setTheme(theme.toLowerCase());
  }, [theme, setTheme]);

  return null;
}
