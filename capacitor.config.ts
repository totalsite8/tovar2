import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native-wrapping readiness.
 * After `npm i -D @capacitor/cli @capacitor/core`, run:
 *   npx cap add ios && npx cap add android && npx cap sync
 */
const config: CapacitorConfig = {
  appId: "ai.aura.orchestrator",
  appName: "Aura",
  webDir: "dist",
  backgroundColor: "#06070a",
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "always", // honor safe areas on notched devices
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#06070a",
    },
  },
};

export default config;
