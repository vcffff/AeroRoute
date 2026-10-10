export type AppMode = "demo" | "firestore";

export function getMode(): AppMode {
  const mode = process.env.AEROROUTE_MODE;
  if (mode === "demo" || mode === "firestore") return mode;
  if (!mode && process.env.NODE_ENV !== "production") return "demo";
  throw new Error("Set AEROROUTE_MODE to demo or firestore explicitly.");
}
