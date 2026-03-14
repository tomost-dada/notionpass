"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  isVisible: boolean;
  onClose: () => void;
};

export function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--charcoal)",
        color: "var(--yellow)",
        padding: "14px 28px",
        border: "2px solid #000",
        boxShadow: "var(--shadow-sm)",
        fontSize: 15,
        fontWeight: 700,
        zIndex: 300,
        whiteSpace: "nowrap",
        fontFamily: "inherit",
      }}
    >
      {message}
    </div>
  );
}
