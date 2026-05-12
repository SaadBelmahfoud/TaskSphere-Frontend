"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type ColorTheme } from "@/providers/ThemeProvider";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Lock,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Monitor,
  Sun,
  Moon,
  Globe,
  Bell,
  BellRing,
  LayoutGrid,
  List,
  Columns3,
  Smartphone,
  Laptop,
  Clock,
  AlertTriangle,
  Pencil,
  Check,
  Palette,
  Waves,
  Sunset,
  Trees,
  Flower2,
  Mountain,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Password strength helper (same as register page) =====
function getPasswordStrength(password: string) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  if (checks.length) score++;
  if (checks.uppercase) score++;
  if (checks.lowercase) score++;
  if (checks.number) score++;
  if (checks.special) score++;

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Strong"];
  const colors = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-green-500",
  ];
  const textColors = [
    "",
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-green-500",
    "text-green-500",
  ];

  return {
    score,
    label: labels[score] || "",
    color: colors[score] || "",
    textColor: textColors[score] || "",
    checks,
  };
}

// ===== Section definitions for sidebar =====
const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
] as const;

type SectionId = (typeof sections)[number]["id"];

// ===== Mock data =====
const mockSessions = [
  {
    id: "1",
    device: "Current Session",
    icon: Laptop,
    browser: "Chrome on macOS",
    location: "San Francisco, US",
    lastActive: "Just now",
    isCurrent: true,
  },
  {
    id: "2",
    device: "Mobile App",
    icon: Smartphone,
    browser: "TaskSphere iOS App",
    location: "New York, US",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
];

// ===== Main Page Component =====
export default function SettingsPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Preferences state
  const [language, setLanguage] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [defaultTaskView, setDefaultTaskView] = useState("grid");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Refs for scrolling
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    profile: null,
    account: null,
    preferences: null,
    security: null,
  });

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  );
  const passwordsMatch =
    confirmNewPassword.length > 0 && newPassword === confirmNewPassword;
  const passwordsMismatch =
    confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  const initials = auth?.email
    ? auth.email.substring(0, 2).toUpperCase()
    : "U";

  // Scroll to section handler
  const scrollToSection = useCallback((id: SectionId) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // IntersectionObserver to track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Auth guard
  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated) return null;

  return (
    <AppLayout>
    <div className="space-y-0">
      {/* Gradient header banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 dark:from-primary/20 dark:via-primary/10 dark:to-emerald-500/20 -mx-4 sm:-mx-6 -mt-6 mb-8 px-6 py-8 sm:px-8 sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent dark:from-white/5" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your profile, account, preferences, and security settings
          </p>
        </motion.div>
      </div>

      {/* Mobile: Horizontal tabs */}
      <div className="mb-6 md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border/60 scrollbar-none">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors",
                activeSection === id
                  ? "text-primary border-b-2 border-primary -mb-[2px] bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div className="flex gap-8">
        {/* Desktop: Left sidebar */}
        <nav className="hidden md:flex flex-col w-52 shrink-0 sticky top-20 self-start">
          <div className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
                  activeSection === id
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    activeSection === id ? "text-primary" : ""
                  )}
                />
                {label}
                {activeSection === id && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* ==================== PROFILE SECTION ==================== */}
          <motion.div
            id="profile"
            ref={(el) => {
              sectionRefs.current.profile = el;
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24 shadow-lg ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        toast("Coming soon", {
                          description:
                            "Profile editing will be available in a future update",
                        })
                      }
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Change Avatar
                    </Button>
                  </div>

                  {/* User info */}
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Email
                        </p>
                        <p className="text-sm font-medium">
                          {auth?.email || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Username
                        </p>
                        <p className="text-sm font-medium">
                          {auth?.username || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Role
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              auth?.role === "ADMIN"
                                ? "default"
                                : auth?.role === "MANAGER"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {auth?.role || "USER"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Member Since
                        </p>
                        <p className="text-sm font-medium">January 2025</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        toast("Coming soon", {
                          description:
                            "Profile editing will be available in a future update",
                        })
                      }
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ==================== ACCOUNT SECTION ==================== */}
          <motion.div
            id="account"
            ref={(el) => {
              sectionRefs.current.account = el;
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Account
                </CardTitle>
                <CardDescription>
                  Change your password or manage your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Password */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Change Password</h3>

                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pr-10 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showCurrentPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showNewPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password strength indicator (5 segment bar) */}
                    {newPassword.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((segment) => (
                            <div
                              key={segment}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                                segment <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                        <p
                          className={cn(
                            "text-xs font-medium",
                            passwordStrength.textColor
                          )}
                        >
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-new-password"
                        type={showConfirmNewPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="pr-10 transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmNewPassword(!showConfirmNewPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={
                          showConfirmNewPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password match indicator */}
                    {confirmNewPassword.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {passwordsMatch ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs font-medium text-green-500">
                              Passwords match
                            </span>
                          </>
                        ) : passwordsMismatch ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-xs font-medium text-red-500">
                              Passwords don&apos;t match
                            </span>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full sm:w-auto"
                    onClick={() =>
                      toast("Coming soon", {
                        description:
                          "Password change functionality will be available in a future update",
                      })
                    }
                  >
                    Save Password
                  </Button>
                </div>

                <Separator />

                {/* Delete Account - Danger Zone */}
                <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:p-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      toast("Coming soon", {
                        description:
                          "Account deletion will be available in a future update",
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ==================== PREFERENCES SECTION ==================== */}
          <motion.div
            id="preferences"
            ref={(el) => {
              sectionRefs.current.preferences = el;
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience and notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Theme Preference — Functional via next-themes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Theme</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred appearance for the application
                  </p>
                  <RadioGroup
                    value={theme ?? "system"}
                    onValueChange={(value) => {
                      setTheme(value);
                      toast.success(`Theme set to ${value}`);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {[
                      {
                        value: "light",
                        label: "Light",
                        icon: Sun,
                        desc: "Always use light theme",
                      },
                      {
                        value: "dark",
                        label: "Dark",
                        icon: Moon,
                        desc: "Always use dark theme",
                      },
                      {
                        value: "system",
                        label: "System",
                        icon: Monitor,
                        desc: "Match your OS setting",
                      },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <Label
                        key={value}
                        htmlFor={`theme-${value}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-150 hover:bg-muted/50",
                          (theme ?? "system") === value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border"
                        )}
                      >
                        <RadioGroupItem
                          value={value}
                          id={`theme-${value}`}
                        />
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            (theme ?? "system") === value
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {desc}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Color Theme — Functional via ThemeProvider */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Color Theme</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose a color palette that suits your style. Works with both light and dark modes.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {([
                      {
                        value: "ocean" as ColorTheme,
                        label: "Ocean",
                        desc: "Professional, trustworthy",
                        icon: Waves,
                        swatch: "oklch(0.42 0.11 168)",
                        swatchLight: "oklch(0.62 0.14 168)",
                      },
                      {
                        value: "sunset" as ColorTheme,
                        label: "Sunset",
                        desc: "Warm, energetic",
                        icon: Sunset,
                        swatch: "oklch(0.52 0.14 65)",
                        swatchLight: "oklch(0.72 0.15 65)",
                      },
                      {
                        value: "forest" as ColorTheme,
                        label: "Forest",
                        desc: "Natural, calm",
                        icon: Trees,
                        swatch: "oklch(0.45 0.12 150)",
                        swatchLight: "oklch(0.65 0.14 150)",
                      },
                      {
                        value: "berry" as ColorTheme,
                        label: "Berry",
                        desc: "Vibrant, modern",
                        icon: Flower2,
                        swatch: "oklch(0.50 0.16 345)",
                        swatchLight: "oklch(0.70 0.16 345)",
                      },
                      {
                        value: "slate" as ColorTheme,
                        label: "Slate",
                        desc: "Minimal, sophisticated",
                        icon: Mountain,
                        swatch: "oklch(0.38 0.04 260)",
                        swatchLight: "oklch(0.62 0.04 260)",
                      },
                    ] as const).map(({ value, label, desc, icon: Icon, swatch, swatchLight }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setColorTheme(value);
                          toast.success(`Color theme set to ${label}`);
                        }}
                        className={cn(
                          "group relative flex flex-col items-center gap-2.5 rounded-lg border p-4 cursor-pointer transition-all duration-150 hover:bg-muted/50",
                          (colorTheme ?? "ocean") === value
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                            : "border-border"
                        )}
                        aria-label={`Select ${label} color theme`}
                      >
                        {/* Color swatch */}
                        <div className="relative flex items-center justify-center">
                          <div
                            className="h-10 w-10 rounded-full border-2 border-white/50 shadow-md transition-transform duration-150 group-hover:scale-110"
                            style={{ backgroundColor: swatch }}
                          />
                          <div
                            className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-background shadow-sm transition-transform duration-150 group-hover:scale-110"
                            style={{ backgroundColor: swatchLight }}
                          />
                          {(colorTheme ?? "ocean") === value && (
                            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        {/* Label */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Icon className={cn(
                              "h-3.5 w-3.5",
                              (colorTheme ?? "ocean") === value
                                ? "text-primary"
                                : "text-muted-foreground"
                            )} />
                            <p className="text-sm font-medium">{label}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                            {desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Language</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select your preferred language for the interface
                  </p>
                  <RadioGroup
                    value={language}
                    onValueChange={(value) => {
                      setLanguage(value);
                      toast("Coming soon", {
                        description:
                          "Language change will be available in a future update",
                      });
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "en", label: "English", desc: "Default language" },
                      { value: "fr", label: "French", desc: "Français" },
                    ].map(({ value, label, desc }) => (
                      <Label
                        key={value}
                        htmlFor={`lang-${value}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-150 hover:bg-muted/50",
                          language === value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border"
                        )}
                      >
                        <RadioGroupItem
                          value={value}
                          id={`lang-${value}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {desc}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Notification Preferences — Toggle switches (visual only) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Notifications</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Control how you receive notifications
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <BellRing className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            Email Notifications
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Receive task updates and reminders via email
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={(checked) => {
                          setEmailNotifications(checked);
                          toast("Coming soon", {
                            description:
                              "Notification preferences will be saved in a future update",
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
                          <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            Push Notifications
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Get instant push notifications on your devices
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={pushNotifications}
                        onCheckedChange={(checked) => {
                          setPushNotifications(checked);
                          toast("Coming soon", {
                            description:
                              "Notification preferences will be saved in a future update",
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Default Task View — Visual only */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Default Task View</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose how tasks are displayed by default
                  </p>
                  <RadioGroup
                    value={defaultTaskView}
                    onValueChange={(value) => {
                      setDefaultTaskView(value);
                      toast("Coming soon", {
                        description:
                          "Default view preference will be saved in a future update",
                      });
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {[
                      {
                        value: "grid",
                        label: "Grid",
                        icon: LayoutGrid,
                        desc: "Card grid layout",
                      },
                      {
                        value: "list",
                        label: "List",
                        icon: List,
                        desc: "Compact list view",
                      },
                      {
                        value: "kanban",
                        label: "Kanban",
                        icon: Columns3,
                        desc: "Board columns view",
                      },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <Label
                        key={value}
                        htmlFor={`view-${value}`}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all duration-150 hover:bg-muted/50",
                          defaultTaskView === value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border"
                        )}
                      >
                        <RadioGroupItem
                          value={value}
                          id={`view-${value}`}
                        />
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            defaultTaskView === value
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {desc}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ==================== SECURITY SECTION ==================== */}
          <motion.div
            id="security"
            ref={(el) => {
              sectionRefs.current.security = el;
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your security settings and active sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Active Sessions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Active Sessions</h3>
                  <p className="text-xs text-muted-foreground">
                    Devices where you are currently signed in
                  </p>

                  <div className="space-y-3">
                    {mockSessions.map((session) => {
                      const SessionIcon = session.icon;
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                session.isCurrent
                                  ? "bg-primary/10"
                                  : "bg-muted"
                              )}
                            >
                              <SessionIcon
                                className={cn(
                                  "h-5 w-5",
                                  session.isCurrent
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {session.device}
                                </p>
                                {session.isCurrent && (
                                  <Badge
                                    variant="default"
                                    className="text-[10px] px-1.5 py-0 h-4"
                                  >
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {session.browser} &middot; {session.location}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {session.lastActive}
                            </span>
                            {!session.isCurrent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                                onClick={() =>
                                  toast("Coming soon", {
                                    description:
                                      "Session management will be available in a future update",
                                  })
                                }
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Two-Factor Authentication */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add an extra layer of security to your account by requiring
                    a verification code in addition to your password.
                  </p>
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          twoFactorEnabled
                            ? "bg-emerald-500/10"
                            : "bg-muted"
                        )}
                      >
                        <Shield
                          className={cn(
                            "h-5 w-5",
                            twoFactorEnabled
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {twoFactorEnabled ? "Enabled" : "Disabled"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {twoFactorEnabled
                            ? "Your account is protected with 2FA"
                            : "Enable 2FA for enhanced security"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        setTwoFactorEnabled(checked);
                        toast("Coming soon", {
                          description:
                            "Two-factor authentication will be available in a future update",
                        });
                      }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Last Login Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Last Login</h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Time
                      </span>
                      <span className="text-sm font-medium">
                        Today at 9:42 AM
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        IP Address
                      </span>
                      <span className="text-sm font-medium font-mono">
                        192.168.1.xxx
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Location
                      </span>
                      <span className="text-sm font-medium">
                        San Francisco, US
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Browser
                      </span>
                      <span className="text-sm font-medium">Chrome 122</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
