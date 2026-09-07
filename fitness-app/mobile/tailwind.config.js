/** @type {import('tailwindcss').Config} */

// Direction artistique : éditorial / brutaliste sportif.
// Fond charbon, accent lime, display Archivo Black en capitales.
// Référence : docs/ui-prototype.html
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        panel: "#13131c",
        surface: "#1c1c28",
        line: "#2a2a3a",
        ink: "#f4f4f5",
        muted: "#8b8b9a",
        accent: "#e3ff5c",
        danger: "#ff4d3d",
        // Palette persona retravaillée pour le fond sombre : les couleurs
        // stockées en base (#E91E8C, #1565C0…) sont trop sourdes sur #0a0a0f.
        persona: {
          smb: "#ff5fa8",
          bf: "#ff3d3d",
          aw: "#2a8fff",
          cr: "#4ade80",
          sav: "#a855f7",
        },
      },
      fontFamily: {
        // React Native ne synthétise pas les graisses : une famille par poids.
        display: ["Archivo_900Black"],
        body: ["Inter_400Regular"],
        "body-md": ["Inter_500Medium"],
        "body-sb": ["Inter_600SemiBold"],
        "body-b": ["Inter_700Bold"],
        mono: ["JetBrainsMono_400Regular"],
        "mono-md": ["JetBrainsMono_500Medium"],
      },
      letterSpacing: {
        display: "-0.01em",
        "display-lg": "-0.02em",
        label: "0.15em",
        "label-lg": "0.2em",
      },
      borderRadius: {
        card: "18px",
        panel: "20px",
        hero: "24px",
      },
    },
  },
  plugins: [],
};
