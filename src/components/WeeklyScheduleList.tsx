'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Ban,
} from 'lucide-react';
import { PublicReservation, BlackoutSlot, SpaceSettings } from '@/types/reservation';
import { formatDate } from '@/lib/utils';
import { formatDisplayMaskedName } from '@/lib/crypto';

interface WeeklyCalendarGridProps {
  currentDate: Date; // 기준 날짜 객체
  onChangeDate: (newDate: Date) => void;
  reservations: PublicReservation[];
  blackouts: BlackoutSlot[];
  settings: SpaceSettings;
  onSelectDate: (dateStr: string) => void;
  onOpenReservationModal: (dateStr: string, hour: number) => void;
}

/**
 * ==============================================================================
 * [WeeklyScheduleList.tsx] 월~토 6열 주간 달력 그리드 컴포넌트
 * 
 * - 상단 제목을 `'26년 10월 1주` 형태로 컴팩트하게 단축하여 모바일 줄바꿈 방지
 * - 버튼 텍스트를 `이번주`로 3글자 단축하여 쪼개짐 방지
 * - 주간 달력 칸에서는 '이름 시간' (예: 권x한 14-15)을 한 줄로 컴팩트하게 표기
 * ==============================================================================
 */
export default function WeeklyScheduleList({
  currentDate,
  onChangeDate,
  reservations,
  blackouts,
  onSelectDate,
  onOpenReservationModal,
}: WeeklyCalendarGridProps) {
  const todayStr = formatDate(new Date());

  // 기준 날짜가 속한 주의 월요일(영업 시작일) 구하기
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0(일) ~ 6(토)
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentDate);

  // 이번 주 월요일 ~ 토요일 (총 6일, 일요일 제외)
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dateObj: d,
      dateStr: formatDate(d),
      dayOfWeek: d.getDay(),
      dayNumber: d.getDate(),
      monthNumber: d.getMonth() + 1,
      yearNumber: d.getFullYear(),
    };
  });

  const weekDayLabels = [
    { label: '월', isSaturday: false },
    { label: '화', isSaturday: false },
    { label: '수', isSaturday: false },
    { label: '목', isSaturday: false },
    { label: '금', isSaturday: false },
    { label: '토', isSaturday: true },
  ];

  // 이전 주 / 다음 주 / 이번 주 이동
  const handlePrevWeek = () => {
    const prev = new Date(monday);
    prev.setDate(prev.getDate() - 7);
    onChangeDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    onChangeDate(next);
  };

  const handleThisWeek = () => {
    onChangeDate(new Date());
  };

  // -------------------------------------------------------------
  // [주차 제목 단축 계산] 해당 주 목요일 기준 'YY년 M월 N주 (예: '26년 10월 1주)
  // -------------------------------------------------------------
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const yearShort = String(thursday.getFullYear()).slice(-2);
  const monthNum = thursday.getMonth() + 1;
  const weekNumber = Math.ceil(thursday.getDate() / 7);
  const rangeTitle = `'${yearShort}년 ${monthNum}월 ${weekNumber}주`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      
      {/* 1. 상단 주간 네비게이션 헤더 */}
      <div className="p-3 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-2 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50">
        
        {/* 주차 제목 및 이전/다음 버튼 */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            onClick={handlePrevWeek}
            type="button"
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="이전 주"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight whitespace-nowrap">
            {rangeTitle}
          </h2>

          <button
            onClick={handleNextWeek}
            type="button"
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="다음 주"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* '이번주' 이동 버튼 (3글자 단축) & 예약 가이드 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleThisWeek}
            type="button"
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer whitespace-nowrap"
          >
            이번주
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

      {/* 3. 6열(월~토) 주간 달력 날짜 그리드 */}
      <div className="grid grid-cols-6 divide-x divide-gray-200 border-b border-gray-200">
        {weekDays.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSaturday = cell.dayOfWeek === 6;

          // 해당 날짜의 확정 예약 목록 필터링
          const dayReservations = reservations
            .filter((r) => r.reservation_date === cell.dateStr && r.status === 'CONFIRMED')
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          // 해당 날짜의 차단 슬롯 목록
          const dayBlackouts = blackouts.filter((b) => b.blackout_date === cell.dateStr);

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`min-h-[220px] sm:min-h-[280px] p-1 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group bg-white hover:bg-blue-50/30 ${
                isToday ? 'bg-blue-50/20' : ''
              }`}
            >
              {/* 상단: 날짜 번호 및 뱃지 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isSaturday
                      ? 'text-blue-600'
                      : 'text-gray-800'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* 점검 일정 뱃지 */}
                {dayBlackouts.length > 0 && (
                  <span
                    className="text-[9px] sm:text-[10px] text-amber-700 font-medium px-0.5 sm:px-1 bg-amber-50 rounded flex items-center gap-0.5"
                    title={dayBlackouts.map((b) => b.reason).join(', ')}
                  >
                    <Ban className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">점검</span>
                  </span>
                )}
              </div>

              {/* 중앙: 예약 칩 리스트 (한 줄 표기) */}
              <div className="flex-1 space-y-1 sm:space-y-1.5 overflow-hidden py-1">
                {dayReservations.map((res) => {
                  const startHour = res.start_time.split(':')[0];
                  const endHour = res.end_time.split(':')[0];
                  const timeLabel = `${parseInt(startHour, 10)}-${parseInt(endHour, 10)}`;
                  const maskedName = formatDisplayMaskedName(res.masked_name);

                  const isStaff = res.user_category === '청년공간 근무자';
                  const chipBgClass = isStaff
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200';
                  const timeTextClass = isStaff ? 'text-blue-600' : 'text-purple-600';

                  return (
                    <div
                      key={res.id}
                      className={`${chipBgClass} border rounded-md px-1 py-0.5 shadow-2xs transition flex items-center justify-between gap-0.5 text-[10px] sm:text-[11px] font-semibold leading-tight`}
                      title={`[${res.user_category}] ${maskedName} (${res.start_time}~${res.end_time}) - ${res.purpose}`}
                    >
                      <span className="truncate">{maskedName}</span>
                      <span className={`${timeTextClass} text-[9px] sm:text-[10px] font-mono shrink-0`}>
                        {timeLabel}
                      </span>
                    </div>
                  );
                })}

                {/* 빈 날짜 안내 */}
                {dayReservations.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center py-4">
                    <span className="text-[10px] text-gray-400 group-hover:text-blue-600 transition">
                      +예약 가능
                    </span>
                  </div>
                )}
              </div>

              {/* 하단: 날짜 클릭 유도 */}
              <div className="text-[9px] text-gray-400 group-hover:text-blue-600 transition-colors pt-1 text-center sm:text-right">
                <span className="hidden sm:inline">상세보기</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* 4. 하단 친절한 이용 안내 및 소속별 칩 범례 */}
      <div className="p-3 sm:p-4 bg-gray-50/70 border-t border-gray-200 text-xs text-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            날짜를 클릭하면 <b>상세 시간표 확인</b> 및 <b>예약/취소</b>가 가능합니다. (일요일은 정기 휴무)
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-blue-600" />
            <span>청년공간 근무자 (파랑)</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-600" />
            <span>외부 상담사 (보라)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
