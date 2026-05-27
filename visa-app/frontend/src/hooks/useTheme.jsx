import { useState, useEffect } from "react";

export default function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("vg-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("vg-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Apply saved theme on first mount
  useEffect(() => {
    const saved = localStorage.getItem("vg-theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => setIsDark((d) => !d);

  return { isDark, toggleTheme };
}
