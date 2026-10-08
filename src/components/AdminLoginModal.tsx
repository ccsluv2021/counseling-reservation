'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ShieldCheck, Lock, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ==============================================================================
 * [AdminLoginModal.tsx] 관리자 마스터 비밀번호 인증 모달
 * 
 * 청춘스럽 공간 관리자가 마스터 비밀번호를 입력하고 관리자 대시보드(/admin)로 안전하게 진입
 * (보안을 위해 비밀번호 힌트 문구 완전 제거)
 * ==============================================================================
 */
export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('관리자 마스터 비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || '비밀번호가 올바르지 않습니다.');
        setIsSubmitting(false);
        return;
      }

      // 로컬 스토리지에 세션 토큰 저장
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
      }

      onClose();
      // 관리자 대시보드로 이동
      router.push('/admin');
    } catch (err) {
      console.error('관리자 로그인 오류:', err);
      setErrorMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 상단 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">공간 관리자 인증</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 (힌트 문구 제거) */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            청춘스럽 담당자 전용 메뉴입니다. 관리자 마스터 비밀번호를 입력해 주세요.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              관리자 마스터 비밀번호
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                autoFocus
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            {isSubmitting ? '인증 확인 중...' : '관리자 모드 접속'}
          </button>
        </form>

      </div>
    </div>
  );
}
