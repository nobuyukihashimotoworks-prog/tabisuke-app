/**
 * 共通モーダルコンポーネント
 *
 * @param {boolean} isOpen - モーダルの表示/非表示
 * @param {string} title - タイトル（省略可）
 * @param {string} subtitle - サブタイトル/日付など（省略可）
 * @param {string} message - メッセージ本文
 * @param {string} type - "alert" (OKのみ) または "confirm" (はい/いいえ)
 * @param {string} okText - OK/はい ボタンのテキスト
 * @param {string} cancelText - いいえ/キャンセル ボタンのテキスト
 * @param {function} onConfirm - OK/はい を押した時の処理
 * @param {function} onClose - いいえ/閉じる を押した時の処理
 */
export default function CustomModal({
  isOpen,
  title,
  subtitle,
  message,
  type = "alert",
  okText,
  cancelText = "いいえ",
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const handleOk = () => {
    if (onConfirm) {
      onConfirm();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-6">
      {/* モーダルカード全体: 背景色 #D9FAF9, 文字色 #004B88 */}
      <div
        className="rounded-[32px] p-8 w-full max-w-xs shadow-xl text-center space-y-4 animate-fade-in"
        style={{ backgroundColor: "#D9FAF9", color: "#004B88" }}
      >
        {/* タイトル */}
        {title && <h3 className="text-lg font-bold tracking-wide">{title}</h3>}

        {/* サブタイトル（日付など） */}
        {subtitle && <p className="text-sm font-bold opacity-90">{subtitle}</p>}

        {/* メッセージ本文 */}
        {message && (
          <p className="text-base font-bold whitespace-pre-line leading-relaxed">
            {message}
          </p>
        )}

        {/* ボタンエリア */}
        <div className="flex justify-center gap-4 pt-2">
          {type === "confirm" ? (
            <>
              <button
                type="button"
                onClick={handleOk}
                className="py-1.5 px-6 bg-white/90 text-[#004B88] text-sm font-bold rounded-full shadow-md hover:bg-white active:scale-95 transition-all"
              >
                {okText || "はい"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-6 bg-white/90 text-[#004B88] text-sm font-bold rounded-full shadow-md hover:bg-white active:scale-95 transition-all"
              >
                {cancelText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleOk}
              className="py-1.5 px-8 bg-white/90 text-[#004B88] text-sm font-bold rounded-full shadow-md hover:bg-white active:scale-95 transition-all"
            >
              {okText || "OK"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
