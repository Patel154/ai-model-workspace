import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0A0B0D",
          surface: "#111318",
          elevated: "#191B22",
          hover: "#20232B",
          border: "#262933",
          borderStrong: "#34384433"
        },
        ink: {
          DEFAULT: "#EDEDEF",
          dim: "#9A9CA8",
          faint: "#5D606D"
        },
        accent: {
          DEFAULT: "#7C6CF6",
          soft: "#7C6CF61F",
          bright: "#9B8DFF"
        },
        signal: {
          good: "#3ED598",
          warn: "#FFB454",
          bad: "#FF6B6B"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(124,108,246,0.35), 0 0 24px -4px rgba(124,108,246,0.45)"
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
        rise: "rise 0.22s ease-out",
        shimmer: "shimmer 2.2s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
