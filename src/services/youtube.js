import { invoke } from "@tauri-apps/api/core";

export function isYouTubeUrl(str) {
  return /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/i.test(
    str,
  );
}

export function isSpotifyUrl(str) {
  return /open\.spotify\.com\/(track|album|playlist)/i.test(str);
}

export async function searchYouTube(query) {
  return await invoke("search_youtube", { query });
}

export async function getYouTubeInfo(url) {
  return await invoke("get_youtube_info", { url });
}
