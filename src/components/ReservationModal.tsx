'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { UserCategory, CreateReservationDto, PublicReservation } from '@/types/reservation';
import { formatKoreanDate } from '@/lib/utils';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  startHour: number; // 14
  existingReservations: PublicReservation[];
  onReservationSuccess: () => void;
}

/**
 * ==============================================================================
 * [ReservationModal.tsx] 간편 예약 신청 팝업 모달
 * 
 * - 시작 시간 및 연속 시간(1~3시간) 선택
 * - 소속, 이름, 암호화 대상 연락처, 목적, 간이 암호 4자리 입력
 * - 실시간 예약 중복 방지 및 성공 결과 피드백 제공
 * ==============================================================================
 */
export default function ReservationModal({
  isOpen,
  onClose,
  date,
  startHour,
  existingReservations,
  onReservationSuccess,
}: ReservationModalProps) {
  // 폼 입력 상태
  const [durationHours, setDurationHours] = useState<number>(1);
  const [userCategory, setUserCategory] = useState<UserCategory>('외부 상담사');
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [password, setPassword] = useState('');

  // 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // 시작 시간 및 종료 시간 문자열
  const startTimeStr = `${String(startHour).padStart(2, '0')}:00`;
  const endTimeStr = `${String(startHour + durationHours).padStart(2, '0')}:00`;

  // 휴대폰 번호 자동 하이픈 포맷팅
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 3 && raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length > 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  // 예약 신청 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 유효성 검사
    if (!userName.trim() || userName.trim().length < 2) {
      setErrorMessage('예약자 성함을 2글자 이상 정확히 입력해 주세요.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('올바른 휴대폰 번호(10~11자리)를 입력해 주세요.');
      return;
    }
    if (!purpose.trim()) {
      setErrorMessage('상담실 사용 목적을 입력해 주세요.');
      return;
    }
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      setErrorMessage('예약 취소용 비밀번호는 숫자 4자리로 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateReservationDto = {
        reservation_date: date,
        start_time: startTimeStr,
        end_time: endTimeStr,
        user_category: userCategory,
        user_name: userName.trim(),
        phone: phone.trim(),
        purpose: purpose.trim(),
        password: password.trim(),
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || '예약 신청 중 오류가 발생했습니다.');
        setIsSubmitting(false);
        return;
      }

      // 예약 성공
      setIsSuccess(true);
      onReservationSuccess();
    } catch (err) {
      console.error('예약 제출 오류:', err);
      setErrorMessage('네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 및 초기화
  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage('');
    setUserName('');
    setPhone('');
    setPurpose('');
    setPassword('');
    setDurationHours(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">상담실 예약 신청</h2>
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
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {isSuccess ? (
            // [예약 성공 화면]
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">예약이 확정되었습니다!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  일정이 캘린더에 즉시 등록되었습니다.
                </p>
              </div>

              {/* 예약 요약 카드 */}
              <div className="bg-gray-50 rounded-xl p-4 text-left text-xs space-y-2 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-500">예약 일자:</span>
                  <span className="font-semibold text-gray-800">{formatKoreanDate(date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">이용 시간:</span>
                  <span className="font-semibold text-blue-600">
                    {startTimeStr} ~ {endTimeStr} ({durationHours}시간)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">예약자:</span>
                  <span className="font-semibold text-gray-800">{userName} ({userCategory})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">취소 비밀번호:</span>
                  <span className="font-bold text-indigo-600 tracking-wider">●●●● (4자리)</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs text-left">
                💡 <b>안내:</b> 예약을 취소하시려면 상단 헤더의 <b>[내 예약 취소]</b> 메뉴에서 설정하신 4자리 비밀번호를 입력하시면 언제든 직접 취소할 수 있습니다.
              </div>

              <button
                onClick={handleClose}
                type="button"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition cursor-pointer"
              >
                확인 및 캘린더 보기
              </button>
            </div>
          ) : (
            // [예약 입력 폼]
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 날짜 및 시간 요약 배너 */}
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-semibold">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{formatKoreanDate(date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{startTimeStr} ~ {endTimeStr}</span>
                </div>
              </div>

              {/* 1. 이용 시간(연속 시간) 선택 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  이용 시간 선택 (최대 3시간)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((hours) => {
                    const isSelected = durationHours === hours;
                    return (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => setDurationHours(hours)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {hours}시간 ({hours * 60}분)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 소속 구분 선택 (청년공간 근무자 / 외부 상담사) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  예약자 소속 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserCategory('청년공간 근무자')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      userCategory === '청년공간 근무자'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    청년공간 근무자 (파랑)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserCategory('외부 상담사')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      userCategory === '외부 상담사'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    외부 상담사 (보라)
                  </button>
                </div>
              </div>

              {/* 3. 예약자 성함 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    예약자 성함 <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-500">
                    캘린더에는 <b>홍x동</b>으로 마스킹되어 안전하게 표시됩니다.
                  </span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="실명을 입력해 주세요 (예: 홍길동)"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4. 휴대폰 번호 (암호화 대상) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    휴대폰 번호 <span className="text-red-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    AES-256 양방향 암호화 저장
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    className="w-full pl-9 pr-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 5. 사용 목적 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  상담실 사용 목적 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="예: 청년 1:1 심리상담 2회차, 버크만 디브리핑 등"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 6. 취소용 비밀번호 (숫자 4자리) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    예약 취소용 비밀번호 (숫자 4자리) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-500">
                    본인 예약 취소 시 필요합니다
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="숫자 4자리 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-9 pr-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden tracking-widest"
                  />
                </div>
              </div>

              {/* 에러 메시지 표출 */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 제출 버튼 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer"
                >
                  {isSubmitting ? '예약 처리 중...' : '상담실 예약 신청하기'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
