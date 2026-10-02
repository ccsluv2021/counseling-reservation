'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import DayDetailModal from '@/components/DayDetailModal';
import ReservationModal from '@/components/ReservationModal';
import CancelModal from '@/components/CancelModal';
import AdminLoginModal from '@/components/AdminLoginModal';
import { PublicReservation, BlackoutSlot, SpaceSettings } from '@/types/reservation';
import { formatDate } from '@/lib/utils';
import { Sparkles, CheckCircle2, Info, Calendar } from 'lucide-react';

/**
 * ==============================================================================
 * [page.tsx] 청년공간 1:1 상담실 예약 시스템 메인 페이지
 * 
 * - 월간 달력(Monthly Grid) 기반 직관적인 예약 현황 조망
 * - 파란색 칩으로 '권x한 11-12' 형태의 예약자 및 시간대 한눈에 확인
 * - 날짜 클릭 시 시간대별 상세 현황 확인 및 비어 있는 시간 즉시 예약
 * - 개인정보 안심 마스킹(홍x동) 및 AES-256 암호화 보호 적용
 * ==============================================================================
 */
export default function Home() {
  // 1. 현재 표시 중인 기준 년/월
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  // 2. 예약 데이터 및 설정 상태
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutSlot[]>([]);
  const [settings, setSettings] = useState<SpaceSettings>({
    id: 1,
    space_name: '청년공간 1:1 상담실',
    weekday_open: '11:00',
    weekday_close: '21:00',
    saturday_open: '11:00',
    saturday_close: '19:00',
    closed_days: [0],
    max_continuous_hours: 3,
    max_advance_days: 28,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 3. 모달 상태
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationDate, setReservationDate] = useState<string>(() => formatDate(new Date()));
  const [reservationHour, setReservationHour] = useState(14);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // 4. 현재 표시 중인 월 기준 전후 15일 범위의 예약 데이터 조회
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      // 해당 월 시작일 전후 여유를 두어 이전 달 말일/다음 달 초일 데이터까지 한 번에 로드
      const start = new Date(year, month - 1, 20);
      const end = new Date(year, month + 2, 10);

      const startStr = formatDate(start);
      const endStr = formatDate(end);

      const res = await fetch(`/api/reservations?startDate=${startStr}&endDate=${endStr}`);
      const data = await res.json();

      if (data.success) {
        setReservations(data.reservations || []);
        setBlackouts(data.blackouts || []);
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('예약 데이터 로딩 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // 달력에서 날짜 클릭 시 상세 패널 열기
  const handleSelectDate = (dateStr: string) => {
    setSelectedDayForDetail(dateStr);
  };

  // 상세 패널에서 [예약하기] 버튼 클릭 시 예약 입력 모달 열기
  const handleOpenReservationModal = (dateStr: string, hour: number) => {
    setReservationDate(dateStr);
    setReservationHour(hour);
    setIsReservationOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 상단 공통 헤더 */}
      <Header
        onOpenCancelModal={() => setIsCancelOpen(true)}
        onOpenAdminModal={() => setIsAdminLoginOpen(true)}
      />

      {/* 메인 본문 컨테이너 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* 상단 소개 및 안심 배너 */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold text-white mb-1 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>청년공간 1:1 상담실 월간 예약 시스템</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                원하는 날짜를 선택하여 실시간으로 상담실을 예약하세요
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-2xl">
                별도의 회원가입 없이 링크를 통해 간편하게 예약할 수 있습니다. 
                협업 관계자 간 일정 확인을 위해 캘린더에는 <b>성함 가운데가 마스킹(권x한 11-12)</b>되어 안전하게 표기됩니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>개인정보 안심 보호</span>
                </div>
                <div className="text-blue-100 text-[11px]">
                  내담자 정보 미수집 · 연락처 AES-256 암호화
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 월간 달력 그리드 컴포넌트 */}
        <MonthlyCalendar
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          reservations={reservations}
          blackouts={blackouts}
          onSelectDate={handleSelectDate}
        />

        {/* 하단 공간 이용 수칙 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <span>상담실 이용 안내 및 운영 수칙</span>
          </h3>
          <ul className="text-xs text-gray-600 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <b>운영 시간:</b> 평일(월~금) 11:00 ~ 21:00 / 토요일 11:00 ~ 19:00 (일요일 및 법정 공휴일 정기 휴무)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <b>이용 대상:</b> 청년공간 상주 근무자, 위촉 외부 상담사에 한하여 단독 예약 및 사용 가능
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <b>예약 및 취소:</b> 1회 최대 3시간까지 연속 예약이 가능하며, 부득이한 일정 변경 시 상단 <b>[내 예약 취소]</b> 메뉴에서 본인의 4자리 암호로 직접 취소 후 다시 예약해 주세요.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <b>퇴실 안내:</b> 다음 상담사를 위해 사용 후 상담실 내 비품 정리 및 소등, 환기를 부탁드립니다.
              </span>
            </li>
          </ul>
        </div>

      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <p>© 2026 청년공간 상담실 예약 시스템. All rights reserved.</p>
        <p className="mt-1 text-gray-400">
          청년공간 근무자 · 외부 상담사 안전 예약 플랫폼
        </p>
      </footer>

      {/* 1. 날짜 클릭 시 상세 시간표 및 빈 시간 예약 패널 */}
      <DayDetailModal
        isOpen={Boolean(selectedDayForDetail)}
        onClose={() => setSelectedDayForDetail(null)}
        date={selectedDayForDetail || ''}
        reservations={reservations}
        blackouts={blackouts}
        settings={settings}
        onOpenReservationModal={handleOpenReservationModal}
      />

      {/* 2. 예약 신청 모달 */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        date={reservationDate}
        startHour={reservationHour}
        existingReservations={reservations}
        onReservationSuccess={() => {
          fetchReservations();
          // 상세 모달도 최신 데이터로 갱신하기 위해 유지
        }}
      />

      {/* 3. 내 예약 취소 모달 */}
      <CancelModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        activeReservations={reservations}
        onCancelSuccess={fetchReservations}
      />

      {/* 4. 관리자 로그인 모달 */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
      />

    </div>
  );
}
