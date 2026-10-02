'use client';

import React, { useState } from 'react';
import { X, KeyRound, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { PublicReservation } from '@/types/reservation';
import { formatKoreanDate } from '@/lib/utils';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeReservations: PublicReservation[];
  onCancelSuccess: () => void;
}

/**
 * ==============================================================================
 * [CancelModal.tsx] 내 예약 취소 팝업 모달
 * 
 * - 취소할 예약 선택
 * - 예약 시 등록했던 간이 비밀번호(4자리) 입력 검증
 * - 예약 즉시 취소 처리 및 상태 동기화
 * ==============================================================================
 */
export default function CancelModal({
  isOpen,
  onClose,
  activeReservations,
  onCancelSuccess,
}: CancelModalProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // 예약 취소 핸들러
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedId) {
      setErrorMessage('취소할 예약을 목록에서 선택해 주세요.');
      return;
    }
    if (!password || password.length !== 4) {
      setErrorMessage('예약 시 입력했던 4자리 비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: selectedId,
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || '비밀번호가 올바르지 않거나 취소에 실패했습니다.');
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      onCancelSuccess();
    } catch (err) {
      console.error('취소 요청 오류:', err);
      setErrorMessage('서버와의 통신에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    setSelectedId('');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50/50 to-white">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">내 예약 취소하기</h2>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 컨텐츠 */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">예약이 취소되었습니다</h3>
                <p className="text-xs text-gray-500 mt-1">
                  해당 시간대가 다시 빈 슬롯으로 전환되어 다른 이용자가 예약할 수 있습니다.
                </p>
              </div>
              <button
                onClick={handleClose}
                type="button"
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl text-sm transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          ) : (
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  예약 시 입력하셨던 <b>4자리 비밀번호</b>를 입력하시면 즉시 본인 확인 후 취소됩니다.
                </span>
              </div>

              {/* 1. 취소 대상 예약 선택 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  취소할 예약 선택
                </label>
                {activeReservations.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
                    현재 조회된 날짜 범위에 취소 가능한 예약이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeReservations.map((res) => {
                      const isSelected = selectedId === res.id;
                      return (
                        <div
                          key={res.id}
                          onClick={() => setSelectedId(res.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                            isSelected
                              ? 'border-red-500 bg-red-50/50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{formatKoreanDate(res.reservation_date)}</span>
                              <span className="text-blue-600">
                                {res.start_time} ~ {res.end_time}
                              </span>
                            </div>
                            <div className="text-gray-500 mt-0.5">
                              [{res.user_category}] {res.masked_name} - {res.purpose}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="selectedReservation"
                            checked={isSelected}
                            onChange={() => setSelectedId(res.id)}
                            className="text-red-600"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. 비밀번호 입력 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  예약 취소 비밀번호 (숫자 4자리)
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="예약 시 설정한 4자리"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden tracking-widest"
                />
              </div>

              {/* 에러 메시지 */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              {/* 취소 실행 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting || activeReservations.length === 0}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                {isSubmitting ? '취소 처리 중...' : '선택한 예약 취소하기'}
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
