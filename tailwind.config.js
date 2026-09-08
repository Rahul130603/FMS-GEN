/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/original-reports/**/*.{js,jsx}"],
  important: ".original-report",
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff", 100: "#e0effe", 200: "#bae0fd", 300: "#7cc5fb",
          400: "#38a5f6", 500: "#0e87e9", 600: "#026bc7", 700: "#0355a1",
          800: "#074884", 900: "#0c3d6e", 950: "#082749"
        }
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0,0,0,.05),0 1px 2px 0 rgba(0,0,0,.03)",
        card: "0 4px 6px -1px rgba(0,0,0,.05),0 2px 4px -1px rgba(0,0,0,.03)",
        elevated: "0 10px 15px -3px rgba(0,0,0,.06),0 4px 6px -2px rgba(0,0,0,.03)"
      }
    }
  },
  plugins: []
};
