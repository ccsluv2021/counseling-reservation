'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Ban,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import {
  PublicReservation,
  BlackoutSlot,
  SpaceSettings,
} from '@/types/reservation';
import { formatDate, formatKoreanDate, getCategoryBadgeClass } from '@/lib/utils';

interface CalendarTimelineProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  reservations: PublicReservation[];
  blackouts: BlackoutSlot[];
  settings: SpaceSettings;
  onOpenReservationModal: (date: string, hour: number) => void;
}

/**
 * ==============================================================================
 * [CalendarTimeline.tsx] 타임라인 및 일별 예약 현황 컴포넌트
 * 
 * - 오늘 기준 전후 날짜 선택 네비게이션
 * - 운영 시간(평일 11:00~21:00, 토 11:00~19:00)에 따른 1시간 단위 타임슬롯 표출
 * - 예약 현황, 차단(블랙아웃), 마스킹된 예약자 성함(홍*동), 상담 목적을 시각화
 * ==============================================================================
 */
export default function CalendarTimeline({
  selectedDate,
  onSelectDate,
  reservations,
  blackouts,
  settings,
  onOpenReservationModal,
}: CalendarTimelineProps) {
  // 선택된 날짜 객체
  const [year, month, day] = selectedDate.split('-').map(Number);
  const currentDateObj = new Date(year, month - 1, day);
  const dayOfWeek = currentDateObj.getDay(); // 0: 일요일, 6: 토요일
  const isSunday = dayOfWeek === 0;

  // 오늘 날짜 문자열
  const todayStr = formatDate(new Date());

  // 전일 / 익일 이동 핸들러
  const handlePrevDay = () => {
    const prev = new Date(currentDateObj);
    prev.setDate(prev.getDate() - 1);
    onSelectDate(formatDate(prev));
  };

  const handleNextDay = () => {
    const next = new Date(currentDateObj);
    next.setDate(next.getDate() + 1);
    onSelectDate(formatDate(next));
  };

  // 최근 14일(2주) 날짜 탭 생성 (빠른 날짜 이동)
  const quickDates = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = formatDate(d);
    const dDay = d.getDay();
    const isSun = dDay === 0;
    const isSat = dDay === 6;
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][dDay];

    return {
      dateStr,
      label,
      dayLabel,
      isSun,
      isSat,
      isToday: dateStr === todayStr,
    };
  });

  // 해당 요일의 운영 시간대 계산
  const openTimeStr = dayOfWeek === 6 ? settings.saturday_open : settings.weekday_open;
  const closeTimeStr = dayOfWeek === 6 ? settings.saturday_close : settings.weekday_close;

  const openHour = parseInt(openTimeStr.split(':')[0], 10);
  const closeHour = parseInt(closeTimeStr.split(':')[0], 10);

  // 1시간 단위 슬롯 배열 생성 (예: 11시 ~ 21시)
  const timeSlots = Array.from({ length: Math.max(0, closeHour - openHour) }).map(
    (_, idx) => openHour + idx
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
      
      {/* 1. 상단 날짜 네비게이션 바 */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* 현재 선택 날짜 & 이동 버튼 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevDay}
              type="button"
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
              title="이전 날짜"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatKoreanDate(selectedDate)}
                </span>
                {selectedDate === todayStr && (
                  <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    오늘
                  </span>
                )}
                {isSunday && (
                  <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                    정기 휴무
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                이용 가능 시간: {isSunday ? '운영 없음' : `${openTimeStr} ~ ${closeTimeStr}`} (1시간 단위 예약)
              </p>
            </div>

            <button
              onClick={handleNextDay}
              type="button"
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
              title="다음 날짜"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 오늘 바로가기 & 소속 범례 안내 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectDate(todayStr)}
              type="button"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
            >
              오늘로 이동
            </button>
          </div>

        </div>

        {/* 2. 빠른 날짜 선택 스크롤 탭 */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 no-scrollbar">
          {quickDates.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                type="button"
                className={`flex flex-col items-center justify-center min-w-[62px] py-2 px-1.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                <span
                  className={`text-xs ${
                    isSelected
                      ? 'text-blue-100'
                      : item.isSun
                      ? 'text-red-500'
                      : item.isSat
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }`}
                >
                  {item.dayLabel}
                </span>
                <span className="text-sm font-bold mt-0.5">{item.label}</span>
                {item.isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSelected ? 'bg-white' : 'bg-blue-600'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 소속 구분 색상 뱃지 범례 */}
      <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-semibold text-gray-700">소속 범례:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>청년공간 근무자</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>외부 상담사</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>버크만 디브리퍼</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span>점검/행사 차단</span>
        </div>
      </div>

      {/* 4. 시간대별 예약 타임라인 리스트 */}
      <div className="p-4 sm:p-6">
        {isSunday ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">일요일은 상담실 정기 휴무일입니다</h3>
            <p className="text-xs text-gray-500 mt-1">
              월요일부터 토요일까지의 시간대를 선택해 주세요.
            </p>
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            설정된 운영 시간이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {timeSlots.map((hour) => {
              const startStr = `${String(hour).padStart(2, '0')}:00`;
              const endStr = `${String(hour + 1).padStart(2, '0')}:00`;

              // 1) 해당 시간대에 예약이 있는지 검사
              const reservedItem = reservations.find(
                (r) =>
                  r.status === 'CONFIRMED' &&
                  r.start_time <= startStr &&
                  r.end_time >= endStr
              );

              // 2) 해당 시간대에 관리자 점검 차단이 있는지 검사
              const blackoutItem = blackouts.find(
                (b) => b.start_time <= startStr && b.end_time >= endStr
              );

              const badgeStyle = reservedItem
                ? getCategoryBadgeClass(reservedItem.user_category)
                : null;

              return (
                <div
                  key={hour}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-gray-200 transition-all hover:border-gray-300 bg-white"
                >
                  {/* 시간 라벨 */}
                  <div className="flex items-center gap-3 min-w-[140px] mb-2 sm:mb-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-xs">
                      {hour}시
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {startStr} ~ {endStr}
                      </span>
                    </div>
                  </div>

                  {/* 슬롯 상태 내용 */}
                  <div className="flex-1 sm:px-4">
                    {reservedItem ? (
                      // 예약 확정 슬롯
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 소속 뱃지 */}
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${badgeStyle?.bg}`}
                          >
                            {reservedItem.user_category}
                          </span>
                          {/* 마스킹된 예약자 이름 (홍*동) */}
                          <span className="text-xs font-bold text-gray-800">
                            {reservedItem.masked_name}
                          </span>
                          <span className="text-gray-300">|</span>
                          {/* 사용 목적 */}
                          <span className="text-xs text-gray-600 truncate max-w-[280px]">
                            {reservedItem.purpose}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400 shrink-0">
                          {reservedItem.start_time} ~ {reservedItem.end_time} 예약됨
                        </span>
                      </div>
                    ) : blackoutItem ? (
                      // 관리자 차단 슬롯
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-100 text-gray-500 border border-gray-200">
                        <Ban className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium">
                          [시설 점검/행사] {blackoutItem.reason}
                        </span>
                      </div>
                    ) : (
                      // 빈 시간 슬롯
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                        <span>비어 있는 시간 (예약 가능)</span>
                      </div>
                    )}
                  </div>

                  {/* 우측 액션 버튼 */}
                  <div className="mt-2 sm:mt-0 shrink-0">
                    {reservedItem || blackoutItem ? (
                      <button
                        disabled
                        type="button"
                        className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                      >
                        예약 완료
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenReservationModal(selectedDate, hour)}
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition cursor-pointer"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>예약하기</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. 하단 친절한 이용 안내 배너 */}
      <div className="p-4 bg-blue-50/50 border-t border-blue-100 text-xs text-blue-800 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">예약 안내:</span> 원하는 시간의 [예약하기] 버튼을 누르면 시작 시간부터 1~3시간 연속으로 신청할 수 있습니다. 예약 완료 시 설정한 4자리 비밀번호로 언제든 직접 취소할 수 있습니다.
        </div>
      </div>

    </div>
  );
}
