import { ThemeProvider } from "next-themes";
import * as React from "react";
import "../styles/dashboard-theme.css";

interface DashboardThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
}

export function DashboardThemeProvider({
  children,
  defaultTheme = "light",
}: DashboardThemeProviderProps) {
  // Apply theme class to body element
  React.useEffect(() => {
    document.body.className = `dashboard-theme ${defaultTheme === "dark" ? "dark" : ""}`;
    return () => {
      document.body.classList.remove("dashboard-theme", "dark");
    };
  }, [defaultTheme]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      value={{
        light: "dashboard-theme",
        dark: "dashboard-theme dark",
      }}
    >
      {children}
    </ThemeProvider>
  );
}
