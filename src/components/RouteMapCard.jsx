export default function GoogleMapCard({ location }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1. location の型に応じて検索クエリ用の文字列を作成
  let targetQuery = "";
  let displayLabel = "";

  if (typeof location === "string") {
    targetQuery = location.trim();
    displayLabel = location.trim();
  } else if (location && typeof location === "object") {
    // 緯度・経度のオブジェクト { lat, lng } が渡された場合
    if (location.lat && location.lng) {
      targetQuery = `${location.lat},${location.lng}`;
      displayLabel = "現在地";
    } else {
      // 検索結果オブジェクトなどの場合
      targetQuery =
        location.mainText || location.name || location.description || "";
      displayLabel = targetQuery;
    }
  }

  // デフォルト（場所が未指定の場合）は「東京駅」などの具体的な座標や名称にするか、デフォルト位置を指定
  const finalQuery = targetQuery !== "" ? targetQuery : "Tokyo Station";

  // Google Maps Embed API の URL 生成
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
    finalQuery,
  )}`;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/60 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <span>🗺️</span> {displayLabel ? "目的地マップ" : "現在地マップ"}
        </h3>
        {displayLabel && (
          <span className="text-xs bg-app-accent/20 text-app-main px-2.5 py-0.5 rounded-full font-bold truncate max-w-[150px]">
            {displayLabel}
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
