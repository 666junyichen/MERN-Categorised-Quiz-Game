import { Sun, Moon } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

export default function ThemeToggle({ variant = "floating" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        variant === "floating" && "fixed top-5 right-5 z-50 shadow-md rounded-full"
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
