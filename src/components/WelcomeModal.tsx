"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  ListTodo,
  Columns3,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const ONBOARDING_KEY = "tasksphere_onboarding_done";

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
}

const steps: Step[] = [
  {
    icon: Rocket,
    title: "Welcome to TaskSphere!",
    description:
      "Your all-in-one task management platform. Organize your work, collaborate with your team, and stay on top of everything — effortlessly.",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: ListTodo,
    title: "Manage Your Tasks",
    description:
      "Create, organize, and track your tasks with ease. Set priorities, assign team members, add due dates, and never miss a deadline again.",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Columns3,
    title: "Kanban Board",
    description:
      "Visualize your workflow with a drag-and-drop Kanban board. Move tasks between columns, see progress at a glance, and stay in control.",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Sparkles,
    title: "You're All Set!",
    description:
      "Start creating tasks, explore the dashboard, or jump into the Kanban board. Your productivity journey begins now.",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
];

export default function WelcomeModal() {
  // Since this component is inside AppLayout's mounted+auth guard,
  // it only renders on the client, so localStorage is safe to access.
  // Using a lazy initializer avoids the lint error from setState-in-effect.
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(ONBOARDING_KEY);
    } catch {
      return false;
    }
  });
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleClose = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleGoToDashboard = () => {
    handleClose();
    router.push("/dashboard");
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      }
    }}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md md:max-w-lg overflow-hidden p-0 gap-0 border-0"
      >
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-violet-500 to-emerald-500" />

        <div className="p-6 sm:p-8">
          {/* Step content with animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon in colored circle */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.35, ease: "backOut" }}
                className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${step.iconBg}`}
              >
                <Icon className={`h-10 w-10 ${step.iconColor}`} />
              </motion.div>

              <DialogHeader className="items-center gap-3 mb-2">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {step.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </DialogDescription>
              </DialogHeader>
            </motion.div>
          </AnimatePresence>

          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-2 mt-8 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                aria-label={`Go to step ${index + 1}`}
              >
                <motion.div
                  animate={{
                    width: index === currentStep ? 24 : 8,
                    backgroundColor:
                      index === currentStep
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground) / 0.3)",
                  }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="h-2 rounded-full"
                />
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Skip link */}
            {!isLastStep ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip
              </Button>
            ) : (
              <div />
            )}

            {/* Next / Get Started button */}
            {isLastStep ? (
              <Button onClick={handleGoToDashboard} size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={handleNext} size="sm" className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
