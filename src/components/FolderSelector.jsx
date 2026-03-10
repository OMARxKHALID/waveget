import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

const styles = {
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  },
  icon: { fontSize: 14, color: "var(--text-3)", flexShrink: 0 },
  path: {
    flex: 1,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--text-2)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  btn: {
    padding: "4px 10px",
    background: "var(--bg-3)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 11,
    color: "var(--text-2)",
    fontFamily: "var(--font-mono)",
    cursor: "pointer",
    transition: "all var(--transition)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
};

export default function FolderSelector({ folder, onFolderChange }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!folder) {
      invoke("get_default_folder")
        .then((f) => f && onFolderChange(f))
        .catch(() => {});
    }
  }, []);

  async function handleSelect() {
    setLoading(true);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Download Folder",
      });
      if (selected && typeof selected === "string") {
        onFolderChange(selected);
      }
    } catch (e) {
      console.error("Folder dialog error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <span style={styles.icon}>📁</span>
      <span style={styles.path} title={folder || ""}>
        {folder || "~/Downloads/Waveget"}
      </span>
      <button
        style={styles.btn}
        onClick={handleSelect}
        disabled={loading}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "var(--accent)";
          e.target.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.color = "var(--text-2)";
        }}
      >
        {loading ? "..." : "CHANGE"}
      </button>
    </div>
  );
}
