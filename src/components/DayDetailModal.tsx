'use client';

import React from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Ban,
  CalendarPlus,
  Sparkles,
} from 'lucide-react';
import { PublicReservation, BlackoutSlot, SpaceSettings } from '@/types/reservation';
import { formatKoreanDate } from '@/lib/utils';
import { formatDisplayMaskedName } from '@/lib/crypto';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  reservations: PublicReservation[];
  blackouts: BlackoutSlot[];
  settings: SpaceSettings;
  onOpenReservationModal: (date: string, hour: number) => void;
}

/**
 * ==============================================================================
 * [DayDetailModal.tsx] 날짜별 시간대 상세 현황 및 간편 예약 패널
 * 
 * - 선택한 날짜의 1시간 단위 전체 슬롯(11:00 ~ 21:00)을 순서대로 표출
 * - 어느 시간에 누가(권x한) 예약했는지 명확히 파악
 * - 비어 있는 시간대의 [예약하기] 버튼을 눌러 바로 예약 신청 폼으로 연결
 * ==============================================================================
 */
export default function DayDetailModal({
  isOpen,
  onClose,
  date,
  reservations,
  blackouts,
  settings,
  onOpenReservationModal,
}: DayDetailModalProps) {
  if (!isOpen || !date) return null;

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0: 일요일, 6: 토요일
  const isSunday = dayOfWeek === 0;

  // 해당 요일 운영 시간대 계산
  const openTimeStr = dayOfWeek === 6 ? settings.saturday_open : settings.weekday_open;
  const closeTimeStr = dayOfWeek === 6 ? settings.saturday_close : settings.weekday_close;

  const openHour = parseInt(openTimeStr.split(':')[0], 10);
  const closeHour = parseInt(closeTimeStr.split(':')[0], 10);

  // 1시간 단위 슬롯 배열 (예: 11 ~ 20)
  const timeSlots = Array.from({ length: Math.max(0, closeHour - openHour) }).map(
    (_, idx) => openHour + idx
  );

  // 해당 일자의 확정된 예약들만 필터링
  const dayReservations = reservations.filter(
    (r) => r.reservation_date === date && r.status === 'CONFIRMED'
  );

  // 해당 일자의 차단 슬롯들만 필터링
  const dayBlackouts = blackouts.filter((b) => b.blackout_date === date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {formatKoreanDate(date)} 예약 현황
                </h2>
                {isSunday && (
                  <span className="text-[11px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                    정기 휴무
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                운영 시간: {isSunday ? '운영 없음' : `${openTimeStr} ~ ${closeTimeStr}`} (1시간 단위 예약)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 슬롯 리스트 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {isSunday ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">일요일은 상담실 정기 휴무일입니다</h3>
              <p className="text-xs text-gray-500 mt-1">
                월요일부터 토요일까지의 시간대를 이용해 주세요.
              </p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              운영 시간이 설정되어 있지 않습니다.
            </div>
          ) : (
            <div className="space-y-2.5">
              {timeSlots.map((hour) => {
                const startStr = `${String(hour).padStart(2, '0')}:00`;
                const endStr = `${String(hour + 1).padStart(2, '0')}:00`;

                // 1) 해당 시간대에 예약이 있는지 검사
                const reservedItem = dayReservations.find(
                  (r) => r.start_time <= startStr && r.end_time >= endStr
                );

                // 2) 해당 시간대에 관리자 차단이 있는지 검사
                const blackoutItem = dayBlackouts.find(
                  (b) => b.start_time <= startStr && b.end_time >= endStr
                );

                return (
                  <div
                    key={hour}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all ${
                      reservedItem
                        ? 'bg-blue-50/40 border-blue-200/80'
                        : blackoutItem
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {/* 좌측: 시간대 표기 */}
                    <div className="flex items-center gap-3 min-w-[125px]">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center">
                        {hour}시
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        {startStr} ~ {endStr}
                      </span>
                    </div>

                    {/* 중앙: 상세 상태 (예약자 또는 상태) */}
                    <div className="flex-1 px-3">
                      {reservedItem ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 소속별 칩 분기 (근무자: 파랑, 외부 상담사: 보라) */}
                          {reservedItem.user_category === '청년공간 근무자' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100/90 px-2.5 py-1 rounded-md border border-blue-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>{formatDisplayMaskedName(reservedItem.masked_name)}</span>
                              <span className="text-blue-600 font-medium text-[11px]">
                                ({reservedItem.start_time.slice(0, 2)}-{reservedItem.end_time.slice(0, 2)})
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100/90 px-2.5 py-1 rounded-md border border-purple-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                              <span>{formatDisplayMaskedName(reservedItem.masked_name)}</span>
                              <span className="text-purple-600 font-medium text-[11px]">
                                ({reservedItem.start_time.slice(0, 2)}-{reservedItem.end_time.slice(0, 2)})
                              </span>
                            </span>
                          )}
                          <span className="text-[11px] text-gray-600 truncate max-w-[180px]">
                            {reservedItem.purpose}
                          </span>
                        </div>
                      ) : blackoutItem ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Ban className="w-3.5 h-3.5 text-gray-400" />
                          <span>[시설 점검] {blackoutItem.reason}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>비어 있음 (예약 가능)</span>
                        </div>
                      )}
                    </div>

                    {/* 우측: 액션 버튼 */}
                    <div className="shrink-0">
                      {reservedItem || blackoutItem ? (
                        <span className="text-xs text-gray-400 font-medium px-3 py-1.5">
                          예약 불가
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenReservationModal(date, hour);
                          }}
                          type="button"
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
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

        {/* 하단 안내 푸터 */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>원하는 빈 시간의 [예약하기]를 누르면 최대 3시간까지 연속 예약 가능합니다.</span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
