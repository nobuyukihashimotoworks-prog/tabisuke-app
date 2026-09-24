import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

// Google Maps APIの基本設定
setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  version: "weekly",
});

// 各コンポーネントから必要なライブラリ（"maps", "routes", "places" 等）を読み込む共通関数
export const loadGoogleMapsLibrary = (name) => {
  return importLibrary(name);
};
