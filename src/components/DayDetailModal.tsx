'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Ban,
  CalendarPlus,
  Sparkles,
  KeyRound,
  AlertCircle,
  RotateCcw,
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
  onRefresh?: () => void; // 예약 취소 시 데이터 새로고침 콜백
}

/**
 * ==============================================================================
 * [DayDetailModal.tsx] 날짜별 시간대 상세 현황 및 간편 예약/취소 패널
 * 
 * - 선택한 날짜의 1시간 단위 전체 슬롯(11:00 ~ 21:00)을 순서대로 표출
 * - 어느 시간에 누가(권x한) 예약했는지 명확히 파악
 * - 비어 있는 시간대: [예약하기] 버튼을 눌러 바로 예약 신청
 * - 이미 예약된 시간대: [취소] 버튼을 눌러 그 자리에서 4자리 비밀번호 입력 후 즉시 취소!
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
  onRefresh,
}: DayDetailModalProps) {
  // 예약 취소 팝업 상태 관리
  const [cancelingTarget, setCancelingTarget] = useState<PublicReservation | null>(null);
  const [cancelPassword, setCancelPassword] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');

  if (!isOpen || !date) return null;

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0: 일요일, 6: 토요일
  const isSunday = dayOfWeek === 0;

  // 해당 요일 운영 시간대 계산 (5글자 HH:mm 정규화)
  const rawOpenTime = dayOfWeek === 6 ? settings.saturday_open : settings.weekday_open;
  const rawCloseTime = dayOfWeek === 6 ? settings.saturday_close : settings.weekday_close;

  const openTimeStr = (rawOpenTime || '11:00').slice(0, 5);
  const closeTimeStr = (rawCloseTime || '21:00').slice(0, 5);

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

  // 취소 실행 핸들러
  const handleExecuteCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingTarget) return;

    if (!cancelPassword || cancelPassword.length !== 4) {
      setCancelError('예약 시 설정한 4자리 비밀번호를 입력해 주세요.');
      return;
    }

    setIsCanceling(true);
    setCancelError('');

    try {
      const res = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: cancelingTarget.id,
          password: cancelPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCancelError(data.message || '비밀번호가 올바르지 않습니다.');
        setIsCanceling(false);
        return;
      }

      setCancelSuccessMsg('예약이 성공적으로 취소되었습니다!');
      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => {
        setCancelingTarget(null);
        setCancelPassword('');
        setCancelSuccessMsg('');
        setIsCanceling(false);
      }, 1200);
    } catch (err) {
      console.error('취소 오류:', err);
      setCancelError('서버와의 통신에 실패했습니다.');
      setIsCanceling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150 relative">
        
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
                        ? reservedItem.user_category === '청년공간 근무자'
                          ? 'bg-blue-50/40 border-blue-200/90'
                          : 'bg-purple-50/40 border-purple-200/90'
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
                          <span className="text-[11px] text-gray-600 truncate max-w-[160px]" title={reservedItem.purpose}>
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

                    {/* 우측: 액션 버튼 (예약하기 또는 이 자리에서 취소하기) */}
                    <div className="shrink-0 flex items-center gap-2">
                      {reservedItem ? (
                        <button
                          onClick={() => {
                            setCancelingTarget(reservedItem);
                            setCancelPassword('');
                            setCancelError('');
                            setCancelSuccessMsg('');
                          }}
                          type="button"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg transition cursor-pointer shadow-2xs"
                          title="4자리 비밀번호 입력 후 예약 취소"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>취소하기</span>
                        </button>
                      ) : blackoutItem ? (
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
            <span>본인의 예약은 우측 [취소하기] 버튼을 눌러 4자리 암호로 언제든 직접 취소할 수 있습니다.</span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 cursor-pointer"
          >
            닫기
          </button>
        </div>

        {/* ============================================================================== */}
        {/* [내부 팝업] 그 자리에서 바로 비밀번호 입력하고 예약 취소하는 모달 */}
        {/* ============================================================================== */}
        {cancelingTarget && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-gray-100">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>예약 취소 확인</span>
                </div>
                <button
                  onClick={() => setCancelingTarget(null)}
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cancelSuccessMsg ? (
                <div className="py-4 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-gray-900">{cancelSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleExecuteCancel} className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 border border-gray-200">
                    <div className="text-gray-500">취소 대상 예약:</div>
                    <div className="font-bold text-gray-900">
                      [{cancelingTarget.user_category}] {formatDisplayMaskedName(cancelingTarget.masked_name)}
                    </div>
                    <div className="text-blue-600 font-medium">
                      {cancelingTarget.start_time} ~ {cancelingTarget.end_time} ({cancelingTarget.purpose})
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      예약 시 설정한 비밀번호 (숫자 4자리)
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      maxLength={4}
                      placeholder="숫자 4자리 입력"
                      value={cancelPassword}
                      onChange={(e) => setCancelPassword(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden tracking-widest text-center text-sm font-bold"
                    />
                  </div>

                  {cancelError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cancelError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCancelingTarget(null)}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs transition cursor-pointer"
                    >
                      돌아가기
                    </button>
                    <button
                      type="submit"
                      disabled={isCanceling}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                    >
                      {isCanceling ? '취소 중...' : '예약 취소'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
