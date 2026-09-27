import { useState, useEffect, useRef } from "react";
import { loadGoogleMapsLibrary } from "../utils/googleMapsLoader";

export default function SearchBar({ onSearch }) {
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // places ライブラリを保持するRef
  const placesLibRef = useRef(null);

  useEffect(() => {
    // 新しいローダー共通関数を利用して places ライブラリを取得
    loadGoogleMapsLibrary("places")
      .then((places) => {
        placesLibRef.current = places;
      })
      .catch((e) => {
        console.error("Google Maps API 読み込みエラー:", e);
      });
  }, []);

  // 入力時のリアルタイム候補取得
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setInputValue(value);
    setErrorMessage("");

    if (!value.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    const places = placesLibRef.current;

    if (places?.AutocompleteSuggestion) {
      try {
        const { suggestions } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
          });

        if (suggestions && suggestions.length > 0) {
          setPredictions(suggestions);
          setIsOpen(true);
          setErrorMessage("");
        } else {
          setPredictions([]);
          setIsOpen(false);
          setErrorMessage("該当するスポットが見つかりませんでした");
        }
      } catch (error) {
        console.error("オートコンプリート取得エラー:", error);
        setPredictions([]);
        setIsOpen(false);
      }
    }
  };

  // 候補選択時（placeIdでの確実な座標取得ロジック追加）
  const handleSelectPrediction = async (suggestion) => {
    const p = suggestion.placePrediction;
    const description = p.text?.text || p.mainText?.text || "";

    setInputValue(description);
    setPredictions([]);
    setIsOpen(false);

    let lat = null;
    let lng = null;

    // 1. fetchFields による取得を試行
    try {
      const place = suggestion.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress"] });

      if (place.location) {
        lat =
          typeof place.location.lat === "function"
            ? place.location.lat()
            : place.location.lat;
        lng =
          typeof place.location.lng === "function"
            ? place.location.lng()
            : place.location.lng;
      }
    } catch (error) {
      console.warn(
        "fetchFields での取得失敗。Geocoderへフォールバックします:",
        error,
      );
    }

    // 2. もし fetchFields で lat/lng が取れなかった場合、placeId を使って正確に座標を取得
    if (lat === null || lng === null) {
      try {
        const geocodingLib = await loadGoogleMapsLibrary("geocoding");
        const geocoder = new geocodingLib.Geocoder();

        // placeId を優先してジオコーディング（一意に特定の場所を特定）
        const request = p.placeId
          ? { placeId: p.placeId }
          : {
              address: p.secondaryText?.text
                ? `${p.secondaryText.text} ${description}`
                : description,
            };

        const response = await geocoder.geocode(request);

        if (response.results && response.results.length > 0) {
          const location = response.results[0].geometry.location;
          lat = location.lat();
          lng = location.lng();
          console.log("✅ Geocoder で特定座標を取得しました:", { lat, lng });
        }
      } catch (geocoderError) {
        console.error("Geocoder による座標取得エラー:", geocoderError);
      }
    }

    const searchData = {
      description: description,
      placeId: p.placeId,
      mainText: p.mainText?.text || description,
      secondaryText: p.secondaryText?.text || "",
      lat: lat,
      lng: lng,
    };

    console.log("📤 [SearchBar] 確定データ:", searchData);
    onSearch(searchData);
  };

  // 検索ボタン/Enter押下時
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setPredictions([]);
    setIsOpen(false);
    onSearch(inputValue);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="行きたい場所や駅名を入力..."
          className="w-full py-3.5 pl-5 pr-12 rounded-full bg-white/90 backdrop-blur-md text-slate-800 placeholder-slate-400 font-medium shadow-md border border-white/60 focus:outline-none focus:ring-2 focus:ring-app-accent/50 transition-all text-sm"
        />
        <button
          type="submit"
          className="absolute right-2 p-2 bg-app-accent text-app-main rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center"
        >
          🔍
        </button>
      </form>

      {/* エラー表示 */}
      {errorMessage && (
        <div className="mt-2 px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl border border-rose-200 animate-fade-in flex items-center gap-1.5">
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* 検索候補ドロップダウン */}
      {isOpen && predictions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-40 animate-fade-in divide-y divide-slate-100">
          {predictions.map((item, index) => {
            const p = item.placePrediction;
            const displayText = p.text?.text || p.mainText?.text || "";

            return (
              <li
                key={p.placeId || index}
                onClick={() => handleSelectPrediction(item)}
                className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs text-slate-700 flex items-center gap-2 font-medium"
              >
                <span className="text-slate-400">📍</span>
                <span className="truncate">{displayText}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
