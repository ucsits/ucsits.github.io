import { Link } from "react-router-dom";
import { useBlockchain, usePageBlocks } from "../hooks/useBlockchain";
import { ChainStats } from "../components/ChainStats";
import { BlockList } from "../components/BlockList";
import styles from "./Transparency.module.scss";
import logoSrc from "./../assets/logo-text-light.png";

function Transparency() {
  const { totalPages, stats, loading, error } = useBlockchain();
  const { currentPage, goToPage, pageBlocks, isPageLoading } =
    usePageBlocks(totalPages);

  return (
    <div className={styles.page}>
      {/* Sticky header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <img
              src={logoSrc}
              alt="UKM Cyber Security ITS"
              className={styles.headerIcon}
            />
            <div>
              <h1 className={styles.title}>
                UKM Cyber Security ITS Transparency Page
              </h1>
            </div>
          </div>
          <div className={styles.headerRight}></div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className={styles.error}>
          <p className={styles.errorTitle}>Failed to fetch chain data</p>
          <p className={styles.errorDetail}>
            The API may be unavailable.{" "}
            <span className={styles.errorCode}>{error}</span>
          </p>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingDots}>
            <span>Loading chain data</span>
            <span className={styles.dots}>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Split section: ChainStats left, Activity Log right */}
          <section className={styles.splitSection}>
            <div className={styles.splitLeft}>
              <ChainStats stats={stats} />
            </div>
            <div className={styles.splitRight}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Activity Log</h2>
                <p className={styles.sectionSub}>
                  Every action recorded as an immutable block. View the full{" "}
                  <Link
                    to="https://github.com/ucs-its"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    specification
                  </Link>
                  .
                </p>
              </div>
              <BlockList
                blocks={pageBlocks}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                loading={isPageLoading}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Transparency;
