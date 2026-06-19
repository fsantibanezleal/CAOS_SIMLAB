// Single source of truth for the product routes. Both the router and the header nav read this list.
// Order matters: the SIMULATOR is the landing ("/") — you enter and go straight to it. The supporting
// pages (introduction, theory, how-to-build) sit alongside it.
export interface RouteDef {
  path: string;
  labelKey: string; // i18n key under nav.*
  id: string;
}

export const ROUTES: readonly RouteDef[] = [
  { id: "experiments", path: "/", labelKey: "nav.experiments" },
  { id: "introduction", path: "/introduction", labelKey: "nav.introduction" },
  { id: "theory", path: "/theory", labelKey: "nav.theory" },
  { id: "build", path: "/build", labelKey: "nav.build" },
] as const;
