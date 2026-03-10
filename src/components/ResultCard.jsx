import { formatDuration } from "../services/download";

const styles = {
  card: {
    display: "flex",
    gap: 12,
    padding: "12px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--bg-2)",
    cursor: "pointer",
    transition: "border-color var(--transition), background var(--transition)",
    animation: "fadeIn 0.2s ease forwards",
  },
  thumb: {
    width: 80,
    height: 52,
    borderRadius: 4,
    objectFit: "cover",
    background: "var(--bg-3)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-3)",
    fontSize: 20,
    overflow: "hidden",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: 600,
    fontSize: 13,
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: 3,
  },
  meta: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  channel: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-2)",
  },
  dur: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
    background: "var(--bg-3)",
    padding: "1px 6px",
    borderRadius: 3,
  },
  views: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
  },
  selectedBadge: {
    marginLeft: "auto",
    padding: "3px 8px",
    background: "var(--accent-glow)",
    border: "1px solid var(--accent)",
    borderRadius: 4,
    fontSize: 10,
    color: "var(--accent)",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  },
};

function formatViews(n) {
  if (!n) return "";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B views`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M views`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K views`;
  return `${n} views`;
}

export default function ResultCard({ result, selected, onSelect }) {
  const isSelected = selected?.id === result.id;

  return (
    <div
      style={{
        ...styles.card,
        borderColor: isSelected ? "var(--accent)" : "var(--border)",
        background: isSelected ? "rgba(0,229,160,0.04)" : "var(--bg-2)",
      }}
      onClick={() => onSelect(result)}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "var(--border-bright)";
          e.currentTarget.style.background = "var(--bg-3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--bg-2)";
        }
      }}
    >
      <div style={styles.thumb}>
        {result.thumbnail ? (
          <img
            src={result.thumbnail}
            alt={result.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = "🎵";
            }}
          />
        ) : (
          "🎵"
        )}
      </div>
      <div style={styles.info}>
        <div style={styles.title}>{result.title}</div>
        <div style={styles.meta}>
          <span style={styles.channel}>{result.channel || result.uploader}</span>
          {result.duration && (
            <span style={styles.dur}>{formatDuration(result.duration)}</span>
          )}
          {result.view_count && (
            <span style={styles.views}>{formatViews(result.view_count)}</span>
          )}
          {isSelected && <span style={styles.selectedBadge}>SELECTED</span>}
        </div>
      </div>
    </div>
  );
}
