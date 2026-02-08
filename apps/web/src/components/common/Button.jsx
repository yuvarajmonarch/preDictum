// apps/web/src/components/common/Button.jsx
import React from "react";
import { motion } from "framer-motion";

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

const variants = {
  primary: "bg-indigo-500/20 border-indigo-400/20 text-indigo-100 hover:bg-indigo-500/30",
  ghost: "bg-white/5 border-white/10 text-white/80 hover:bg-white/10",
  danger: "bg-rose-500/15 border-rose-400/20 text-rose-100 hover:bg-rose-500/25"
};

const sizes = {
  sm: "px-3 py-2 text-sm rounded-xl",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-4 py-3 text-base rounded-2xl"
};

export default function Button({
  children,
  variant = "ghost",
  size = "md",
  className = "",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled,
  onClick,
  type = "button"
}) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled ? 1 : 0.985 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 border transition select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        variants[variant] || variants.ghost,
        sizes[size] || sizes.md,
        className
      )}
    >
      {LeftIcon ? <LeftIcon className="w-4 h-4" /> : null}
      <span className="font-medium">{children}</span>
      {RightIcon ? <RightIcon className="w-4 h-4" /> : null}
    </motion.button>
  );
}
