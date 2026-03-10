import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useDownloads() {
  const [downloads, setDownloads] = useState([]);

  const loadDownloads = useCallback(async () => {
    try {
      const list = await invoke("get_downloads");
      setDownloads(list || []);
    } catch (e) {
      console.error("Failed to load downloads:", e);
      setDownloads([]);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const persistRecord = (item) => {
    invoke("save_download", {
      record: {
        id: item.id,
        title: item.title || "",
        path: item.path || null,
        thumbnail: item.thumbnail || null,
        mode: item.mode || "audio",
        quality: item.quality || null,
        audioFmt: item.audioFmt || null,
        bitrate: item.bitrate || null,
        status: item.status || "downloading",
        progress: item.progress || 0,
        fileSize: item.fileSize || null,
        error: item.error || null,
        createdAt: item.createdAt || new Date().toISOString(),
      },
    }).catch(() => {});
  };

  const addDownload = useCallback((item) => {
    setDownloads((prev) => {
      const exists = prev.find((d) => d.id === item.id);
      if (exists) return prev.map((d) => (d.id === item.id ? item : d));
      return [item, ...prev];
    });
    persistRecord(item);
  }, []);

  const updateDownload = useCallback((id, updates) => {
    setDownloads((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      if (updates.status === "done" || updates.status === "error") {
        const item = updated.find((d) => d.id === id);
        if (item) persistRecord(item);
      }
      return updated;
    });
  }, []);

  const removeDownload = useCallback(async (id, filePath) => {
    try {
      await invoke("delete_file", { path: filePath || "", id });
      setDownloads((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  }, []);

  const openFile = useCallback(async (filePath) => {
    try {
      await invoke("open_file", { path: filePath });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const openFolder = useCallback(async (filePath) => {
    try {
      await invoke("open_folder", { path: filePath });
    } catch (e) {
      console.error(e);
    }
  }, []);

  return {
    downloads,
    loadDownloads,
    addDownload,
    updateDownload,
    removeDownload,
    openFile,
    openFolder,
  };
}
