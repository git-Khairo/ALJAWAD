import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

/**
 * AlJawad.
 *
 * Palette and typeface are the brand's own and unchanged: the teal/navy HSL
 * scale in resources/css/app.css, set in Cairo. Tokens are consumed as
 * `hsl(var(--token) / <alpha-value>)` so every opacity modifier
 * (`bg-primary/10`) keeps working.
 */

/** @param {string} token */
const c = (token) => `hsl(var(${token}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
    "./storage/framework/views/*.php",
    "./resources/**/*.blade.php",
    "./resources/**/*.{js,jsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "2rem", lg: "3rem" },
      screens: { "2xl": "1360px" },
    },
    extend: {
      fontFamily: {
        sans: ["Cairo", "sans-serif"],
        /* Headline face is the same Cairo, separated only so display
           hierarchy can be tuned in one place. */
        display: ["Cairo", "sans-serif"],
      },

      fontSize: {
        /* Standard steps: tuned leading, same sizes. */
        xs:    ["0.75rem",   { lineHeight: "1.5" }],
        sm:    ["0.875rem",  { lineHeight: "1.6" }],
        base:  ["1rem",      { lineHeight: "1.7" }],
        lg:    ["1.125rem",  { lineHeight: "1.65" }],
        xl:    ["1.25rem",   { lineHeight: "1.5" }],
        "2xl": ["1.5rem",    { lineHeight: "1.4" }],
        "3xl": ["1.875rem",  { lineHeight: "1.3" }],

        /* Display steps, kept separate so headline sizing never leaks into
           dashboard chrome. Each is at least 1.25x the step below it. */
        "display-xs": ["1.75rem", { lineHeight: "var(--leading-display-sm)" }],
        "display-sm": ["2.25rem", { lineHeight: "var(--leading-display-sm)" }],
        "display-md": ["3rem",    { lineHeight: "var(--leading-display)" }],
        "display-lg": ["4rem",    { lineHeight: "var(--leading-display)" }],
        "display-xl": ["5rem",    { lineHeight: "var(--leading-display)" }],
      },

      colors: {
        border:     c("--border"),
        input:      c("--input"),
        ring:       c("--ring"),
        background: c("--background"),
        foreground: c("--foreground"),

        primary:     { DEFAULT: c("--primary"),     foreground: c("--primary-foreground") },
        secondary:   { DEFAULT: c("--secondary"),   foreground: c("--secondary-foreground") },
        destructive: { DEFAULT: c("--destructive"), foreground: c("--destructive-foreground") },
        muted:       { DEFAULT: c("--muted"),       foreground: c("--muted-foreground") },
        accent:      { DEFAULT: c("--accent"),      foreground: c("--accent-foreground") },
        popover:     { DEFAULT: c("--popover"),     foreground: c("--popover-foreground") },
        card:        { DEFAULT: c("--card"),        foreground: c("--card-foreground") },

        /* Structural aliases. Same palette, named for the role the layout
           needs rather than the shadcn slot it happens to occupy. */
        surface: {
          DEFAULT: c("--surface"),
          raised:  c("--surface-raised"),
          sunken:  c("--surface-sunken"),
        },
        fg: {
          DEFAULT: c("--fg"),
          muted:   c("--fg-muted"),
          faint:   c("--fg-faint"),
        },
        rule: {
          DEFAULT: c("--rule"),
          strong:  c("--rule-strong"),
        },
        brand: {
          DEFAULT: c("--brand"),
          hover:   c("--brand-hover"),
          wash:    c("--brand-wash"),
        },

        /* Market direction and state. Functional only, never branding. */
        "chart-up":   c("--chart-up"),
        "chart-down": c("--chart-down"),
        warn:         c("--warn"),

        /* Categorical chart series. See lib/chartColors.js. */
        "chart-1": c("--chart-1"), "chart-2": c("--chart-2"),
        "chart-3": c("--chart-3"), "chart-4": c("--chart-4"),
        "chart-5": c("--chart-5"), "chart-6": c("--chart-6"),
        "chart-7": c("--chart-7"), "chart-8": c("--chart-8"),

        sidebar: {
          DEFAULT: c("--sidebar-background"),
          foreground: c("--sidebar-foreground"),
          primary: c("--sidebar-primary"),
          "primary-foreground": c("--sidebar-primary-foreground"),
          accent: c("--sidebar-accent"),
          "accent-foreground": c("--sidebar-accent-foreground"),
          border: c("--sidebar-border"),
          ring: c("--sidebar-ring"),
        },
      },

      borderRadius: {
        none: "0",
        sm:   "calc(var(--radius) - 4px)",
        DEFAULT: "calc(var(--radius) - 2px)",
        md:   "calc(var(--radius) - 2px)",
        lg:   "var(--radius)",
        xl:   "calc(var(--radius) + 4px)",
        "2xl":"calc(var(--radius) + 8px)",
        "3xl":"calc(var(--radius) + 16px)",
        full: "9999px",
      },

      /* Tinted to the navy ground, tight, and never coloured. Most surfaces
         should separate with a rule and a value step instead. */
      boxShadow: {
        xs:   "0 1px 1px hsl(var(--shadow-color) / 0.20)",
        sm:   "0 1px 2px hsl(var(--shadow-color) / 0.26)",
        DEFAULT: "0 1px 3px hsl(var(--shadow-color) / 0.30), 0 1px 2px -1px hsl(var(--shadow-color) / 0.24)",
        md:   "0 3px 8px -2px hsl(var(--shadow-color) / 0.36)",
        lg:   "0 10px 24px -8px hsl(var(--shadow-color) / 0.45)",
        xl:   "0 20px 44px -16px hsl(var(--shadow-color) / 0.55)",
        none: "none",
      },

      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "out-expo":  "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: { 120: "120ms", 320: "320ms", 480: "480ms" },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.24s cubic-bezier(0.25, 1, 0.5, 1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
      },

      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground) / 0.85)",
            "--tw-prose-headings": "hsl(var(--foreground))",
            "--tw-prose-links": "hsl(var(--primary))",
            "--tw-prose-bold": "hsl(var(--foreground))",
            "--tw-prose-quotes": "hsl(var(--muted-foreground))",
            "--tw-prose-quote-borders": "hsl(var(--primary))",
            "--tw-prose-hr": "hsl(var(--border))",
            "--tw-prose-captions": "hsl(var(--fg-faint))",
            "--tw-prose-code": "hsl(var(--foreground))",
            maxWidth: "var(--measure)",
            lineHeight: "1.75",
            a: { textUnderlineOffset: "3px", textDecorationThickness: "1px" },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
          },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
};
