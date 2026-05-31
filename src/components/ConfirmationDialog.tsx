"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Trash2, LucideIcon } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: LucideIcon;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  confirmLabel = "Remove Source",
  cancelLabel = "Keep Context",
  icon: Icon = AlertTriangle,
  variant = "danger",
}: ConfirmationDialogProps) {
  // Choose button color based on variant
  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-[#d03238] hover:bg-[#b02227] text-white shadow-xs shadow-red-500/10";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white shadow-xs shadow-amber-500/10";
      case "info":
      default:
        return "bg-[#9fe870] hover:bg-[#8fd360] text-[#0e0f0c] shadow-xs shadow-green-500/10";
    }
  };

  const getIconContainerClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-100 dark:bg-red-950/40 text-[#d03238] dark:text-[#f87171]";
      case "warning":
        return "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400";
      case "info":
      default:
        return "bg-[#e2f6d5] dark:bg-green-950/45 text-[#054d28] dark:text-[#a0e871]";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="confirmation-dialog-root"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Dark blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-md bg-white dark:bg-[#131412] rounded-[28px] p-6 shadow-2xl border border-[#0e0f0c]/10 dark:border-white/10 z-10 flex flex-col space-y-4 text-left overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Alert Icon & Header */}
            <div className="flex items-start space-x-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getIconContainerClasses()}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-lg font-black font-sans text-[#0e0f0c] dark:text-[#f0f3ee] leading-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-[#868685] font-semibold uppercase tracking-wider">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Description Content */}
            <div className="text-xs text-[#454745] dark:text-[#bfc4be] leading-relaxed font-medium bg-[#e8ebe6]/30 dark:bg-white/5 p-4 rounded-2xl border border-[#0e0f0c]/5 dark:border-white/5">
              {description}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-bold text-[#868685] hover:text-[#0e0f0c] dark:hover:text-[#f0f3ee] bg-[#e8ebe6] dark:bg-[#1d201e] rounded-full transition-colors cursor-pointer text-center outline-none select-none border border-transparent hover:border-[#cbd0c9]/50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-grow-[2] py-3 text-xs font-bold rounded-full transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 outline-none select-none ${getConfirmButtonClasses()}`}
              >
                {variant === "danger" && (
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
