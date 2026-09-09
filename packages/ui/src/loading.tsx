"use client";
import { motion, Transition } from "framer-motion";
import React from "react";

const createTransition = (
  delayMultiplier: number,
  duration = 1,
): Transition => ({
  duration,
  repeat: Infinity,
  repeatType: "loop",
  delay: delayMultiplier * 0.2,
  ease: "easeInOut",
});

export const LoaderOne = () => {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ y: 0 }}
          animate={{ y: [0, 10, 0] }}
          transition={createTransition(i)}
          className="h-4 w-4 rounded-full border border-jewel-400/30 bg-gradient-to-b from-jewel-gold/40 to-jewel-500/40"
        />
      ))}
    </div>
  );
};

export const LoaderTwo = () => {
  const transition = (x: number): Transition => ({
    duration: 2,
    repeat: Infinity,
    repeatType: "loop",
    delay: x * 0.2,
    ease: "easeInOut",
  });

  return (
    <div className="flex items-center">
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0)}
        className="h-4 w-4 rounded-full bg-jewel-gold/60 shadow-jewel"
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.4)}
        className="h-4 w-4 -translate-x-2 rounded-full bg-jewel-gold/60 shadow-jewel"
      />
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, 20, 0] }}
        transition={transition(0.8)}
        className="h-4 w-4 -translate-x-4 rounded-full bg-jewel-gold/60 shadow-jewel"
      />
    </div>
  );
};

export const LoaderThree = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-20 w-20 stroke-jewel-500"
    >
      <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <motion.path
        initial={{ pathLength: 0, fill: "transparent" }}
        animate={{ pathLength: 1, fill: "#c9a227" }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
      />
    </motion.svg>
  );
};

export const LoaderFour = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="relative font-bold text-jewel-900 [perspective:1000px]">
      <motion.span
        animate={{
          skewX: [0, -40, 0],
          scaleX: [1, 2, 1],
        }}
        transition={{
          duration: 0.05,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 2,
          ease: "linear",
          times: [0, 0.2, 0.5, 0.8, 1],
        }}
        className="relative z-20 inline-block"
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-jewel-gold/50 blur-[0.5px]"
        animate={{
          x: [-2, 4, -3, 1.5, -2],
          y: [-2, 4, -3, 1.5, -2],
          opacity: [0.3, 0.9, 0.4, 0.8, 0.3],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
          times: [0, 0.2, 0.5, 0.8, 1],
        }}
      >
        {text}
      </motion.span>
    </div>
  );
};

export const LoaderFive = ({ text }: { text: string }) => {
  return (
    <div className="font-bold text-jewel-900">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.1, 1],
            textShadow: [
              "0 0 0 rgba(201, 162, 39, 0)",
              "0 0 8px rgba(201, 162, 39, 0.5)",
              "0 0 0 rgba(201, 162, 39, 0)",
            ],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 0.05,
            ease: "easeInOut",
            repeatDelay: 2,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
};
