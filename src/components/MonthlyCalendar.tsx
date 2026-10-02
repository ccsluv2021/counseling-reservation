'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Ban,
} from 'lucide-react';
import { PublicReservation, BlackoutSlot } from '@/types/reservation';
import { formatDate } from '@/lib/utils';

interface MonthlyCalendarProps {
  currentMonth: Date; // 표시할 년/월 기준 날짜 객체
  onChangeMonth: (newMonth: Date) => void;
  reservations: PublicReservation[];
  blackouts: BlackoutSlot[];
  onSelectDate: (dateStr: string) => void; // 날짜 클릭 시 상세 모달 오픈
}

/**
 * ==============================================================================
 * [MonthlyCalendar.tsx] 월~토 6열 그리드 월간 달력 컴포넌트
 * 
 * - 갤럭시, 아이폰, PC 모두 100% 동일하게 적용
 * - 월간 달력 칸에서는 긴 텍스트 대신 깔끔한 소속별 색깔 뱃지(+1, +2)로 표기
 * - 버튼 텍스트를 '오늘'로 단축하여 모바일 가독성 향상
 * ==============================================================================
 */
export default function MonthlyCalendar({
  currentMonth,
  onChangeMonth,
  reservations,
  blackouts,
  onSelectDate,
}: MonthlyCalendarProps) {
  const todayStr = formatDate(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  // 이전 달 / 다음 달 이동
  const handlePrevMonth = () => {
    onChangeMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onChangeMonth(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    onChangeMonth(new Date());
  };

  // -------------------------------------------------------------
  // [일요일 제외] 월~토 6열 달력 날짜 셀 계산
  // -------------------------------------------------------------
  const firstDateObj = new Date(year, month, 1);
  const firstDay = firstDateObj.getDay(); // 0:일, 1:월, ..., 6:토

  // 시작 월요일 계산 (1일이 일요일이면 2일부터, 아니면 해당 주의 월요일부터)
  const startDate = new Date(year, month, 1);
  if (firstDay === 0) {
    startDate.setDate(2);
  } else {
    startDate.setDate(1 - (firstDay - 1));
  }

  // 말일 및 마지막 토요일 계산
  const lastDateObj = new Date(year, month + 1, 0);
  const lastDay = lastDateObj.getDay();
  const endDate = new Date(year, month + 1, 0);
  if (lastDay === 0) {
    endDate.setDate(lastDateObj.getDate() - 1);
  } else {
    endDate.setDate(lastDateObj.getDate() + (6 - lastDay));
  }

  // 시작 월요일부터 마지막 토요일까지 일요일(0)을 제외하고 셀 생성
  const calendarCells = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0) {
      calendarCells.push({
        dateStr: formatDate(curr),
        dayNumber: curr.getDate(),
        isCurrentMonth: curr.getMonth() === month,
        dayOfWeek: dayOfWeek,
      });
    }
    curr.setDate(curr.getDate() + 1);
  }

  // 월 ~ 토 요일 레이블 (6개)
  const weekDayLabels = [
    { label: '월', isSaturday: false },
    { label: '화', isSaturday: false },
    { label: '수', isSaturday: false },
    { label: '목', isSaturday: false },
    { label: '금', isSaturday: false },
    { label: '토', isSaturday: true },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      
      {/* 1. 상단 월 네비게이션 헤더 */}
      <div className="p-3.5 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-2 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50">
        
        {/* 년/월 제목 및 이전/다음 버튼 */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={handlePrevMonth}
            type="button"
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center">
            <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {year}년 {month + 1}월
            </h2>
          </div>

          <button
            onClick={handleNextMonth}
            type="button"
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* '오늘' 바로가기 (단축) & 예약 안내 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            type="button"
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer whitespace-nowrap"
          >
            오늘
          </button>
          <div className="hidden md:inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>원하는 날짜를 클릭하면 시간표 확인 및 예약 가능</span>
          </div>
        </div>

      </div>

      {/* 2. 요일 헤더 (월 ~ 토, 6열) */}
      <div className="grid grid-cols-6 border-b border-gray-200 bg-gray-50/70 text-center text-xs font-bold py-2 sm:py-2.5">
        {weekDayLabels.map((w, idx) => (
          <div
            key={idx}
            className={`${
              w.isSaturday ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {w.label}
          </div>
        ))}
      </div>

      {/* 3. 6열(월~토) 월간 달력 날짜 그리드 */}
      <div className="grid grid-cols-6 divide-x divide-y divide-gray-200 border-b border-gray-200">
        {calendarCells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSaturday = cell.dayOfWeek === 6;

          // 해당 날짜의 확정 예약 목록 필터링
          const dayReservations = reservations
            .filter((r) => r.reservation_date === cell.dateStr && r.status === 'CONFIRMED');

          // 소속별 건수 계산
          const staffCount = dayReservations.filter((r) => r.user_category === '청년공간 근무자').length;
          const externalCount = dayReservations.filter((r) => r.user_category !== '청년공간 근무자').length;

          // 해당 날짜의 차단 슬롯 목록
          const dayBlackouts = blackouts.filter((b) => b.blackout_date === cell.dateStr);

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[75px] sm:min-h-[85px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                cell.isCurrentMonth ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/40 text-gray-400'
              } ${isToday ? 'bg-blue-50/20' : ''}`}
            >
              {/* 상단: 날짜 번호 및 뱃지 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isSaturday
                      ? 'text-blue-600'
                      : cell.isCurrentMonth
                      ? 'text-gray-800'
                      : 'text-gray-400'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* 차단/점검 일정 뱃지 */}
                {dayBlackouts.length > 0 && (
                  <span
                    className="text-[9px] sm:text-[10px] text-amber-700 font-medium px-1 bg-amber-50 rounded flex items-center gap-0.5"
                    title={dayBlackouts.map((b) => b.reason).join(', ')}
                  >
                    <Ban className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">점검</span>
                  </span>
                )}
              </div>

              {/* [월간 달력 전 기기 공통] 소속별 색깔 뱃지 (+1, +2) 표기 */}
              <div className="flex-1 flex flex-col justify-center items-center gap-1 my-0.5">
                {dayReservations.length > 0 ? (
                  <div className="w-full flex flex-col gap-1 items-center">
                    {/* 청년공간 근무자 예약 건수: 파란색 뱃지 */}
                    {staffCount > 0 && (
                      <div
                        className="w-full text-center text-[10px] sm:text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded py-0.5 px-1 shadow-2xs leading-tight transition"
                        title={`청년공간 근무자 예약 ${staffCount}건`}
                      >
                        +{staffCount}
                      </div>
                    )}
                    {/* 외부 상담사 예약 건수: 보라색 뱃지 */}
                    {externalCount > 0 && (
                      <div
                        className="w-full text-center text-[10px] sm:text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded py-0.5 px-1 shadow-2xs leading-tight transition"
                        title={`외부 상담사 예약 ${externalCount}건`}
                      >
                        +{externalCount}
                      </div>
                    )}
                  </div>
                ) : (
                  cell.isCurrentMonth && (
                    <span className="text-[9px] text-gray-300 group-hover:text-blue-500 transition">
                      +
                    </span>
                  )
                )}
              </div>

              {/* 하단: 미세한 여백 */}
              <div className="h-1" />

            </div>
          );
        })}
      </div>

      {/* 4. 하단 친절한 이용 안내 및 소속별 뱃지 범례 */}
      <div className="p-3 sm:p-4 bg-gray-50/70 border-t border-gray-200 text-xs text-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            날짜를 클릭하면 <b>상세 시간표 확인</b> 및 <b>예약/취소</b>가 가능합니다.
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-blue-600" />
            <span>근무자 (+1)</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-600" />
            <span>상담사 (+1)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
