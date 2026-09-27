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

  // 入力時のリアルタイム候補取得（新しい AutocompleteSuggestion API を使用）
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

    // 新しい AutocompleteSuggestion API が利用可能な場合
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

  // 候補選択時（緯度経度取得＆デバッグログ付き）
  const handleSelectPrediction = async (suggestion) => {
    const p = suggestion.placePrediction;
    const description = p.text?.text || p.mainText?.text || "";

    setInputValue(description);
    setPredictions([]);
    setIsOpen(false);

    let lat = null;
    let lng = null;

    try {
      console.log("🔍 [SearchBar] 選択された候補:", suggestion);

      // AutocompleteSuggestion から Place インスタンスを作成
      const place = suggestion.toPlace();

      // 場所の詳細（位置情報: location）を取得
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
        console.log("✅ [SearchBar] 取得成功 (lat, lng):", { lat, lng });
      } else {
        console.warn("⚠️ [SearchBar] place.location が取得できませんでした");
      }
    } catch (error) {
      console.error("❌ [SearchBar] fetchFields 実行エラー:", error);
    }

    const searchData = {
      description: description,
      placeId: p.placeId,
      mainText: p.mainText?.text || description,
      secondaryText: p.secondaryText?.text || "",
      lat: lat,
      lng: lng,
    };

    console.log("📤 [SearchBar] onSearch に渡すデータ:", searchData);
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
