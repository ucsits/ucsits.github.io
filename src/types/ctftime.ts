/* ── CTFtime API response shapes ── */

export interface CtftimeYearRating {
  rating_place?: number;
  organizer_points?: number;
  rating_points?: number;
  country_place?: number;
}

export interface CtftimeTeamDetail {
  academic: boolean;
  primary_alias: string;
  university_website: string;
  name: string;
  rating: Record<string, CtftimeYearRating>;
  logo: string;
  country: string;
  university: string;
  id: number;
  aliases: string[];
}

export interface CtftimeTopEntry {
  team_name: string;
  points: number;
  team_id: number;
}

export interface CtftimeCountryEntry {
  country_place: number;
  team_id: number;
  points: number;
  team_country: string;
  place: number;
  team_name: string;
  events: number;
}

/** Shape returned by /api/v1/top/{year}/ */
export type CtftimeTopResponse = Record<string, CtftimeTopEntry[]>;

/** Shape returned by /api/v1/top-by-country/{code}/ */
export type CtftimeCountryResponse = CtftimeCountryEntry[];

/** Enriched entry for leaderboard display */
export interface LeaderboardRow {
  rank: number; // 1-based rank on the relevant board
  teamId: number;
  teamName: string;
  points: number | null; // null if unranked / not found
  isAnchor: boolean; // true for team 390903
  kind: "found" | "unranked";
}
