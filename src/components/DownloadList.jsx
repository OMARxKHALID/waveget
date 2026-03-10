import { formatBytes } from "../services/download";

const styles = {
  wrap: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "10px 16px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid var(--border)",
  },
  headerTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "var(--text-3)",
    textTransform: "uppercase",
  },
  count: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
    background: "var(--bg-3)",
    padding: "2px 7px",
    borderRadius: 10,
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    color: "var(--text-3)",
    gap: 6,
    padding: "40px 0",
  },
  emptyIcon: { fontSize: 28, opacity: 0.3 },
  emptyText: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.05em",
  },
  item: {
    padding: "10px 12px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    background: "var(--bg-2)",
    animation: "fadeIn 0.2s ease forwards",
  },
  itemTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 4,
    background: "var(--bg-3)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    overflow: "hidden",
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: 2,
  },
  itemMeta: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  statusBadge: {
    padding: "1px 6px",
    borderRadius: 3,
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    fontWeight: 500,
    letterSpacing: "0.05em",
  },
  actions: {
    display: "flex",
    gap: 5,
    flexShrink: 0,
  },
  actionBtn: {
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
    color: "var(--text-2)",
    cursor: "pointer",
    transition: "all var(--transition)",
    fontFamily: "var(--font-mono)",
  },
  progressWrap: {
    marginTop: 8,
  },
  progressBar: {
    height: 3,
    background: "var(--bg-3)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.3s ease",
  },
  progressText: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
    display: "flex",
    justifyContent: "space-between",
  },
  pathText: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--text-3)",
    marginTop: 5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

function StatusBadge({ status }) {
  const config = {
    downloading: { color: "var(--yellow)", bg: "rgba(255,210,77,0.12)", label: "DOWNLOADING" },
    converting: { color: "var(--blue)", bg: "rgba(77,158,255,0.12)", label: "CONVERTING" },
    done: { color: "var(--accent)", bg: "var(--accent-glow)", label: "DONE" },
    error: { color: "var(--red)", bg: "rgba(255,69,87,0.12)", label: "ERROR" },
    queued: { color: "var(--text-3)", bg: "var(--bg-3)", label: "QUEUED" },
  };
  const c = config[status] || config.queued;
  return (
    <span style={{ ...styles.statusBadge, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

export default function DownloadList({ downloads, onDelete, onOpen, onOpenFolder }) {
  const active = downloads.filter((d) => d.status === "downloading" || d.status === "converting");
  const done = downloads.filter((d) => d.status !== "downloading" && d.status !== "converting");

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Downloads</span>
        <span style={styles.count}>{downloads.length}</span>
      </div>

      <div style={styles.list}>
        {downloads.length === 0 && (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>↓</span>
            <span style={styles.emptyText}>NO DOWNLOADS YET</span>
          </div>
        )}

        {[...active, ...done].map((item) => (
          <DownloadItem
            key={item.id}
            item={item}
            onDelete={onDelete}
            onOpen={onOpen}
            onOpenFolder={onOpenFolder}
          />
        ))}
      </div>
    </div>
  );
}

function DownloadItem({ item, onDelete, onOpen, onOpenFolder }) {
  const isActive = item.status === "downloading" || item.status === "converting";
  const isDone = item.status === "done";
  const isError = item.status === "error";

  return (
    <div
      style={{
        ...styles.item,
        borderColor: isActive ? "var(--border-bright)" : "var(--border)",
      }}
    >
      <div style={styles.itemTop}>
        <div style={styles.itemThumb}>
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            item.mode === "video" ? "🎬" : "🎵"
          )}
        </div>
        <div style={styles.itemInfo}>
          <div style={styles.itemTitle}>{item.title}</div>
          <div style={styles.itemMeta}>
            <StatusBadge status={item.status} />
            <span>{item.mode === "video" ? item.quality : `${item.audioFmt?.toUpperCase()} ${item.bitrate}k`}</span>
            {item.fileSize && <span>{formatBytes(item.fileSize)}</span>}
          </div>
        </div>
        <div style={styles.actions}>
          {isDone && (
            <>
              <button
                style={styles.actionBtn}
                onClick={() => onOpen(item.path)}
                title="Open file"
                onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; e.target.style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { e.target.style.color = "var(--text-2)"; e.target.style.borderColor = "var(--border)"; }}
              >▶</button>
              <button
                style={styles.actionBtn}
                onClick={() => onOpenFolder(item.path)}
                title="Show in folder"
                onMouseEnter={(e) => { e.target.style.color = "var(--blue)"; e.target.style.borderColor = "var(--blue)"; }}
                onMouseLeave={(e) => { e.target.style.color = "var(--text-2)"; e.target.style.borderColor = "var(--border)"; }}
              >📁</button>
            </>
          )}
          {!isActive && (
            <button
              style={styles.actionBtn}
              onClick={() => onDelete(item.id, item.path)}
              title="Delete"
              onMouseEnter={(e) => { e.target.style.color = "var(--red)"; e.target.style.borderColor = "var(--red)"; }}
              onMouseLeave={(e) => { e.target.style.color = "var(--text-2)"; e.target.style.borderColor = "var(--border)"; }}
            >✕</button>
          )}
        </div>
      </div>

      {isActive && (
        <div style={styles.progressWrap}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${item.progress || 0}%`,
                background: item.status === "converting"
                  ? "var(--blue)"
                  : "linear-gradient(90deg, var(--accent), var(--accent-dim))",
              }}
            />
          </div>
          <div style={styles.progressText}>
            <span>{item.progressText || (item.status === "converting" ? "Converting..." : "Starting...")}</span>
            <span>{item.progress ? `${Math.round(item.progress)}%` : ""}</span>
          </div>
        </div>
      )}

      {isError && item.error && (
        <div style={{ ...styles.pathText, color: "var(--red)", marginTop: 6 }}>
          ⚠ {item.error}
        </div>
      )}

      {isDone && item.path && (
        <div style={styles.pathText} title={item.path}>
          {item.path}
        </div>
      )}
    </div>
  );
}
