import { Flag, Trophy } from "lucide-react";
import { useCtftime } from "../hooks/useCtftime";
import type { LeaderboardRow } from "../types/ctftime";
import styles from "./CtftimeWidget.module.scss";

export function CtftimeWidget() {
  const {
    team,
    currentRating,
    ratingHistory,
    nationalSlice,
    internationalSlice,
    loading,
    error,
  } = useCtftime();

  if (loading) {
    return (
      <div className={styles.band}>
        <div className={styles.header}>
          <Trophy size={16} className={styles.headerIcon} />
          <span className={styles.headerTitle}>CTFtime</span>
        </div>
        <div className={styles.loading}>
          <span>Fetching CTFtime data</span>
          <span>…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.band}>
        <div className={styles.header}>
          <Trophy size={16} className={styles.headerIcon} />
          <span className={styles.headerTitle}>CTFtime</span>
        </div>
        <div className={styles.error}>
          <p className={styles.errorTitle}>CTFtime API unavailable</p>
          <p className={styles.errorDetail}>
            {error}. The API may require a CORS proxy or a User-Agent header.
          </p>
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className={styles.band}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <Trophy size={16} className={styles.headerIcon} />
        <span className={styles.headerTitle}>CTFtime · UCS Performance</span>
      </div>

      {/* ── Team card ── */}
      <div className={styles.teamCard}>
        <img
          className={styles.teamLogo}
          src={team.logo}
          alt={`${team.name} logo`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className={styles.teamInfo}>
          <span className={styles.teamName}>{team.name}</span>
          <span className={styles.teamAlias}>aka {team.primary_alias}</span>
          <span className={styles.teamUniv}>{team.university}</span>
          <div className={styles.teamBadgeRow}>
            <span className={styles.flagBadge}>
              <Flag size={10} /> {team.country}
            </span>
            {team.academic && (
              <span className={styles.flagBadge}>Academic</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Rating summary ── */}
      {currentRating && (
        <div className={styles.ratingRow}>
          <div className={styles.ratingCell}>
            <span
              className={`${styles.ratingValue} ${styles.ratingValueIntl}`}
            >
              {currentRating.rating_place != null
                ? `#${currentRating.rating_place}`
                : "—"}
            </span>
            <span className={styles.ratingLabel}>Worldwide</span>
          </div>
          <div className={styles.ratingCell}>
            <span
              className={`${styles.ratingValue} ${styles.ratingValueNat}`}
            >
              {currentRating.country_place != null
                ? `#${currentRating.country_place}`
                : "—"}
            </span>
            <span className={styles.ratingLabel}>Indonesia</span>
          </div>
          <div className={styles.ratingCell}>
            <span className={styles.ratingValue}>
              {currentRating.rating_points != null
                ? currentRating.rating_points.toFixed(1)
                : "—"}
            </span>
            <span className={styles.ratingLabel}>Points</span>
          </div>
        </div>
      )}

      {/* ── Leaderboards side by side ── */}
      <div className={styles.leaderboardPair}>
        <div className={styles.leaderboardCol}>
          <div className={styles.sectionLabel}>
            National (ID) · {currentRating?.year ?? "2026"}
          </div>
          <LeaderboardTable rows={nationalSlice} showRank />
        </div>
        <div className={styles.leaderboardDivider} />
        <div className={styles.leaderboardCol}>
          <div className={styles.sectionLabel}>
            International · {currentRating?.year ?? "2026"}
          </div>
          <LeaderboardTable rows={internationalSlice} showRank />
        </div>
      </div>

      {/* ── Rating history ── */}
      {ratingHistory.length > 0 && (
        <>
          <div className={styles.sectionLabel}>Rating History</div>
          <div className={styles.historyList}>
            {ratingHistory.map((h) => (
              <div key={h.year} className={styles.historyRow}>
                <span className={styles.historyYear}>{h.year}</span>
                <span className={styles.statBlock}>
                  <span className={styles.statLabel}>W</span>
                  <span className={styles.statVal}>
                    {h.ratingPlace != null ? `#${h.ratingPlace}` : "—"}
                  </span>
                  <PctLabel
                    value={h.pctPlace}
                    goodIs="negative"
                  />
                </span>
                <span className={styles.statBlock}>
                  <span className={styles.statLabel}>ID</span>
                  <span className={styles.statVal}>
                    {h.countryPlace != null ? `#${h.countryPlace}` : "—"}
                  </span>
                  <PctLabel
                    value={h.pctCountry}
                    goodIs="negative"
                  />
                </span>
                <span className={styles.historyPts}>
                  <span className={styles.statVal}>
                    {h.ratingPoints != null
                      ? `${h.ratingPoints.toFixed(2)}`
                      : "—"}
                  </span>
                  <span className={styles.statLabel}>pts</span>
                  <PctLabel
                    value={h.pctPoints}
                    goodIs="positive"
                  />
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Coloured percentage label ──
 *  goodIs="positive": (+) = green, (-) = red  (e.g. points)
 *  goodIs="negative": (-) = green, (+) = red  (e.g. rank)
 */

function PctLabel({
  value,
  goodIs,
}: {
  value: string;
  goodIs: "positive" | "negative";
}) {
  const isPos = value.startsWith("(+");
  const isNeg = value.startsWith("(-");

  if (!isPos && !isNeg) {
    return <span className={styles.pctChange}>{value}</span>;
  }

  const good = goodIs === "positive" ? isPos : isNeg;
  return (
    <span
      className={`${styles.pctChange} ${
        good ? styles.pctGood : styles.pctBad
      }`}
    >
      {value}
    </span>
  );
}

/* ── Inline leaderboard table ── */

function LeaderboardTable({
  rows,
  showRank,
}: {
  rows: LeaderboardRow[];
  showRank?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: "10px 14px", fontSize: "0.62rem", color: "var(--text-muted)" }}>
        No data available.
      </div>
    );
  }

  return (
    <div className={styles.leaderWrap}>
      <table className={styles.leaderTable}>
        <thead>
          <tr>
            {showRank && <th className={styles.thRank}>#</th>}
            <th className={styles.thTeam}>Team</th>
            <th className={styles.thPts}>Points</th>
          </tr>
        </thead>
      </table>
      <div className={styles.leaderScroll}>
        <table className={styles.leaderTable}>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank} className={row.isAnchor ? styles.anchor : undefined}>
                {showRank && (
                  <td className={styles.rankNum}>{row.rank}</td>
                )}
                <td
                  className={`${styles.teamCell} ${row.isAnchor ? styles.anchorName : ""}`}
                >
                  {row.kind === "unranked" ? (
                    <span className={styles.unrankedBadge}>Unranked</span>
                  ) : (
                    row.teamName
                  )}
                </td>
                <td className={styles.pointCell}>
                  {row.points != null ? row.points.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
