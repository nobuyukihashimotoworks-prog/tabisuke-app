import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import holidayJp from "@holiday-jp/holiday_jp";
import { SEASONAL_EVENTS } from "../utils/seasonalEvents";

export default function CalendarCard({
  onDateSelect,
  onPlanSelect, // ★追加：旅程詳細を開くための関数
  dateRange = { startDate: null, endDate: null },
  plans = [],
  events = [],
}) {
  const handleDateClick = (arg) => {
    if (onDateSelect) {
      onDateSelect(arg.dateStr);
    }
  };

  // ★修正：イベントをクリックした時の処理（祝日・行事ラベルの場合は日付選択を行う）
  const handleEventClick = (info) => {
    const isHolidayOrSeasonal =
      info.event.extendedProps?.isHoliday ||
      info.event.extendedProps?.isSeasonal;

    // 祝日や行事のラベルがクリックされた場合は日付選択を行う
    if (isHolidayOrSeasonal) {
      const eventDateStr = info.event.startStr.split("T")[0];
      if (onDateSelect) onDateSelect(eventDateStr);
      return;
    }

    const planId = info.event.id;
    // 該当する旅程データを検索
    const targetPlan = plans.find((p) => String(p.id) === String(planId));

    if (targetPlan && onPlanSelect) {
      // 登録済み旅程が押されたら詳細画面用の処理を呼ぶ
      onPlanSelect(targetPlan);
    } else {
      // 万が一旅程データがない場合は従来通り日付選択処理へ
      const eventDateStr = info.event.startStr.split("T")[0];
      if (onDateSelect) onDateSelect(eventDateStr);
    }
  };

  // ★追加：祝日・季節イベントデータの自動生成（前年・今年・翌年の3年分）
  const holidayAndSeasonalEvents = useMemo(() => {
    const holidayEvents = [];
    const currentYear = new Date().getFullYear();

    [-1, 0, 1].forEach((offset) => {
      const year = currentYear + offset;

      // 日本の祝日を取得
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      const holidays = holidayJp.between(startDate, endDate);

      holidays.forEach((h) => {
        const yStr = h.date.getFullYear();
        const mStr = String(h.date.getMonth() + 1).padStart(2, "0");
        const dStr = String(h.date.getDate()).padStart(2, "0");
        const dateStr = `${yStr}-${mStr}-${dStr}`;

        // ★追加: ライブラリの「休日」という名称を「国民の休日」に読み替える
        const holidayTitle = h.name === "休日" ? "国民の休日" : h.name;

        holidayEvents.push({
          id: `holiday-${dateStr}`,
          title: holidayTitle, // ★変換後のタイトルをセット
          start: dateStr,
          allDay: true,
          className: "holiday-event-label",
          extendedProps: { isHoliday: true },
        });
      });

      // 季節の行事を追加（インポートした SEASONAL_EVENTS を使用）
      SEASONAL_EVENTS.forEach((e) => {
        const mStr = String(e.month).padStart(2, "0");
        const dStr = String(e.day).padStart(2, "0");
        const dateStr = `${year}-${mStr}-${dStr}`;

        holidayEvents.push({
          id: `seasonal-${dateStr}-${e.title}`,
          title: e.title,
          start: dateStr,
          allDay: true,
          className: "seasonal-event-label",
          extendedProps: { isSeasonal: true },
        });
      });
    });

    return holidayEvents;
  }, []);

  const formattedPlanEvents = plans.map((plan) => {
    // dateRange があればそれを優先、無ければ plan.date を使用
    const startDate = plan.dateRange?.startDate || plan.date;
    let endDate = plan.dateRange?.endDate || startDate;

    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      endDate = end.toISOString().split("T")[0];
    }

    return {
      id: String(plan.id),
      title: plan.title,
      start: startDate,
      end: endDate,
      allDay: true,
      backgroundColor: "#3b82f6",
      borderColor: "#3b82f6",
      extendedProps: {
        location: plan.location,
        todos: plan.todos,
      },
    };
  });

  // 外部からのevents、旅程イベント、祝日・行事イベントを全て統合
  const allEvents = [
    ...events,
    ...formattedPlanEvents,
    ...holidayAndSeasonalEvents,
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/60">
      <FullCalendar
        key={`${dateRange.startDate}-${dateRange.endDate}-${allEvents.length}`}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev",
          center: "title",
          right: "next",
        }}
        locale="ja"
        height="auto"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        events={allEvents}
        dayCellClassNames={(arg) => {
          const classes = [];
          const date = arg.date;
          const dayOfWeek = date.getDay(); // 0: 日曜, 6: 土曜

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const cellDate = `${year}-${month}-${day}`;

          // --- 1. 土・日・祝日の判定クラスを追加 ---
          const isHoliday = holidayJp.isHoliday(date);
          if (dayOfWeek === 0 || isHoliday) {
            classes.push("fc-day-holiday"); // 日曜・祝日
          } else if (dayOfWeek === 6) {
            classes.push("fc-day-saturday"); // 土曜日
          }

          // --- 2. 既存の選択中日付クラスの判定 ---
          const { startDate, endDate } = dateRange;

          if (startDate && !endDate && cellDate === startDate) {
            classes.push("selected-day-cell");
          }

          if (
            startDate &&
            endDate &&
            cellDate >= startDate &&
            cellDate <= endDate
          ) {
            classes.push("selected-day-cell");
          }

          return classes;
        }}
      />
    </div>
  );
}
