'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * ==============================================================================
 * [Header.tsx] 청춘스럽 1:1 상담실 예약 시스템 상단 헤더 컴포넌트
 * 
 * - 브랜드 로고: 대전서구 청년공간 청춘스럽 공식 로고 (/logo.png) 적용
 * - 브랜드 타이틀: '청춘스럽 1:1 상담실 예약'
 * - 깔끔하고 현대적인 헤더 디자인으로 사용자에게 공식 서비스로서의 신뢰감 제공
 * ==============================================================================
 */
export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* 좌측: 청춘스럽 공식 로고 및 타이틀 영역 */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* 청춘스럽 공식 심볼/로고 이미지 */}
          <div className="flex items-center justify-center p-1 bg-white rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="대전서구 청년공간 청춘스럽"
              className="h-11 sm:h-13 w-auto object-contain"
            />
          </div>

          {/* 세로 구분선 (PC/태블릿에서 표시) */}
          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          {/* 타이틀 및 부가 설명 */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                청춘스럽 1:1 상담실 예약
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                <Sparkles className="w-3 h-3" />
                단독 공간
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              청춘스럽 근무자 · 외부 상담사 전용 일정 공유 시스템
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}
