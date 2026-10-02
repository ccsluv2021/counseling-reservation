'use client';

import React from 'react';
import { CalendarCheck, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenCancelModal: () => void;
  onOpenAdminModal: () => void;
}

/**
 * ==============================================================================
 * [Header.tsx] 청년공간 상담실 예약 시스템 상단 헤더 컴포넌트
 * 
 * 브랜드 타이틀, 대상 사용자 안내 뱃지, 예약 취소 및 관리자 모드 바로가기 제공
 * ==============================================================================
 */
export default function Header({ onOpenCancelModal, onOpenAdminModal }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* 좌측: 로고 및 타이틀 */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                청년공간 1:1 상담실 예약
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                <Sparkles className="w-3 h-3" />
                단독 공간
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              청년공간 근무자 · 외부 상담사 · 버크만 1:1 디브리퍼 전용 일정 공유 시스템
            </p>
          </div>
        </div>

        {/* 우측: 간편 액션 버튼 (예약 취소 & 관리자) */}
        <div className="flex items-center gap-2">
          {/* 예약 취소 버튼 */}
          <button
            onClick={onOpenCancelModal}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer"
            title="본인 확인용 4자리 비밀번호로 예약 취소"
          >
            <KeyRound className="w-4 h-4 text-gray-500" />
            <span>내 예약 취소</span>
          </button>

          {/* 관리자 모드 버튼 */}
          <button
            onClick={onOpenAdminModal}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            title="공간 관리자 전용 대시보드"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">관리자 모드</span>
            <span className="sm:hidden">관리자</span>
          </button>
        </div>

      </div>
    </header>
  );
}
