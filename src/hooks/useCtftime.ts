import { useState, useEffect, useMemo } from "react";
import type {
  CtftimeTeamDetail,
  CtftimeTopEntry,
  CtftimeCountryEntry,
  LeaderboardRow,
} from "../types/ctftime";

const TEAM_ID = 390903;

/*
 * Data is fetched at build time by scripts/fetch-ctftime-data.sh
 * and saved as static JSON under public/data/ctftime/.
 * At runtime the widget reads these local files (no CORS issues on
 * GitHub Pages).
 */
const DATA_BASE = "/data/ctftime";

/* ── Fetch helpers ── */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/* ── Hook ── */

export function useCtftime() {
  const [team, setTeam] = useState<CtftimeTeamDetail | null>(null);
  const [countryRows, setCountryRows] = useState<CtftimeCountryEntry[]>([]);
  const [intlTop, setIntlTop] = useState<CtftimeTopEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [teamData, intlData, countryData] = await Promise.all([
          fetchJson<CtftimeTeamDetail>(`${DATA_BASE}/team-390903.json`),
          fetchJson<Record<string, CtftimeTopEntry[]>>(
            `${DATA_BASE}/top-2026.json`
          ),
          fetchJson<CtftimeCountryEntry[]>(`${DATA_BASE}/country-id.json`),
        ]);

        if (cancelled) return;

        setTeam(teamData);

        // Extract current year array from top response (keys like "2026")
        const currentYear = new Date().getFullYear().toString();
        const topArr = intlData[currentYear] ?? [];
        setIntlTop(topArr);

        setCountryRows(countryData);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch CTFtime data"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Derived data ── */

  // Current year's rating from team detail (only if it has rating_points)
  const currentRating = useMemo(() => {
    if (!team) return null;
    const year2026 = team.rating?.["2026"];
    const year2025 = team.rating?.["2025"];
    // Prefer 2026, then 2025
    if (year2026 && "rating_points" in year2026) return { year: "2026", ...year2026 };
    if (year2025 && "rating_points" in year2025) return { year: "2025", ...year2025 };
    return null;
  }, [team]);

  // Team's current international place from detail endpoint
  const teamIntlPlace = currentRating?.rating_place ?? null;

  // History — only years with rating_points, sorted newest first
  const ratingHistory = useMemo(() => {
    if (!team) return [];
    const rows = Object.entries(team.rating)
      .filter(([, v]) => v && typeof v.rating_points === "number")
      .map(([year, v]) => ({
        year,
        ratingPlace: v.rating_place ?? null,
        countryPlace: v.country_place ?? null,
        ratingPoints: v.rating_points ?? null,
      }))
      .sort((a, b) => b.year.localeCompare(a.year));

    // Compute year-over-year % change (compare each entry to the one
    // immediately before it in the original chronological order, i.e.
    // the previous year).  The last (oldest) entry gets (0.00%) as baseline.
    const chrono = [...rows].reverse();

    return rows.map((row) => {
      const prevYear = String(Number(row.year) - 1);
      const prev = chrono.find((c) => c.year === prevYear) ?? null;

      const pct = (
        cur: number | null,
        prevVal: number | null
      ): string => {
        if (cur == null || prevVal == null || prevVal === 0) return "(0.00%)";
        const diff = ((cur - prevVal) / prevVal) * 100;
        const sign = diff >= 0 ? "+" : "";
        return `(${sign}${diff.toFixed(2)}%)`;
      };

      return {
        ...row,
        pctPlace: pct(row.ratingPlace, prev?.ratingPlace ?? null),
        pctCountry: pct(row.countryPlace, prev?.countryPlace ?? null),
        pctPoints: pct(row.ratingPoints, prev?.ratingPoints ?? null),
      };
    });
  }, [team]);

  // ── National leaderboard slice [-3, +3] ──

  const nationalSlice = useMemo((): LeaderboardRow[] => {
    const anchorIdx = countryRows.findIndex(
      (r) => r.team_id === TEAM_ID
    );
    if (anchorIdx === -1) return [];

    const start = Math.max(0, anchorIdx - 3);
    const end = Math.min(countryRows.length - 1, anchorIdx + 3);

    return countryRows.slice(start, end + 1).map((r) => ({
      rank: r.country_place,
      teamId: r.team_id,
      teamName: r.team_name,
      points: r.points,
      isAnchor: r.team_id === TEAM_ID,
      kind: "found" as const,
    }));
  }, [countryRows]);

  // ── International leaderboard slice [-3, +3] ──
  // The global top endpoint only returns ~100 entries (cutoff at ~334 pts).
  // UCS ranks #721 (69 pts), so none of its international neighbours appear
  // in the top-100 list. Any neighbour we can't find is labelled "unranked".

  const internationalSlice = useMemo((): LeaderboardRow[] => {
    if (teamIntlPlace === null) return [];

    const anchor = teamIntlPlace; // 721
    const slots: LeaderboardRow[] = [];

    // Build a map of place → entry from the top API results
    const topByPlace = new Map<number, CtftimeTopEntry>();
    intlTop.forEach((entry, idx) => {
      topByPlace.set(idx + 1, entry); // index 0 → place 1
    });

    // Also add entries from country data (which has intl `place`)
    countryRows.forEach((entry) => {
      if (!topByPlace.has(entry.place)) {
        topByPlace.set(entry.place, {
          team_name: entry.team_name,
          points: entry.points,
          team_id: entry.team_id,
        });
      }
    });

    for (let place = anchor - 3; place <= anchor + 3; place++) {
      if (place < 1) continue;

      const found = topByPlace.get(place);

      if (found && place === anchor) {
        // Anchor team — use detail endpoint data for accuracy
        slots.push({
          rank: place,
          teamId: TEAM_ID,
          teamName: team?.primary_alias ?? found.team_name,
          points: currentRating?.rating_points ?? found.points,
          isAnchor: true,
          kind: "found",
        });
      } else if (found) {
        slots.push({
          rank: place,
          teamId: found.team_id,
          teamName: found.team_name,
          points: found.points,
          isAnchor: false,
          kind: "found",
        });
      } else {
        // Not found in any dataset → unranked
        slots.push({
          rank: place,
          teamId: 0,
          teamName: "—",
          points: null,
          isAnchor: place === anchor,
          kind: "unranked",
        });
      }
    }

    return slots;
  }, [teamIntlPlace, intlTop, countryRows, team, currentRating]);

  return {
    team,
    currentRating,
    teamIntlPlace,
    ratingHistory,
    nationalSlice,
    internationalSlice,
    loading,
    error,
  } as const;
}
