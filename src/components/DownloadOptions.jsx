import { useState } from "react";

const VIDEO_QUALITIES = ["1080p", "720p", "480p", "360p"];
const AUDIO_FORMATS = ["mp3", "flac", "wav", "m4a", "opus"];
const BITRATES = ["128", "192", "256", "320"];

const styles = {
  wrap: {
    padding: "14px 16px",
    background: "var(--bg-1)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
  },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 14,
    background: "var(--bg-2)",
    padding: 3,
    borderRadius: 6,
  },
  tab: {
    flex: 1,
    padding: "7px 0",
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
    transition: "background var(--transition), color var(--transition)",
    textAlign: "center",
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
    letterSpacing: "0.08em",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  chips: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    padding: "5px 12px",
    borderRadius: 4,
    border: "1px solid var(--border)",
    background: "var(--bg-2)",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--text-2)",
    cursor: "pointer",
    transition: "all var(--transition)",
  },
  chipActive: {
    borderColor: "var(--accent)",
    background: "var(--accent-glow)",
    color: "var(--accent)",
  },
  downloadBtn: {
    width: "100%",
    padding: "11px",
    background: "var(--accent)",
    color: "#000",
    borderRadius: "var(--radius)",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: "0.06em",
    transition: "all var(--transition)",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};

export default function DownloadOptions({ selected, onDownload, downloading }) {
  const [mode, setMode] = useState("audio");
  const [quality, setQuality] = useState("1080p");
  const [audioFmt, setAudioFmt] = useState("mp3");
  const [bitrate, setBitrate] = useState("320");

  if (!selected) return null;

  function handleDownload() {
    if (!downloading) {
      onDownload({
        url: selected.url || selected.webpage_url,
        mode,
        quality,
        audioFmt,
        bitrate,
        title: selected.title,
        thumbnail: selected.thumbnail,
        duration: selected.duration,
      });
    }
  }

  return (
    <div style={styles.wrap}>
      {/* Mode tabs */}
      <div style={styles.tabs}>
        {["audio", "video"].map((m) => (
          <button
            key={m}
            style={{
              ...styles.tab,
              background: mode === m ? "var(--bg-3)" : "transparent",
              color: mode === m ? "var(--accent)" : "var(--text-3)",
            }}
            onClick={() => setMode(m)}
          >
            {m === "audio" ? "🎵 AUDIO" : "🎬 VIDEO"}
          </button>
        ))}
      </div>

      {mode === "video" ? (
        <div style={styles.section}>
          <div style={styles.label}>Quality</div>
          <div style={styles.chips}>
            {VIDEO_QUALITIES.map((q) => (
              <button
                key={q}
                style={{
                  ...styles.chip,
                  ...(quality === q ? styles.chipActive : {}),
                }}
                onClick={() => setQuality(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={styles.section}>
            <div style={styles.label}>Format</div>
            <div style={styles.chips}>
              {AUDIO_FORMATS.map((f) => (
                <button
                  key={f}
                  style={{
                    ...styles.chip,
                    ...(audioFmt === f ? styles.chipActive : {}),
                  }}
                  onClick={() => setAudioFmt(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.section}>
            <div style={styles.label}>Bitrate</div>
            <div style={styles.chips}>
              {BITRATES.map((b) => (
                <button
                  key={b}
                  style={{
                    ...styles.chip,
                    ...(bitrate === b ? styles.chipActive : {}),
                  }}
                  onClick={() => setBitrate(b)}
                >
                  {b}k
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        style={{
          ...styles.downloadBtn,
          opacity: downloading ? 0.5 : 1,
          cursor: downloading ? "not-allowed" : "pointer",
        }}
        onClick={handleDownload}
        disabled={downloading}
        onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.background = "var(--accent-dim)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
      >
        <span>↓</span>
        <span>
          {downloading
            ? "DOWNLOADING..."
            : `DOWNLOAD ${mode === "audio" ? `${audioFmt.toUpperCase()} ${bitrate}k` : quality}`}
        </span>
      </button>
    </div>
  );
}
