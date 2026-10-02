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
 * [WeeklyScheduleList.tsx] 7열(일 ~ 토) 주간 달력 그리드 컴포넌트
 * 
 * - 월간 달력과 완전히 동일한 일-토 7열 그리드 형태
 * - 선택된 1주일(일요일 ~ 토요일)만 시원하게 잘라서 표시
 * - 세로 높이가 넉넉하여 모바일에서도 예약자 이름(권x한)과 시간(14-15)이 잘리지 않고 한눈에 파악 가능
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

  // 기준 날짜가 속한 주의 일요일(시작일) 구하기
  const getSunday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0(일) ~ 6(토)
    const diff = date.getDate() - day; // 일요일로 이동
    return new Date(date.setDate(diff));
  };

  const sunday = getSunday(currentDate);

  // 이번 주 일요일 ~ 토요일 (7일) 배열 생성
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
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
    { label: '일', isSunday: true, isSaturday: false },
    { label: '월', isSunday: false, isSaturday: false },
    { label: '화', isSunday: false, isSaturday: false },
    { label: '수', isSunday: false, isSaturday: false },
    { label: '목', isSunday: false, isSaturday: false },
    { label: '금', isSunday: false, isSaturday: false },
    { label: '토', isSunday: false, isSaturday: true },
  ];

  // 이전 주 / 다음 주 / 이번 주 이동
  const handlePrevWeek = () => {
    const prev = new Date(sunday);
    prev.setDate(prev.getDate() - 7);
    onChangeDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(sunday);
    next.setDate(next.getDate() + 7);
    onChangeDate(next);
  };

  const handleThisWeek = () => {
    onChangeDate(new Date());
  };

  // 주간 헤더 타이틀 (예: 2026년 9월 27일 ~ 10월 3일)
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];
  const rangeTitle = `${firstDay.yearNumber}년 ${firstDay.monthNumber}월 ${firstDay.dayNumber}일 ~ ${
    firstDay.monthNumber !== lastDay.monthNumber ? `${lastDay.monthNumber}월 ` : ''
  }${lastDay.dayNumber}일`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      
      {/* 1. 상단 주간 네비게이션 헤더 */}
      <div className="p-3.5 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-2 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50">
        
        {/* 주차 범위 제목 및 이전/다음 버튼 */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={handlePrevWeek}
            type="button"
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="이전 주"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
            {rangeTitle}
          </h2>

          <button
            onClick={handleNextWeek}
            type="button"
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="다음 주"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 이번 주로 이동 & 예약 가이드 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleThisWeek}
            type="button"
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer"
          >
            이번 주로 이동
          </button>
          <div className="hidden md:inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>원하는 날짜를 클릭하면 시간표 확인 및 예약 가능</span>
          </div>
        </div>

      </div>

      {/* 2. 요일 헤더 (일 ~ 토) */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 text-center text-xs font-bold py-2 sm:py-2.5">
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

      {/* 3. 7열(일~토) 주간 달력 날짜 그리드 */}
      <div className="grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200">
        {weekDays.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSunday = cell.dayOfWeek === 0;
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
                      : isSunday
                      ? 'text-red-500'
                      : isSaturday
                      ? 'text-blue-600'
                      : 'text-gray-800'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* 일요일 정기 휴무 뱃지 */}
                {isSunday && (
                  <span className="text-[9px] sm:text-[10px] text-red-500 font-medium px-1 bg-red-50 rounded">
                    휴무
                  </span>
                )}
                {/* 점검 일정 뱃지 */}
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

              {/* 중앙: 예약 칩 리스트 (주간 뷰이므로 세로 공간이 넉넉함!) */}
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
                      className={`${chipBgClass} border rounded-lg p-1 text-center shadow-2xs transition`}
                      title={`[${res.user_category}] ${maskedName} (${res.start_time}~${res.end_time}) - ${res.purpose}`}
                    >
                      {/* 모바일: 2줄로 표시하여 이름/시간 절대 안 잘림 */}
                      <div className="sm:hidden flex flex-col items-center leading-tight">
                        <span className="text-[10px] font-bold truncate w-full">{maskedName}</span>
                        <span className={`${timeTextClass} text-[9px] font-mono mt-0.5`}>
                          {timeLabel}
                        </span>
                      </div>

                      {/* PC: 1줄 또는 2줄로 시원하게 표시 */}
                      <div className="hidden sm:flex items-center justify-between gap-1 text-[11px] font-semibold">
                        <span className="truncate">{maskedName}</span>
                        <span className={`${timeTextClass} text-[10px] font-mono shrink-0`}>
                          {timeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* 빈 날짜 안내 */}
                {!isSunday && dayReservations.length === 0 && (
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
            날짜를 클릭하면 <b>상세 시간표 확인</b> 및 <b>예약/취소</b>가 가능합니다.
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
