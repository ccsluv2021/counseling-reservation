'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  PlusCircle,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { PublicReservation, BlackoutSlot, SpaceSettings } from '@/types/reservation';
import { formatDate } from '@/lib/utils';
import { formatDisplayMaskedName } from '@/lib/crypto';

interface WeeklyScheduleListProps {
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
 * [WeeklyScheduleList.tsx] 주간 세로 카드 일정 목록 컴포넌트
 * 
 * - 스마트폰(모바일)에서 한 손으로 스크롤하며 이번 주 일정을 시원하게 확인할 수 있는 뷰
 * - 각 날짜별로 예약자(이름, 소속, 시간)와 비어 있는 시간대 및 예약 바로가기 제공
 * ==============================================================================
 */
export default function WeeklyScheduleList({
  currentDate,
  onChangeDate,
  reservations,
  blackouts,
  settings,
  onSelectDate,
  onOpenReservationModal,
}: WeeklyScheduleListProps) {
  const todayStr = formatDate(new Date());

  // 현재 기준 날짜가 속한 주의 월요일 구하기
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 지난 월요일
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentDate);

  // 이번 주 월~일 (7일) 배열 생성
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dateObj: d,
      dateStr: formatDate(d),
      dayOfWeek: d.getDay(),
      dayNumber: d.getDate(),
      monthNumber: d.getMonth() + 1,
    };
  });

  const weekDayNames = ['일', '월', '화', '수', '목', '금', '토'];

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

  // 주간 범위 타이틀 (예: 2026.10.01(목) ~ 10.07(수))
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];
  const rangeTitle = `${firstDay.dateObj.getFullYear()}년 ${firstDay.monthNumber}월 ${firstDay.dayNumber}일 ~ ${lastDay.monthNumber}월 ${lastDay.dayNumber}일`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      
      {/* 1. 상단 주간 네비게이션 헤더 */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50">
        
        {/* 주간 네비게이션 버튼 및 범위 타이틀 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePrevWeek}
            type="button"
            className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            title="이전 주"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
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

        {/* 이번 주로 이동 버튼 */}
        <div className="flex items-center justify-end">
          <button
            onClick={handleThisWeek}
            type="button"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer"
          >
            이번 주로 이동
          </button>
        </div>

      </div>

      {/* 2. 요일별 세로 카드 목록 */}
      <div className="divide-y divide-gray-100 p-3 sm:p-4 space-y-3">
        {weekDays.map((day) => {
          const isToday = day.dateStr === todayStr;
          const isSunday = day.dayOfWeek === 0;
          const isSaturday = day.dayOfWeek === 6;

          // 해당 날짜의 예약 목록 필터링
          const dayReservations = reservations
            .filter((r) => r.reservation_date === day.dateStr && r.status === 'CONFIRMED')
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          // 해당 날짜의 점검/차단 슬롯
          const dayBlackouts = blackouts.filter((b) => b.blackout_date === day.dateStr);

          // 운영 시간 정보
          const openHour = 11;
          const closeHour = isSaturday ? 19 : 21;

          return (
            <div
              key={day.dateStr}
              className={`rounded-xl border transition-all p-3.5 sm:p-4 ${
                isToday
                  ? 'border-blue-300 bg-blue-50/20 shadow-xs'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isSunday
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : isSaturday
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {day.monthNumber}월 {day.dayNumber}일 ({weekDayNames[day.dayOfWeek]})
                  </span>
                  
                  {isToday && (
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      오늘
                    </span>
                  )}
                  {isSunday && (
                    <span className="text-[11px] font-bold text-red-600 bg-red-100/70 px-2 py-0.5 rounded-full">
                      정기 휴무
                    </span>
                  )}
                  {dayBlackouts.length > 0 && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      점검 일정
                    </span>
                  )}
                </div>

                {/* 날짜 상세 팝업 열기 버튼 */}
                {!isSunday && (
                  <button
                    onClick={() => onSelectDate(day.dateStr)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>시간표 전체보기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 본문: 예약 내역 또는 비어 있음 안내 */}
              <div className="pt-3">
                {isSunday ? (
                  <p className="text-xs text-gray-400 py-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    일요일은 상담실 정기 휴무일입니다.
                  </p>
                ) : dayReservations.length === 0 ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>현재 예약된 일정이 없습니다. ({openHour}:00 ~ {closeHour}:00 전 시간 예약 가능)</span>
                    </p>
                    <button
                      onClick={() => onOpenReservationModal(day.dateStr, 14)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>예약하기</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* 예약 목록 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dayReservations.map((res) => {
                        const isStaff = res.user_category === '청년공간 근무자';
                        const maskedName = formatDisplayMaskedName(res.masked_name);
                        const chipBgClass = isStaff
                          ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                          : 'bg-purple-50/80 border-purple-200 text-purple-900';
                        const badgeClass = isStaff
                          ? 'bg-blue-600 text-white'
                          : 'bg-purple-600 text-white';

                        return (
                          <div
                            key={res.id}
                            onClick={() => onSelectDate(day.dateStr)}
                            className={`${chipBgClass} border rounded-xl p-2.5 flex items-center justify-between gap-2 transition hover:shadow-2xs cursor-pointer`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`${badgeClass} text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0`}>
                                {res.user_category}
                              </span>
                              <span className="font-bold text-xs truncate">
                                {maskedName}
                              </span>
                            </div>
                            <div className="text-xs font-mono font-semibold shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{res.start_time.slice(0, 5)} ~ {res.end_time.slice(0, 5)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 추가 예약 버튼 */}
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onOpenReservationModal(day.dateStr, 14)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>이 날짜에 추가 예약하기</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. 하단 안내 및 범례 */}
      <div className="p-4 bg-gray-50/70 border-t border-gray-200 text-xs text-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span>카드를 클릭하면 해당 일자의 상세 시간표 확인 및 예약 취소가 가능합니다.</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>청년공간 근무자</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span>외부 상담사</span>
          </div>
        </div>
      </div>

    </div>
  );
}
