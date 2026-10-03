export default function GoogleMapCard({ location }) {
  // .env.local から API キーを取得
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1. location が「文字列」か「オブジェクト」かを判定して地名を抽出（安全ガード）
  const rawLocation =
    typeof location === "string"
      ? location
      : location?.mainText || location?.name || location?.description || "";

  // 2. 余計な空白をカットして安全な文字列にする
  const validLocation = rawLocation.trim();

  // 3. 検索キーワードがない場合、デフォルトを "My Location"（現在地）にする
  const targetLocation = validLocation !== "" ? validLocation : "My Location";

  // Google Maps Embed API の URL 生成（q パラメータに場所を指定）
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
    targetLocation,
  )}`;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/60 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <span>🗺️</span> {validLocation ? "目的地マップ" : "現在地マップ"}
        </h3>
        {validLocation && (
          <span className="text-xs bg-app-accent/20 text-app-main px-2.5 py-0.5 rounded-full font-bold truncate max-w-[150px]">
            {validLocation}
          </span>
        )}
      </div>

      {/* 地図埋め込みエリア */}
      <div className="w-full h-48 rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-200">
        <iframe
          title="Google Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          allow="geolocation"
          src={mapSrc}
        />
      </div>
    </div>
  );
}
