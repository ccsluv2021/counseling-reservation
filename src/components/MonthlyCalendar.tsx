'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Ban,
} from 'lucide-react';
import { PublicReservation, BlackoutSlot } from '@/types/reservation';
import { formatDate } from '@/lib/utils';
import { formatDisplayMaskedName } from '@/lib/crypto';

interface MonthlyCalendarProps {
  currentMonth: Date; // 표시할 년/월 기준 날짜 객체
  onChangeMonth: (newMonth: Date) => void;
  reservations: PublicReservation[];
  blackouts: BlackoutSlot[];
  onSelectDate: (dateStr: string) => void; // 날짜 클릭 시 상세 모달 오픈
}

/**
 * ==============================================================================
 * [MonthlyCalendar.tsx] 월간 달력(Monthly Grid) 기반 뷰 컴포넌트
 * 
 * - 한눈에 이번 달 전체 일정을 조망할 수 있는 7열(일~토) 달력
 * - 각 날짜 칸에 파란색/보라색 칩으로 '권x한 11-12' 형태로 소속 및 시간 표기
 * - 하루에 3건 이상 예약 시 상위 2건 + '+N건 더보기' 표기
 * - 날짜 칸 또는 칩을 클릭하면 해당 일자의 상세 시간표 및 예약/취소 팝업이 바로 열림
 * - 상단 제목 옆의 '상담실 월간 현황' 서브 텍스트 제거 완료
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

  // 달력 그리드 계산 (해당 월 1일의 요일 및 말일 계산)
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0(일) ~ 6(토)
  const lastDate = new Date(year, month + 1, 0).getDate(); // 해당 월 마지막 일수
  const prevMonthLastDate = new Date(year, month, 0).getDate(); // 이전 달 마지막 일수

  // 달력에 표시할 날짜 셀 배열 생성 (총 35개 또는 42개)
  const calendarCells = [];

  // 1) 이전 달 날짜 채우기
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i;
    const dateObj = new Date(year, month - 1, d);
    calendarCells.push({
      dateStr: formatDate(dateObj),
      dayNumber: d,
      isCurrentMonth: false,
      dayOfWeek: dateObj.getDay(),
    });
  }

  // 2) 이번 달 날짜 채우기
  for (let d = 1; d <= lastDate; d++) {
    const dateObj = new Date(year, month, d);
    calendarCells.push({
      dateStr: formatDate(dateObj),
      dayNumber: d,
      isCurrentMonth: true,
      dayOfWeek: dateObj.getDay(),
    });
  }

  // 3) 다음 달 날짜 채우기 (7의 배수로 맞춤)
  const remainingCells = 7 - (calendarCells.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const dateObj = new Date(year, month + 1, d);
      calendarCells.push({
        dateStr: formatDate(dateObj),
        dayNumber: d,
        isCurrentMonth: false,
        dayOfWeek: dateObj.getDay(),
      });
    }
  }

  const weekDayLabels = [
    { label: '일', isSunday: true, isSaturday: false },
    { label: '월', isSunday: false, isSaturday: false },
    { label: '화', isSunday: false, isSaturday: false },
    { label: '수', isSunday: false, isSaturday: false },
    { label: '목', isSunday: false, isSaturday: false },
    { label: '금', isSunday: false, isSaturday: false },
    { label: '토', isSunday: false, isSaturday: true },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      
      {/* 1. 상단 월 네비게이션 헤더 */}
      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50">
        
        {/* 년/월 제목 및 이전/다음 버튼 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            type="button"
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {year}년 {month + 1}월
            </h2>
          </div>

          <button
            onClick={handleNextMonth}
            type="button"
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 오늘 바로가기 & 예약 안내 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer"
          >
            오늘로 이동
          </button>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>원하는 날짜를 클릭하면 시간표 확인 및 예약 가능</span>
          </div>
        </div>

      </div>

      {/* 2. 요일 헤더 (일 ~ 토) */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 text-center text-xs font-bold py-2.5">
        {weekDayLabels.map((w, idx) => (
          <div
            key={idx}
            className={`${
              w.isSunday ? 'text-red-500' : w.isSaturday ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {w.label}
          </div>
        ))}
      </div>

      {/* 3. 7열 월간 달력 날짜 그리드 */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 border-b border-gray-200">
        {calendarCells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSunday = cell.dayOfWeek === 0;
          const isSaturday = cell.dayOfWeek === 6;

          // 해당 날짜의 확정 예약 목록 필터링
          const dayReservations = reservations
            .filter((r) => r.reservation_date === cell.dateStr && r.status === 'CONFIRMED')
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          // 해당 날짜의 차단 슬롯 목록
          const dayBlackouts = blackouts.filter((b) => b.blackout_date === cell.dateStr);

          // 표시할 상위 2건과 초과된 건수 계산
          const maxVisible = 2;
          const visibleReservations = dayReservations.slice(0, maxVisible);
          const hiddenCount = dayReservations.length - maxVisible;

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                cell.isCurrentMonth ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50/40 text-gray-400'
              } ${isToday ? 'bg-blue-50/20' : ''}`}
            >
              {/* 상단: 날짜 번호 및 뱃지 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isSunday
                      ? 'text-red-500'
                      : isSaturday
                      ? 'text-blue-600'
                      : cell.isCurrentMonth
                      ? 'text-gray-800'
                      : 'text-gray-400'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* 일요일 정기 휴무 뱃지 */}
                {isSunday && (
                  <span className="text-[10px] text-red-500 font-medium px-1 bg-red-50 rounded">
                    휴무
                  </span>
                )}
                {/* 차단 일정 존재 시 뱃지 */}
                {dayBlackouts.length > 0 && (
                  <span
                    className="text-[10px] text-amber-700 font-medium px-1 bg-amber-50 rounded flex items-center gap-0.5"
                    title={dayBlackouts.map((b) => b.reason).join(', ')}
                  >
                    <Ban className="w-2.5 h-2.5" />
                    점검
                  </span>
                )}
              </div>

              {/* 중앙: 예약 칩 리스트 (권x한 11-12) */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {visibleReservations.map((res) => {
                  // 시작시-종료시 추출 (예: "11:00" -> "11", "12:00" -> "12")
                  const startHour = res.start_time.split(':')[0];
                  const endHour = res.end_time.split(':')[0];
                  const timeLabel = `${parseInt(startHour, 10)}-${parseInt(endHour, 10)}`;
                  const maskedName = formatDisplayMaskedName(res.masked_name);

                  // 소속별 칩 색상 분기 (근무자: 파란색, 외부 상담사: 보라색)
                  const isStaff = res.user_category === '청년공간 근무자';
                  const chipBgClass = isStaff
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/90'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200/90';
                  const timeTextClass = isStaff ? 'text-blue-600' : 'text-purple-600';

                  return (
                    <div
                      key={res.id}
                      className={`${chipBgClass} border rounded-md px-1.5 py-0.5 text-[11px] font-semibold flex items-center justify-between gap-1 shadow-2xs truncate transition`}
                      title={`[${res.user_category}] ${maskedName} (${res.start_time}~${res.end_time}) - ${res.purpose}`}
                    >
                      <span className="truncate">{maskedName}</span>
                      <span className={`${timeTextClass} text-[10px] font-mono shrink-0`}>
                        {timeLabel}
                      </span>
                    </div>
                  );
                })}

                {/* +N건 더보기 칩 */}
                {hiddenCount > 0 && (
                  <div className="text-[10px] font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded px-1.5 py-0.5 text-center transition">
                    +{hiddenCount}건 더보기
                  </div>
                )}
              </div>

              {/* 하단: 호버 시 살짝 나타나는 '예약 가능' 가이드 */}
              <div className="text-[10px] text-gray-400 group-hover:text-blue-600 transition-colors pt-1 text-right">
                {cell.isCurrentMonth && !isSunday && dayReservations.length === 0 && (
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-600">
                    +예약 가능
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 4. 하단 친절한 이용 안내 및 소속별 칩 범례 */}
      <div className="p-4 bg-gray-50/70 border-t border-gray-200 text-xs text-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <b>이용 방법:</b> 날짜를 클릭하면 <b>상세 시간표 확인</b> 및 <b>비어 있는 시간대 예약</b>이 가능합니다.
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>청년공간 근무자 (파랑)</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span>외부 상담사 (보라)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
