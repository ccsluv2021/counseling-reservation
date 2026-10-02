'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import WeeklyScheduleList from '@/components/WeeklyScheduleList';
import DayDetailModal from '@/components/DayDetailModal';
import ReservationModal from '@/components/ReservationModal';
import { PublicReservation, BlackoutSlot, SpaceSettings } from '@/types/reservation';
import { formatDate } from '@/lib/utils';
import { Sparkles, Info, Clock, Calendar as CalendarIcon, CalendarDays } from 'lucide-react';

/**
 * ==============================================================================
 * [page.tsx] 청춘스럽 1:1 상담실 예약 시스템 메인 페이지
 * 
 * - 상단: 청춘스럽 공식 로고 및 예약가능시간 카드 배너
 * - 보기 모드: [월간 달력] ↔ [주간 달력] 일-토 그리드 기반 전환
 *   1) 월간 달력: 1달 전체를 조망 (모바일에서는 위:이름/아래:시간 2줄 칩으로 가독성 확보)
 *   2) 주간 달력: 이번 주(일~토 7칸)만 시원하게 잘라 여유롭게 확인
 * - 날짜 클릭 시 시간대별 상세 현황 확인, 예약 및 취소 가능
 * ==============================================================================
 */
export default function Home() {
  // 1. 보기 모드 상태 ('monthly': 월간 달력, 'weekly': 주간 달력)
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  // 2. 기준 날짜 상태
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() => new Date());

  // 3. 예약 데이터 및 설정 상태
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutSlot[]>([]);
  const [settings, setSettings] = useState<SpaceSettings>({
    id: 1,
    space_name: '청춘스럽 1:1 상담실',
    weekday_open: '11:00',
    weekday_close: '21:00',
    saturday_open: '11:00',
    saturday_close: '19:00',
    closed_days: [0],
    max_continuous_hours: 3,
    max_advance_days: 28,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 4. 모달 상태
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationDate, setReservationDate] = useState<string>(() => formatDate(new Date()));
  const [reservationHour, setReservationHour] = useState(14);

  // 5. 예약 데이터 조회 (전후 범위)
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const baseDate = viewMode === 'monthly' ? currentMonth : currentWeekDate;
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();

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
  }, [viewMode, currentMonth, currentWeekDate]);

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
      
      {/* 상단 청춘스럽 공식 헤더 */}
      <Header />

      {/* 메인 본문 컨테이너 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">
        
        {/* 상단 소개 및 예약가능시간 배너 (좌우 2단 배치) */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-5 sm:p-7 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            
            {/* 좌측 영역: 타이틀 및 안내 */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold text-white backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>청춘스럽 1:1 상담실 예약 시스템</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                원하는 날짜를 선택하여 실시간으로 상담실을 예약하세요
              </h2>

              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                날짜를 클릭하면 시간대별 예약 현황 확인 및 즉시 예약·취소가 가능합니다.
              </p>
            </div>

            {/* 우측 영역: 예약가능시간 카드 */}
            <div className="shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shadow-inner w-full md:w-64">
                <div className="flex items-center gap-1.5 font-bold text-blue-100 mb-2.5 text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-blue-200" />
                  <span>예약가능시간</span>
                </div>
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-3 py-1 border-b border-white/10">
                    <span className="font-semibold text-blue-200">월 - 금</span>
                    <span className="font-bold font-mono text-white">11:00 - 21:00</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="font-semibold text-blue-200">토</span>
                    <span className="font-bold font-mono text-white">11:00 - 19:00</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-blue-200/90 text-right">
                  ※ 일요일 및 공휴일 휴관
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 보기 모드 전환 탭 ([월간 달력] / [주간 달력]) */}
        {/* ------------------------------------------------------------- */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-white border border-gray-200 rounded-xl shadow-2xs">
            <button
              onClick={() => setViewMode('monthly')}
              type="button"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>월간 달력</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              type="button"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>주간 달력</span>
            </button>
          </div>

          <span className="text-[11px] text-gray-400 hidden sm:inline">
            {viewMode === 'monthly' ? '한 달 전체 일정을 달력으로 확인합니다.' : '이번 주 7일(일~토) 일정을 시원한 달력으로 확인합니다.'}
          </span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 보기 모드에 따른 7열 그리드 렌더링 */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'monthly' ? (
          <MonthlyCalendar
            currentMonth={currentMonth}
            onChangeMonth={setCurrentMonth}
            reservations={reservations}
            blackouts={blackouts}
            onSelectDate={handleSelectDate}
          />
        ) : (
          <WeeklyScheduleList
            currentDate={currentWeekDate}
            onChangeDate={setCurrentWeekDate}
            reservations={reservations}
            blackouts={blackouts}
            settings={settings}
            onSelectDate={handleSelectDate}
            onOpenReservationModal={handleOpenReservationModal}
          />
        )}

        {/* 하단 공간 이용 수칙 카드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs">
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
                <b>이용 대상:</b> 청춘스럽 상주 근무자, 위촉 외부 상담사에 한하여 단독 예약 및 사용 가능
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <b>예약 및 취소:</b> 1회 최대 3시간까지 연속 예약이 가능하며, 일정 변경 시 날짜를 클릭하여 해당 예약의 <b>[취소하기]</b> 버튼에서 직접 취소 후 다시 예약해 주세요.
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
        <p>© 2026 청춘스럽 상담실 예약 시스템. All rights reserved.</p>
        <p className="mt-1 text-gray-400">
          청춘스럽 근무자 · 외부 상담사 안전 예약 플랫폼
        </p>
      </footer>

      {/* 1. 날짜 클릭 시 상세 시간표 및 빈 시간 예약/취소 패널 */}
      <DayDetailModal
        isOpen={Boolean(selectedDayForDetail)}
        onClose={() => setSelectedDayForDetail(null)}
        date={selectedDayForDetail || ''}
        reservations={reservations}
        blackouts={blackouts}
        settings={settings}
        onOpenReservationModal={handleOpenReservationModal}
        onRefresh={fetchReservations}
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
        }}
      />

    </div>
  );
}
