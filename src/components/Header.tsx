'use client';

import React from 'react';
import { CalendarCheck, Sparkles } from 'lucide-react';

/**
 * ==============================================================================
 * [Header.tsx] 청춘스럽 1:1 상담실 예약 시스템 상단 헤더 컴포넌트
 * 
 * - 브랜드 타이틀: '청춘스럽 1:1 상담실 예약'
 * - 우측 불필요한 버튼을 제거하여 더욱 깔끔하고 미니멀한 UI 제공
 * ==============================================================================
 */
export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* 좌측: 브랜드 로고 및 타이틀 */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                청춘스럽 1:1 상담실 예약
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                <Sparkles className="w-3 h-3" />
                단독 공간
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              청춘스럽 근무자 · 외부 상담사 전용 일정 공유 시스템
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}
