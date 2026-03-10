import { useState, useRef } from "react";
import { isYouTubeUrl, isSpotifyUrl } from "../services/youtube";

const styles = {
  wrapper: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-1)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  brandLogo: {
    width: 32,
    height: 32,
    background: "var(--accent)",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },
  brandName: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.5px",
    color: "var(--text)",
  },
  brandSub: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
    letterSpacing: "0.05em",
    marginLeft: 2,
  },
  inputRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  inputWrap: {
    flex: 1,
    position: "relative",
  },
  input: {
    width: "100%",
    padding: "10px 14px 10px 40px",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    transition: "border-color var(--transition), box-shadow var(--transition)",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-3)",
    fontSize: 14,
    pointerEvents: "none",
  },
  badge: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    padding: "2px 7px",
    borderRadius: 4,
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    fontWeight: 500,
    letterSpacing: "0.05em",
  },
  btn: {
    padding: "10px 20px",
    background: "var(--accent)",
    color: "#000",
    borderRadius: "var(--radius)",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "var(--font-display)",
    letterSpacing: "0.02em",
    transition: "background var(--transition), transform var(--transition)",
    whiteSpace: "nowrap",
  },
};

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const type = isYouTubeUrl(query) ? "youtube" : isSpotifyUrl(query) ? "spotify" : "search";

  const badgeStyle = {
    ...styles.badge,
    background: type === "youtube" ? "rgba(255,69,57,0.15)" : type === "spotify" ? "rgba(30,215,96,0.15)" : "rgba(0,229,160,0.1)",
    color: type === "youtube" ? "var(--red)" : type === "spotify" ? "#1ed760" : "var(--accent)",
  };

  function handleSubmit(e) {
    e?.preventDefault();
    if (query.trim() && !loading) onSearch(query.trim());
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.brand}>
        <div style={styles.brandLogo}>
          <span style={{ color: "#000", fontWeight: 800 }}>W</span>
        </div>
        <div>
          <div style={styles.brandName}>WAVEGET</div>
          <div style={styles.brandSub}>MUSIC &amp; VIDEO DOWNLOADER</div>
        </div>
      </div>

      <div style={styles.inputRow}>
        <div style={styles.inputWrap}>
          <span style={styles.inputIcon}>
            {type === "youtube" ? "▶" : type === "spotify" ? "♫" : "⌕"}
          </span>
          <input
            ref={inputRef}
            style={{
              ...styles.input,
              ...(query ? { borderColor: "var(--border-bright)" } : {}),
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search song, paste YouTube or Spotify URL..."
            disabled={loading}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--accent)";
              e.target.style.boxShadow = "0 0 0 3px var(--accent-glow)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = query ? "var(--border-bright)" : "var(--border)";
              e.target.style.boxShadow = "none";
            }}
          />
          {query && (
            <span style={badgeStyle}>
              {type.toUpperCase()}
            </span>
          )}
        </div>
        <button
          style={{
            ...styles.btn,
            opacity: loading ? 0.5 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={(e) => { if (!loading) e.target.style.background = "var(--accent-dim)"; }}
          onMouseLeave={(e) => { e.target.style.background = "var(--accent)"; }}
        >
          {loading ? "..." : "SEARCH"}
        </button>
      </div>
    </div>
  );
}
