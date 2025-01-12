/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "f1-red": "#E10600",
        "f1-black": "#15151E",
        "f1-gray": "#38383f",
        "f1-silver": "#F0F0F0",
        "f1-neon": "#00FF00",
      },
      backgroundImage: {
        "carbon-fiber":
          "url('data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23242424' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E')",
        "gradient-racing": "linear-gradient(180deg, #15151E 0%, #38383f 100%)",
      },
      fontFamily: {
        f1: ["Titillium Web", "sans-serif"],
        "f1-display": ["Oswald", "sans-serif"],
      },
      animation: {
        glow: "glow 1.5s ease-in-out infinite alternate",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(225, 6, 0, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(225, 6, 0, 0.8)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
