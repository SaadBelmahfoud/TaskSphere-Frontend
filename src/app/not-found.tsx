"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SearchX, Home, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { auth } = useAuth();
  const router = useRouter();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
      {/* CSS Keyframes & custom styles */}
      <style jsx>{`
        @keyframes gradientShift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animated-gradient {
          background: linear-gradient(
            -45deg,
            #f5f3ff,
            #ecfdf5,
            #fef9c3,
            #fce7f3,
            #e0e7ff,
            #f5f3ff
          );
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        @keyframes float1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -20px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 15px) scale(0.95);
          }
        }
        @keyframes float2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-25px, 20px) scale(1.08);
          }
          66% {
            transform: translate(15px, -25px) scale(0.92);
          }
        }
        @keyframes float3 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, 25px) scale(1.1);
          }
        }
        .blob-1 {
          animation: float1 8s ease-in-out infinite;
        }
        .blob-2 {
          animation: float2 10s ease-in-out infinite;
        }
        .blob-3 {
          animation: float3 12s ease-in-out infinite;
        }

        /* Gentle floating animation for 404 number */
        @keyframes gentleFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .float-number {
          animation: gentleFloat 3s ease-in-out infinite;
        }

        /* Gentle pulse for illustration icon */
        @keyframes gentlePulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.06);
            opacity: 0.85;
          }
        }
        .pulse-icon {
          animation: gentlePulse 2.5s ease-in-out infinite;
        }

        /* Dot pattern overlay */
        .dot-pattern {
          background-image: radial-gradient(
            circle,
            rgba(120, 100, 180, 0.08) 1px,
            transparent 1px
          );
          background-size: 24px 24px;
        }

        /* 404 glow effect */
        .text-glow {
          text-shadow:
            0 0 40px rgba(99, 102, 241, 0.3),
            0 0 80px rgba(16, 185, 129, 0.15);
          filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.2));
        }

        /* Button hover glow */
        .btn-glow-primary:hover {
          box-shadow:
            0 0 20px rgba(99, 102, 241, 0.3),
            0 4px 14px rgba(99, 102, 241, 0.2);
        }
        .btn-glow-outline:hover {
          box-shadow:
            0 0 16px rgba(99, 102, 241, 0.15),
            0 4px 14px rgba(0, 0, 0, 0.08);
        }
        .btn-glow-ghost:hover {
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.1);
        }
      `}</style>

      {/* Gradient background layer */}
      <div className="animated-gradient absolute inset-0 -z-20" />

      {/* Dot pattern overlay */}
      <div className="dot-pattern absolute inset-0 -z-15" aria-hidden="true" />

      {/* Floating decorative blobs */}
      <div
        className="blob-1 absolute -top-20 -left-20 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="blob-2 absolute top-1/4 -right-16 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="blob-3 absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="blob-1 absolute top-2/3 right-1/3 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="blob-2 absolute bottom-1/4 -left-10 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl -z-10"
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Illustration - magnifying glass with X */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8 pulse-icon"
        >
          <div className="relative w-32 h-32 mx-auto">
            {/* Outer circle (magnifying glass lens) - brighter */}
            <div className="absolute inset-0 rounded-full border-[3px] border-primary/60 dark:border-primary/50 bg-primary/10 dark:bg-primary/15 flex items-center justify-center shadow-lg shadow-primary/10">
              <SearchX className="h-14 w-14 text-primary dark:text-primary/90" strokeWidth={2.5} />
            </div>
            {/* Handle - brighter */}
            <div className="absolute -bottom-5 -right-5 w-6 h-16 bg-primary/60 dark:bg-primary/50 rounded-full origin-top-left rotate-45 shadow-md shadow-primary/10" />
          </div>
        </motion.div>

        {/* 404 text - more visually striking */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="float-number text-glow text-8xl sm:text-9xl font-extrabold tracking-tighter bg-gradient-to-r from-primary via-violet-500 to-emerald-500 bg-clip-text text-transparent leading-none select-none"
        >
          404
        </motion.h1>

        {/* Subtitle - clear second in hierarchy */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          className="mt-4 text-2xl sm:text-3xl font-bold text-foreground/90 tracking-tight"
        >
          Page Not Found
        </motion.h2>

        {/* Description - softer, clearly third in hierarchy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          className="mt-3 text-muted-foreground/80 text-base sm:text-lg max-w-md leading-relaxed"
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </motion.p>

        {/* Action buttons - centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
          className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3 w-full"
        >
          <Button
            asChild
            size="lg"
            className="btn-glow-primary w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97]"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-1.5" />
              Go Home
            </Link>
          </Button>

          {isAuthenticated && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="btn-glow-outline w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-primary/50 active:scale-[0.97]"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Go to Dashboard
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.back()}
            className="btn-glow-ghost w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:bg-primary/10 hover:text-primary active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Go Back
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
