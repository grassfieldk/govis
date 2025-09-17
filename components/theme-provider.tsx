"use client";

import {
  type ThemeProviderProps as NextThemeProviderProps,
  ThemeProvider as NextThemesProvider,
} from "next-themes";

export const ThemeProvider = ({
  children,
  ...props
}: NextThemeProviderProps) => (
  <NextThemesProvider {...props}>{children}</NextThemesProvider>
);
