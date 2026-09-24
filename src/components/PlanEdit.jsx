import { useState } from "react";
import HeaderLogo from "./HeaderLogo";
import CalendarCard from "./CalendarCard";
import CustomModal from "./CustomModal"; // ★ CustomModal をインポート

export default function PlanEdit({ plan, onBack, onUpdatePlan }) {
  // 初期値として既存のタイトルと期間をセット
  const [title, setTitle] = useState(plan?.title || "");

  // 単日（plan.date）または 期間（plan.dateRange）に対応
  const [dateRange, setDateRange] = useState({
    startDate: plan?.dateRange?.startDate || plan?.date || null,
    endDate: plan?.dateRange?.endDate || plan?.date || null,
  });

  // モーダルの表示ステート ("none" | "alert" | "confirm" | "complete")
  const [modalState, setModalState] = useState("none");

  // カレンダーでタップされた時の期間選択ロジック
  const handleDateSelect = (clickedDateStr) => {
    const { startDate, endDate } = dateRange;

    if (!startDate || (startDate && endDate)) {
      setDateRange({
        startDate: clickedDateStr,
        endDate: null,
      });
    } else if (startDate && !endDate) {
      if (clickedDateStr < startDate) {
        setDateRange({
          startDate: clickedDateStr,
          endDate: null,
        });
      } else {
        setDateRange({
          startDate,
          endDate: clickedDateStr,
        });
      }
    }
  };

  // 表示用の日付テキストフォーマット処理
  const getFormattedDateText = () => {
    if (dateRange.startDate && dateRange.endDate) {
      if (dateRange.startDate === dateRange.endDate) {
        return dateRange.startDate;
      }
      return `${dateRange.startDate} ～ ${dateRange.endDate}`;
    }
    return dateRange.startDate || "日付未選択";
  };

  // 「旅程を変更する」ボタンを押したとき
  const handleOpenConfirm = () => {
    if (!dateRange.startDate) {
      // ★ alert("日付を選択してください") を CustomModal 表示へ変更
      setModalState("alert");
      return;
    }
    setModalState("confirm");
  };

  // 確認モーダルで「はい」を押したときのデータ更新処理
  const handleConfirm = () => {
    const updatedTitle = title.trim() !== "" ? title.trim() : plan.title;
    const finalEndDate = dateRange.endDate || dateRange.startDate;

    const updatedPlan = {
      ...plan,
      title: updatedTitle,
      date: dateRange.startDate,
      dateRange: {
        startDate: dateRange.startDate,
        endDate: finalEndDate,
      },
    };

    console.log("① 更新データ:", updatedPlan);

    if (onUpdatePlan) {
      console.log("② onUpdatePlan を実行します");
      onUpdatePlan(updatedPlan);
    }

    console.log("③ modalState を complete に変更します");
    setModalState("complete");
  };

  // 完了モーダルで「OK」を押したとき（Homeへ戻る）
  const handleCompleteOK = () => {
    setModalState("none");
    onBack();
  };

  return (
    <div className="w-full max-w-md min-h-screen flex flex-col bg-app-bg p-6 space-y-6 mx-auto relative">
      {/* 1. ヘッダーロゴ */}
      <HeaderLogo small={true} />

      {/* 2. 現状のタイトル & 案内 */}
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold text-app-main">
          {plan?.title || "現状のタイトル"}
        </h2>
        <p className="text-lg font-bold text-app-main mt-4">いつ行きますか？</p>
      </div>

      {/* 3. カレンダー（期間選択機能つき） */}
      <CalendarCard
        onDateSelect={handleDateSelect}
        dateRange={dateRange}
        plans={[]}
      />

      {/* 4. フォーム & ボタンエリア */}
      <div className="flex flex-col items-center space-y-4 pt-2">
        <p className="text-lg font-bold text-app-main">
          予定を立て直しますか？
        </p>

        {/* 新しいタイトル入力欄 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新しいタイトルを入れてください"
          className="w-full py-3 px-6 bg-white rounded-full text-center text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-app-main placeholder-gray-400"
        />

        {/* 旅程を変更するボタン */}
        <button
          type="button"
          onClick={handleOpenConfirm}
          className="w-full py-4 bg-[#DDF7F5] text-app-main text-lg font-bold rounded-full shadow-md hover:opacity-90 transition active:scale-95"
        >
          旅程を変更する
        </button>

        {/* 戻るボタン */}
        <button
          type="button"
          onClick={onBack}
          className="self-start px-6 py-2 bg-[#DDF7F5] text-app-main font-bold rounded-full shadow-md hover:opacity-90 transition text-sm mt-2"
        >
          戻る
        </button>
      </div>

      {/* ★ 5. 日付未選択時の警告モーダル */}
      <CustomModal
        isOpen={modalState === "alert"}
        message="日付を選択してください"
        type="alert"
        okText="OK"
        onClose={() => setModalState("none")}
      />

      {/* ★ 6. 変更確認モーダル */}
      <CustomModal
        isOpen={modalState === "confirm"}
        title={title.trim() || plan?.title}
        subtitle={getFormattedDateText()}
        message="この旅程を変更しますか？"
        type="confirm"
        okText="はい"
        cancelText="いいえ"
        onConfirm={handleConfirm}
        onClose={() => {
          // 「はい」を押した時は handleConfirm 内で modalState が "complete" になるため、
          // ここで "none" に上書きされないよう guard を入れます。
          if (modalState !== "complete") {
            setModalState("none");
          }
        }}
      />

      {/* ★ 7. 変更完了モーダル */}
      <CustomModal
        isOpen={modalState === "complete"}
        message="日程変更が完了しました"
        type="alert"
        okText="OK"
        onClose={handleCompleteOK}
      />
    </div>
  );
}
