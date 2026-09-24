/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "app-bg": "#A4CFF2", // バックグラウンドカラー
        "app-main": "#004B88", // メイン文字色・ヘッダー
        "app-accent": "#D9FAF9", // ダイアログ・ボタン・アクセント
      },
    },
  },
  plugins: [],
};
