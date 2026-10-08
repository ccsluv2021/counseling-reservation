'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  Download,
  Ban,
  Trash2,
  Settings,
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Lock,
} from 'lucide-react';
import { AdminReservation, BlackoutSlot, SpaceSettings } from '@/types/reservation';
import { formatKoreanDate } from '@/lib/utils';

/**
 * ==============================================================================
 * [admin/page.tsx] 청춘스럽 1:1 상담실 관리자 전용 대시보드
 * 
 * - 미인증 상태일 때 메인으로 튕기지 않고, 인라인 관리자 로그인 폼을 즉시 제공
 * - 비밀번호(기본: admin1234) 입력 후 성공 시 대시보드 전체 잠금 해제
 * - 전체 예약 목록(마스킹 해제된 원본 성함 및 복호화 연락처) 실시간 조회
 * - 엑셀(CSV) 다운로드, 시설 점검 차단(블랙아웃) 설정, 운영시간 설정
 * ==============================================================================
 */
export default function AdminDashboard() {
  const router = useRouter();

  // 인증 여부 상태 (기본 false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // 로그인 폼 상태
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 대시보드 데이터 상태
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutSlot[]>([]);
  const [settings, setSettings] = useState<SpaceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // 차단 슬롯 추가 폼 상태
  const [newBoDate, setNewBoDate] = useState('');
  const [newBoStart, setNewBoStart] = useState('11:00');
  const [newBoEnd, setNewBoEnd] = useState('13:00');
  const [newBoReason, setNewBoReason] = useState('');

  // 운영 시간 설정 폼 상태
  const [weekdayOpen, setWeekdayOpen] = useState('11:00');
  const [weekdayClose, setWeekdayClose] = useState('21:00');
  const [saturdayOpen, setSaturdayOpen] = useState('11:00');
  const [saturdayClose, setSaturdayClose] = useState('19:00');
  const [maxHours, setMaxHours] = useState(3);

  // 알림 토스트 메시지
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. 관리자 데이터 로드 (토큰 유효성 검증)
  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

      if (!token) {
        setIsAuthenticated(false);
        setAuthChecking(false);
        setIsLoading(false);
        return;
      }

      // 전체 예약 조회 요청
      const resRes = await fetch('/api/admin/reservations', {
        headers: { 'x-admin-token': token },
      });

      if (resRes.status === 401) {
        // 토큰이 만료되었거나 올바르지 않으면 로그인 화면 표시
        setIsAuthenticated(false);
        setAuthChecking(false);
        setIsLoading(false);
        return;
      }

      const resData = await resRes.json();
      if (resData.success) {
        setReservations(resData.reservations || []);
        setIsAuthenticated(true);
      }

      // 설정 및 차단 목록 조회
      const generalRes = await fetch('/api/reservations?startDate=2026-01-01&endDate=2027-12-31');
      const genData = await generalRes.json();
      if (genData.success) {
        setBlackouts(genData.blackouts || []);
        if (genData.settings) {
          setSettings(genData.settings);
          setWeekdayOpen(genData.settings.weekday_open);
          setWeekdayClose(genData.settings.weekday_close);
          setSaturdayOpen(genData.settings.saturday_open);
          setSaturdayClose(genData.settings.saturday_close);
          setMaxHours(genData.settings.max_continuous_hours);
        }
      }
    } catch (err) {
      console.error('관리자 데이터 로드 실패:', err);
      showToast('데이터를 불러오지 못했습니다.', 'error');
    } finally {
      setAuthChecking(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // 2. 인라인 로그인 제출 핸들러
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginPassword) {
      setLoginError('관리자 마스터 비밀번호를 입력해 주세요.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || '비밀번호가 올바르지 않습니다.');
        setIsLoggingIn(false);
        return;
      }

      // 토큰 저장 및 인증 상태 갱신
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
      }
      setIsAuthenticated(true);
      setLoginPassword('');
      showToast('관리자 인증에 성공했습니다.');
      loadAdminData();
    } catch (err) {
      console.error('로그인 에러:', err);
      setLoginError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. 로그아웃 핸들러
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    document.cookie = 'admin_token=; Max-Age=0; path=/;';
    setIsAuthenticated(false);
    showToast('로그아웃되었습니다.');
  };

  // 4. 관리자 직권 예약 취소
  const handleCancelReservation = async (reservationId: string) => {
    if (!window.confirm('이 예약을 관리자 권한으로 강제 취소하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          reservation_id: reservationId,
          is_admin: true,
          cancel_reason: '관리자 직권 취소',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('예약이 성공적으로 취소되었습니다.');
        loadAdminData();
      } else {
        showToast(data.message || '취소 실패', 'error');
      }
    } catch (err) {
      showToast('취소 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // 5. 차단 슬롯 추가
  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoDate || !newBoReason.trim()) {
      showToast('차단 날짜와 사유를 입력해 주세요.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch('/api/admin/blackout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          date: newBoDate,
          startTime: newBoStart,
          endTime: newBoEnd,
          reason: newBoReason.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('일정 차단이 등록되었습니다.');
        setNewBoReason('');
        loadAdminData();
      } else {
        showToast(data.message || '등록 실패', 'error');
      }
    } catch (err) {
      showToast('차단 등록 중 오류가 발생했습니다.', 'error');
    }
  };

  // 6. 차단 슬롯 삭제
  const handleDeleteBlackout = async (id: string) => {
    if (!window.confirm('해당 시간대의 차단을 해제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch(`/api/admin/blackout?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });

      const data = await res.json();
      if (data.success) {
        showToast('차단이 정상적으로 해제되었습니다.');
        loadAdminData();
      } else {
        showToast(data.message || '해제 실패', 'error');
      }
    } catch (err) {
      showToast('해제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 7. 운영 설정 저장
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({
          weekday_open: weekdayOpen,
          weekday_close: weekdayClose,
          saturday_open: saturdayOpen,
          saturday_close: saturdayClose,
          max_continuous_hours: Number(maxHours),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('운영 설정이 안전하게 업데이트되었습니다.');
        loadAdminData();
      } else {
        showToast(data.message || '설정 저장 실패', 'error');
      }
    } catch (err) {
      showToast('설정 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  // 8. 엑셀(CSV) 다운로드 함수 (UTF-8 BOM 포함)
  const handleDownloadCsv = () => {
    if (reservations.length === 0) {
      showToast('다운로드할 예약 데이터가 없습니다.', 'error');
      return;
    }

    const headers = [
      '예약ID',
      '예약일자',
      '시작시간',
      '종료시간',
      '소속구분',
      '예약자성함',
      '연락처(복호화)',
      '사용목적',
      '예약상태',
      '취소일시',
      '취소사유',
      '신청일시',
    ];

    const rows = reservations.map((r) => [
      r.id,
      r.reservation_date,
      r.start_time,
      r.end_time,
      `"${r.user_category}"`,
      `"${r.user_name}"`,
      `"${r.decrypted_phone || r.masked_phone}"`,
      `"${r.purpose.replace(/"/g, '""')}"`,
      r.status === 'CONFIRMED' ? '확정' : '취소됨',
      r.cancelled_at || '',
      `"${(r.cancel_reason || '').replace(/"/g, '""')}"`,
      r.created_at,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `청춘스럽_상담실_예약대장_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('엑셀(CSV) 예약 대장이 다운로드되었습니다.');
  };

  // -------------------------------------------------------------
  // [A. 초기 인증 확인 중 로딩 화면]
  // -------------------------------------------------------------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">관리자 권한을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // [B. 미인증 상태: 인라인 관리자 로그인 폼] (메인으로 튕기지 않음!)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* 상단 헤더 */}
          <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-900 to-blue-900 text-white text-center">
            <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-indigo-300" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">청춘스럽 1:1 상담실 관리자</h1>
            <p className="text-xs text-indigo-200 mt-1">공간 담당자 전용 인증 콘솔</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-5">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              청춘스럽 담당자 전용 메뉴입니다.<br />
              설정된 관리자 마스터 비밀번호를 입력해 주세요. (기본값: <b>admin1234</b>)
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                관리자 마스터 비밀번호
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="비밀번호 입력 (admin1234)"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-bold rounded-xl text-sm transition shadow-md cursor-pointer"
            >
              {isLoggingIn ? '인증 확인 중...' : '관리자 모드 접속'}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>일반 예약 화면으로 돌아가기</span>
              </Link>
            </div>
          </form>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // [C. 인증 완료: 관리자 전용 대시보드 화면]
  // -------------------------------------------------------------
  const confirmedReservations = reservations.filter((r) => r.status === 'CONFIRMED');
  const cancelledReservations = reservations.filter((r) => r.status === 'CANCELLED');
  const staffCount = confirmedReservations.filter((r) => r.user_category === '청년공간 근무자').length;
  const counselorCount = confirmedReservations.filter((r) => r.user_category === '외부 상담사').length;

  const filteredReservations = reservations.filter((r) => {
    const matchesCategory = filterCategory === 'ALL' || r.user_category === filterCategory;
    const matchesKeyword =
      !searchKeyword ||
      r.user_name.includes(searchKeyword) ||
      (r.decrypted_phone && r.decrypted_phone.includes(searchKeyword)) ||
      r.purpose.includes(searchKeyword) ||
      r.reservation_date.includes(searchKeyword);
    return matchesCategory && matchesKeyword;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 상단 관리자 전용 헤더 */}
      <header className="bg-indigo-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-indigo-800/80 hover:bg-indigo-800 transition text-indigo-200 hover:text-white cursor-pointer"
              title="예약 메인화면으로 이동"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <div>
                <h1 className="text-lg font-bold tracking-tight">청춘스럽 상담실 관리자 콘솔</h1>
                <p className="text-[11px] text-indigo-300">청춘스럽 1:1 상담실 통합 운영 대시보드</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCsv}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">예약 대장 엑셀(CSV) 다운로드</span>
              <span className="sm:hidden">엑셀 다운로드</span>
            </button>
            <button
              onClick={handleLogout}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-xs font-medium text-indigo-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 text-white ${
              toastMessage.type === 'success' ? 'bg-gray-900' : 'bg-red-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 대시보드 메인 본문 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. 핵심 통계 카드 그리드 */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
              <span>총 확정 예약</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">
              {confirmedReservations.length}
              <span className="text-xs font-normal text-gray-400 ml-1">건</span>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              취소된 예약: {cancelledReservations.length}건
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-blue-700 text-xs font-medium">
              <span>청년공간 근무자</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-blue-700">
              {staffCount}
              <span className="text-xs font-normal text-gray-400 ml-1">건</span>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">내부 상담 및 업무</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-purple-700 text-xs font-medium">
              <span>외부 위촉 상담사</span>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-purple-700">
              {counselorCount}
              <span className="text-xs font-normal text-gray-400 ml-1">건</span>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">외부 전문 상담 세션</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between text-red-600 text-xs font-medium">
              <span>취소된 예약 내역</span>
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-red-600">
              {cancelledReservations.length}
              <span className="text-xs font-normal text-gray-400 ml-1">건</span>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">본인 취소 및 직권 취소</div>
          </div>
        </section>

        {/* 2. 전체 예약 목록 관리 테이블 */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>상담실 전체 예약 대장</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                관리자에게는 마스킹되지 않은 원본 성함과 복호화된 실제 연락처가 안전하게 표시됩니다.
              </p>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-hidden"
              >
                <option value="ALL">전체 소속</option>
                <option value="청년공간 근무자">청년공간 근무자 (파랑)</option>
                <option value="외부 상담사">외부 상담사 (보라)</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="이름/연락처/목적 검색"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg w-44 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 테이블 리스트 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">일자 & 시간</th>
                  <th className="py-3 px-4">소속</th>
                  <th className="py-3 px-4">예약자 성함</th>
                  <th className="py-3 px-4">실제 연락처 (복호화)</th>
                  <th className="py-3 px-4">상담실 사용 목적</th>
                  <th className="py-3 px-4 text-center">상태</th>
                  <th className="py-3 px-4 text-center">관리 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      데이터를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      등록된 예약 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((res) => (
                    <tr
                      key={res.id}
                      className={`hover:bg-gray-50/60 transition ${
                        res.status === 'CANCELLED' ? 'bg-gray-50/40 text-gray-400' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {formatKoreanDate(res.reservation_date)}
                        </div>
                        <div className="text-[11px] text-blue-600 font-medium">
                          {res.start_time} ~ {res.end_time}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px]">
                          {res.user_category}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900">{res.user_name}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                        {res.decrypted_phone || res.masked_phone}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={res.purpose}>
                        {res.purpose}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {res.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            확정됨
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200"
                            title={res.cancel_reason || ''}
                          >
                            취소됨
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {res.status === 'CONFIRMED' ? (
                          <button
                            onClick={() => handleCancelReservation(res.id)}
                            type="button"
                            className="px-2.5 py-1 text-[11px] font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded-lg transition cursor-pointer"
                          >
                            강제 취소
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. 시설 점검 차단 관리 & 운영 시간 설정 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 시설 점검 및 행사 일정 차단 (블랙아웃) */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Ban className="w-4 h-4 text-amber-600" />
                <span>상담실 점검 및 행사 차단(블랙아웃)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                대청소, 방역, 센터 자체 행사 시 특정 시간대의 예약을 막아둘 수 있습니다.
              </p>
            </div>

            {/* 신규 차단 등록 폼 */}
            <form onSubmit={handleAddBlackout} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">차단 날짜</label>
                  <input
                    type="date"
                    required
                    value={newBoDate}
                    onChange={(e) => setNewBoDate(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">시작 시간</label>
                  <input
                    type="time"
                    step="3600"
                    required
                    value={newBoStart}
                    onChange={(e) => setNewBoStart(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">종료 시간</label>
                  <input
                    type="time"
                    step="3600"
                    required
                    value={newBoEnd}
                    onChange={(e) => setNewBoEnd(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">차단 사유</label>
                <input
                  type="text"
                  required
                  placeholder="예: 상담실 소독 방역, 센터 자체 청년 프로그램 진행"
                  value={newBoReason}
                  onChange={(e) => setNewBoReason(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                해당 시간대 예약 차단 등록
              </button>
            </form>

            {/* 등록된 차단 목록 */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700">현재 등록된 차단 목록 ({blackouts.length}건)</h4>
              {blackouts.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
                  현재 설정된 차단 일정이 없습니다.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {blackouts.map((bo) => (
                    <div
                      key={bo.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{bo.blackout_date}</span>
                          <span className="text-amber-700 font-semibold">
                            {bo.start_time} ~ {bo.end_time}
                          </span>
                        </div>
                        <div className="text-gray-500 mt-0.5">{bo.reason}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlackout(bo.id)}
                        type="button"
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="차단 해제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 운영 시간 및 정책 설정 */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>운영 시간 및 정책 간편 설정</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                평일 및 토요일의 상담실 오픈/마감 시간과 최대 예약 시간을 조정합니다.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    평일 시작 시간
                  </label>
                  <input
                    type="time"
                    step="3600"
                    value={weekdayOpen}
                    onChange={(e) => setWeekdayOpen(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    평일 종료 시간
                  </label>
                  <input
                    type="time"
                    step="3600"
                    value={weekdayClose}
                    onChange={(e) => setWeekdayClose(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    토요일 시작 시간
                  </label>
                  <input
                    type="time"
                    step="3600"
                    value={saturdayOpen}
                    onChange={(e) => setSaturdayOpen(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    토요일 종료 시간
                  </label>
                  <input
                    type="time"
                    step="3600"
                    value={saturdayClose}
                    onChange={(e) => setSaturdayClose(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  1회 최대 연속 예약 가능 시간 (시간)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                📌 <b>정기 휴무 안내:</b> 일요일은 시스템 기본 정기 휴무일로 고정 적용되어 예약이 차단됩니다.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                설정 저장하기
              </button>
            </form>
          </section>

        </div>

      </main>

    </div>
  );
}
