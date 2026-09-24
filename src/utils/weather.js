const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// API エラー時や通信失敗時のフォールバックデータ
export const FALLBACK_WEATHER = {
  label: "天気情報なし",
  icon: "❓",
  temp: "--",
  maxTemp: "--",
  minTemp: "--",
  isFallback: true,
};

// OpenWeatherMapの天気メインコードを日本語・絵文字に変換するマップ
const WEATHER_MAP = {
  Clear: { label: "晴れ", icon: "☀️" },
  Clouds: { label: "曇り", icon: "☁️" },
  Rain: { label: "雨", icon: "☔" },
  Drizzle: { label: "小雨", icon: "🌧️" },
  Thunderstorm: { label: "雷雨", icon: "⚡" },
  Snow: { label: "雪", icon: "❄️" },
  Mist: { label: "霧", icon: "🌫️" },
  Fog: { label: "濃霧", icon: "🌫️" },
};

/**
 * 日本の住所・地名から「日本、」等の不要部分を削除して検索候補を作成
 */
function generateQueryCandidates(rawLocation) {
  if (!rawLocation) return [];

  // 先頭の「日本、」「日本 」を削除
  let cleaned = rawLocation.trim().replace(/^日本[、, \t]*/, "");

  const candidates = [];

  // 1. 全体（例: "福岡県久留米市御井町１ 高良大社"）
  candidates.push(cleaned);

  // 2. スペースで区切られた単語（例: "高良大社" や "福岡県久留米市御井町１"）
  const parts = cleaned.split(/[  ,、]/).filter(Boolean);
  if (parts.length > 1) {
    // 施設名などの最後・最初の単語を追加
    candidates.push(parts[parts.length - 1]); // 例: "高良大社"
    candidates.push(parts[0]); // 例: "福岡県久留米市御井町１"
  }

  // 3. 都道府県・市区町村までの抽出（例: "福岡県久留米市"）
  const cityMatch = cleaned.match(/(.+?[都道府県]?.+?[市区町村])/);
  if (cityMatch && cityMatch[1] && !candidates.includes(cityMatch[1])) {
    candidates.push(cityMatch[1]);
  }

  return candidates;
}

/**
 * 1. 地名から 緯度・経度 を取得する (OpenStreetMap / Nominatim API を使用)
 *    ※ 日本の住所・施設名に対する検索精度が非常に高いです。
 */
export async function getCoordinates(locationName) {
  if (!locationName) return null;

  const queries = generateQueryCandidates(locationName);

  for (const query of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&limit=1&accept-language=ja`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "TravelPlannerApp/1.0", // Nominatim API 利用に必要なヘッダー
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data && data.length > 0) {
        console.log(`【座標取得成功】「${query}」で座標を取得しました:`, {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        });
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error(`ジオコーディング取得エラー (${query}):`, error);
    }
  }

  console.warn(
    `⚠️ 「${locationName}」の全検索候補で座標が見つかりませんでした`,
  );
  return null;
}

/**
 * 2. 緯度・経度から 5日間/3時間おきの天気予報を取得する (OpenWeatherMap Forecast API)
 */
export async function fetchWeather(lat, lon) {
  if (!lat || !lon || !API_KEY) {
    console.warn("⚠️ APIキーまたは座標がないためフォールバック表示にします");
    return FALLBACK_WEATHER;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ja&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        "OpenWeatherMap API エラー。フォールバック表示を使用します。",
      );
      return FALLBACK_WEATHER;
    }

    const data = await response.json();
    if (!data || !data.list || data.list.length === 0) {
      return FALLBACK_WEATHER;
    }

    // 最新（直近）の予報データを抽出
    const currentWeather = data.list[0];
    const mainCondition = currentWeather.weather[0]?.main;
    const conditionInfo = WEATHER_MAP[mainCondition] || {
      label: currentWeather.weather[0]?.description || "不明",
      icon: "🌤️",
    };

    return {
      label: conditionInfo.label,
      icon: conditionInfo.icon,
      main: mainCondition || "Clouds",
      conditionKey: mainCondition || "Clouds", // 👈 ここを追加！（"Clear", "Rain", "Snow" 等が入る）
      temp: Math.round(currentWeather.main.temp),
      maxTemp: Math.round(currentWeather.main.temp_max),
      minTemp: Math.round(currentWeather.main.temp_min),
      isFallback: false,
    };
  } catch (error) {
    console.error("天気取得処理エラー:", error);
    return FALLBACK_WEATHER;
  }
}
