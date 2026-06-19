// Single source of truth for the product routes. Both the router and the header nav read this list.
export interface RouteDef {
  path: string;
  labelKey: string; // i18n key under nav.*
  id: string;
}

export const ROUTES: readonly RouteDef[] = [
  { id: "introduction", path: "/", labelKey: "nav.introduction" },
  { id: "experiments", path: "/experiments", labelKey: "nav.experiments" },
  { id: "theory", path: "/theory", labelKey: "nav.theory" },
  { id: "build", path: "/build", labelKey: "nav.build" },
] as const;
