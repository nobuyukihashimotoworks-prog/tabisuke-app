export default function GoogleMapCard({ location }) {
  // .env.local から API キーを取得
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // location が undefined / null / 空文字の場合でもエラーにならないよう安全に判定
  const validLocation = typeof location === "string" ? location.trim() : "";

  // ★ 修正1: 検索キーワードがない場合、デフォルトを "My Location"（現在地）にする
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
          allow="geolocation" // ★ 修正2: ブラウザの位置情報（GPS）権限を許可
          src={mapSrc}
        />
      </div>
    </div>
  );
}
