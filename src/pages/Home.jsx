import { useState, useEffect } from "react";
// Tauri v2: invoke from @tauri-apps/api/core
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import SearchBar from "../components/SearchBar";
import ResultCard from "../components/ResultCard";
import DownloadOptions from "../components/DownloadOptions";
import DownloadList from "../components/DownloadList";
import FolderSelector from "../components/FolderSelector";
import { useDownloads } from "../hooks/useDownloads";
import { isYouTubeUrl, isSpotifyUrl } from "../services/youtube";

const styles = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg)",
    overflow: "hidden",
  },
  body: { flex: 1, display: "flex", overflow: "hidden" },
  left: {
    width: "55%",
    minWidth: 340,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid var(--border)",
    overflow: "hidden",
  },
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  results: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  bottomPanel: {
    borderTop: "1px solid var(--border)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  errorBanner: {
    padding: "8px 12px",
    background: "rgba(255,69,87,0.1)",
    border: "1px solid rgba(255,69,87,0.3)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--red)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 12,
    color: "var(--text-3)",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  loadingText: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.08em",
    animation: "pulse 1.5s ease infinite",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 8,
    color: "var(--text-3)",
    padding: "30px 0",
  },
  emptyIcon: { fontSize: 32, opacity: 0.25 },
  emptyText: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    letterSpacing: "0.05em",
  },
  depWarn: {
    padding: "6px 12px",
    background: "rgba(255,210,77,0.08)",
    borderTop: "1px solid rgba(255,210,77,0.2)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--yellow)",
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
};

export default function Home() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [folder, setFolder] = useState("");
  const [deps, setDeps] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const {
    downloads,
    addDownload,
    updateDownload,
    removeDownload,
    openFile,
    openFolder,
  } = useDownloads();

  useEffect(() => {
    invoke("check_dependencies")
      .then(setDeps)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let unlisten;
    listen("download_progress", (e) => {
      const payload = e.payload;
      updateDownload(payload.id, {
        progress: payload.percent,
        progressText: payload.text,
        status: payload.status,
        fileSize: payload.size,
        path: payload.path || undefined,
        error: payload.error || undefined,
      });
      if (payload.status === "done" || payload.status === "error") {
        setDownloading(false);
      }
    }).then((u) => {
      unlisten = u;
    });
    return () => {
      if (unlisten) unlisten();
    };
  }, [updateDownload]);

  async function handleSearch(query) {
    setSearching(true);
    setError(null);
    setResults([]);
    setSelected(null);
    setHasSearched(true);
    try {
      let res;
      if (isYouTubeUrl(query)) {
        res = await invoke("get_youtube_info", { url: query });
        setResults([res]);
        setSelected(res);
      } else if (isSpotifyUrl(query)) {
        res = await invoke("get_spotify_info", { url: query });
        setResults([res]);
        setSelected(res);
      } else {
        res = await invoke("search_youtube", { query });
        setResults(Array.isArray(res) ? res : [res]);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSearching(false);
    }
  }

  async function handleDownload(opts) {
    if (!selected) {
      setError("Select a result first.");
      return;
    }
    if (!folder) {
      setError("Select a download folder first.");
      return;
    }
    setDownloading(true);
    setError(null);

    const id = `dl_${Date.now()}`;
    addDownload({
      id,
      title: opts.title,
      thumbnail: opts.thumbnail,
      duration: opts.duration,
      mode: opts.mode,
      quality: opts.quality,
      audioFmt: opts.audioFmt,
      bitrate: opts.bitrate,
      status: "downloading",
      progress: 0,
      path: null,
    });

    try {
      await invoke("start_download", {
        id,
        url: opts.url,
        mode: opts.mode,
        quality: opts.quality,
        audioFormat: opts.audioFmt,
        bitrate: opts.bitrate,
        outputDir: folder,
        title: opts.title,
      });
    } catch (e) {
      updateDownload(id, { status: "error", error: String(e) });
      setDownloading(false);
      setError(`Download failed: ${e}`);
    }
  }

  const missingDeps = deps
    ? Object.entries(deps)
        .filter(([, ok]) => !ok)
        .map(([n]) => n)
    : [];

  return (
    <div style={styles.root}>
      <SearchBar onSearch={handleSearch} loading={searching} />

      {missingDeps.length > 0 && (
        <div style={styles.depWarn}>
          <span>⚠</span>
          <span>
            Missing: <strong>{missingDeps.join(", ")}</strong>
          </span>
          <span style={{ color: "var(--text-3)" }}>
            — Run:{" "}
            <code
              style={{
                background: "var(--bg-3)",
                padding: "1px 5px",
                borderRadius: 3,
              }}
            >
              sudo apt install ffmpeg && pip install yt-dlp
            </code>
          </span>
        </div>
      )}

      <div style={styles.body}>
        <div style={styles.left}>
          <div style={styles.results}>
            {searching && (
              <div style={styles.loadingWrap}>
                <div style={styles.spinner} />
                <span style={styles.loadingText}>SEARCHING...</span>
              </div>
            )}
            {!searching && hasSearched && results.length === 0 && (
              <div style={styles.empty}>
                <span style={styles.emptyIcon}>🔍</span>
                <span style={styles.emptyText}>NO RESULTS FOUND</span>
              </div>
            )}
            {!searching && !hasSearched && (
              <div style={styles.empty}>
                <span style={styles.emptyIcon}>♫</span>
                <span style={styles.emptyText}>SEARCH TO GET STARTED</span>
              </div>
            )}
            {!searching &&
              results.map((r, i) => (
                <ResultCard
                  key={r.id || i}
                  result={r}
                  selected={selected}
                  onSelect={setSelected}
                />
              ))}
          </div>

          {error && (
            <div style={{ padding: "0 12px 8px" }}>
              <div style={styles.errorBanner}>
                <span>⚠</span>
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  style={{
                    background: "none",
                    color: "var(--text-3)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onClick={() => setError(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div style={styles.bottomPanel}>
            <FolderSelector folder={folder} onFolderChange={setFolder} />
            <DownloadOptions
              selected={selected}
              onDownload={handleDownload}
              downloading={downloading}
            />
          </div>
        </div>

        <div style={styles.right}>
          <DownloadList
            downloads={downloads}
            onDelete={removeDownload}
            onOpen={openFile}
            onOpenFolder={openFolder}
          />
        </div>
      </div>
    </div>
  );
}
