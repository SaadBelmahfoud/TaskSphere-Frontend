"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type ColorTheme, COLOR_THEMES } from "@/providers/ThemeProvider";
import TokenTimer from "./TokenTimer";
import NotificationBell from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  ListTodo,
  Columns3,
  Shield,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  User,
  Palette,
  Check,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Navigation links with role-based visibility
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/kanban", label: "Kanban", icon: Columns3 },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
] as const;

// Color theme definitions for the dropdown
const colorThemeOptions: { value: ColorTheme; label: string; color: string }[] = [
  { value: "ocean", label: "Ocean", color: "oklch(0.42 0.11 168)" },
  { value: "sunset", label: "Sunset", color: "oklch(0.52 0.14 65)" },
  { value: "forest", label: "Forest", color: "oklch(0.45 0.12 150)" },
  { value: "berry", label: "Berry", color: "oklch(0.50 0.16 345)" },
  { value: "slate", label: "Slate", color: "oklch(0.38 0.04 260)" },
];

export default function Navbar() {
  const { auth, logout } = useAuth();
  const pathname = usePathname();
  const { resolvedTheme, setTheme, colorTheme, setColorTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!auth?.isAuthenticated) return null;

  const isAdmin = auth.role === "ADMIN";
  const roleLabel: Record<string, string> = {
    ADMIN: "Administrator",
    MANAGER: "Manager",
    USER: "Member",
  };

  const filteredLinks = navLinks.filter((l) => !l.adminOnly || isAdmin);

  const initials = auth.email
    ? auth.email.substring(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg mr-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-primary-foreground text-sm font-bold">TS</span>
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            TaskSphere
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                <Icon className={cn("h-4 w-4 transition-colors", isActive && "text-primary")} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <NotificationBell />
          <TokenTimer />

          {/* Theme Dropdown — combines Light/Dark + 5 Color Themes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <Palette className="h-4 w-4" />
                {/* Active color indicator dot */}
                <span
                  className="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-background"
                  style={{
                    backgroundColor: colorThemeOptions.find(t => t.value === colorTheme)?.color || "oklch(0.42 0.11 168)"
                  }}
                />
                <span className="sr-only">Theme settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Light/Dark Mode Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Mode</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className={cn("cursor-pointer", resolvedTheme === "light" && "bg-primary/5")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
                {resolvedTheme === "light" && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className={cn("cursor-pointer", resolvedTheme === "dark" && "bg-primary/5")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
                {resolvedTheme === "dark" && <Check className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Color Themes Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground">Color Theme</DropdownMenuLabel>
              {colorThemeOptions.map(({ value, label, color }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setColorTheme(value)}
                  className={cn("cursor-pointer", colorTheme === value && "bg-primary/5")}
                >
                  <span
                    className="mr-2 h-4 w-4 rounded-full shrink-0 ring-1 ring-border"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                  {colorTheme === value && <Check className="ml-auto h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  More settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 gap-2 px-2 rounded-full hover:bg-muted">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                  {auth.username || auth.email?.split("@")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="font-medium text-sm">{auth.email}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      auth.role === "ADMIN" ? "bg-primary/10 text-primary" :
                      auth.role === "MANAGER" ? "bg-amber/15 text-amber" :
                      "bg-muted text-muted-foreground"
                    )}>
                      <User className="mr-1 h-3 w-3" />
                      {roleLabel[auth.role || "USER"] || auth.role}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col p-2 gap-1">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile: Quick theme toggle */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-xs text-muted-foreground mr-1">Theme:</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? <Sun className="mr-1 h-3 w-3" /> : <Moon className="mr-1 h-3 w-3" />}
                {resolvedTheme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>

            {/* Mobile: Color themes row */}
            <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground shrink-0">Color:</span>
              {colorThemeOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setColorTheme(value)}
                  className={cn(
                    "shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                    colorTheme === value
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile: Settings + Logout */}
            <div className="border-t mt-1 pt-1">
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => { setMobileOpen(false); logout(); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
