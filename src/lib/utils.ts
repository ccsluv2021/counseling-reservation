import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 여러 Tailwind CSS 클래스를 조건부로 안전하게 결합하는 유틸리티 함수
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜 객체를 YYYY-MM-DD 문자열로 변환 (로컬 타임존 기준)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜 문자열(YYYY-MM-DD)을 한국어 친화적 포맷("M월 D일 (요일)")으로 변환
 */
export function formatKoreanDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
}

/**
 * 소속별 배지 색상 클래스 반환
 */
export function getCategoryBadgeClass(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case '청년공간 근무자':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case '외부 상담사':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case '버크만 디브리퍼':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    default:
      return {
        bg: 'bg-gray-50 text-gray-700 border-gray-200',
        text: 'text-gray-700',
        border: 'border-gray-200',
      };
  }
}
