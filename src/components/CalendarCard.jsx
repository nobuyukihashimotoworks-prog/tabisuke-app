import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import holidayJp from "@holiday-jp/holiday_jp";
import { SEASONAL_EVENTS } from "../utils/seasonalEvents";

export default function CalendarCard({
  onDateSelect,
  onPlanSelect,
  dateRange = { startDate: null, endDate: null },
  plans = [],
  events = [],
}) {
  const handleDateClick = (arg) => {
    if (onDateSelect) {
      onDateSelect(arg.dateStr);
    }
  };

  const handleEventClick = (info) => {
    const isHolidayOrSeasonal =
      info.event.extendedProps?.isHoliday ||
      info.event.extendedProps?.isSeasonal;

    if (isHolidayOrSeasonal) {
      const eventDateStr = info.event.startStr.split("T")[0];
      if (onDateSelect) onDateSelect(eventDateStr);
      return;
    }

    const planId = info.event.id;
    const targetPlan = plans.find((p) => String(p.id) === String(planId));

    if (targetPlan && onPlanSelect) {
      onPlanSelect(targetPlan);
    } else {
      const eventDateStr = info.event.startStr.split("T")[0];
      if (onDateSelect) onDateSelect(eventDateStr);
    }
  };

  const holidayAndSeasonalEvents = useMemo(() => {
    const holidayEvents = [];
    const currentYear = new Date().getFullYear();

    [-1, 0, 1].forEach((offset) => {
      const year = currentYear + offset;

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      const holidays = holidayJp.between(startDate, endDate);

      holidays.forEach((h) => {
        const yStr = h.date.getFullYear();
        const mStr = String(h.date.getMonth() + 1).padStart(2, "0");
        const dStr = String(h.date.getDate()).padStart(2, "0");
        const dateStr = `${yStr}-${mStr}-${dStr}`;

        const holidayTitle = h.name === "休日" ? "国民の休日" : h.name;

        holidayEvents.push({
          id: `holiday-${dateStr}`,
          title: holidayTitle,
          start: dateStr,
          allDay: true,
          className: "holiday-event-label",
          extendedProps: { isHoliday: true },
        });
      });

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
        eventContent={(eventInfo) => {
          const isHoliday = eventInfo.event.extendedProps?.isHoliday;
          const isSeasonal = eventInfo.event.extendedProps?.isSeasonal;

          // 1. 祝日の場合：文字色をくっきりした赤色にし、truncate（...）を外して全文字表示
          if (isHoliday) {
            return (
              <div className="text-[10px] font-bold text-red-600 whitespace-normal leading-tight px-0.5">
                {eventInfo.event.title}
              </div>
            );
          }

          // 2. 季節イベントの場合：文字色を濃いグレーにし、truncate（...）を外して全文字表示
          if (isSeasonal) {
            return (
              <div className="text-[10px] font-medium text-slate-600 whitespace-normal leading-tight px-0.5">
                {eventInfo.event.title}
              </div>
            );
          }

          // 3. 自分で設定した旅程（Plan）の場合：青背景の白文字で truncate（...）を維持
          return (
            <div className="w-full px-1 truncate text-xs font-bold text-white">
              {eventInfo.event.title}
            </div>
          );
        }}
        dayCellClassNames={(arg) => {
          const classes = [];
          const date = arg.date;
          const dayOfWeek = date.getDay();

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const cellDate = `${year}-${month}-${day}`;

          const isHoliday = holidayJp.isHoliday(date);
          if (dayOfWeek === 0 || isHoliday) {
            classes.push("fc-day-holiday");
          } else if (dayOfWeek === 6) {
            classes.push("fc-day-saturday");
          }

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
