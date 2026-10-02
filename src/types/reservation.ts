/**
 * ==============================================================================
 * [reservation.ts] 청년공간 상담실 예약 시스템 타입 정의
 * 
 * 예약 데이터, 공간 설정, 차단 슬롯 및 API 요청/응답에 사용되는
 * 모든 TypeScript 인터페이스와 타입을 정의합니다.
 * ==============================================================================
 */

// 예약자 소속 구분 (유니온 타입)
export type UserCategory = '청년공간 근무자' | '외부 상담사' | '버크만 디브리퍼';

// 예약 상태 구분
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

// 1. 예약 데이터 인터페이스 (데이터베이스 저장 형태)
export interface Reservation {
  id: string;                                 // UUID 고유 식별자
  reservation_date: string;                   // 예약 날짜 (YYYY-MM-DD)
  start_time: string;                         // 시작 시간 (HH:00)
  end_time: string;                           // 종료 시간 (HH:00)
  user_category: UserCategory;                // 예약자 소속
  user_name: string;                          // 예약자 성함 원본 (관리자용)
  masked_name: string;                        // 마스킹된 성함 (일반 사용자 캘린더용, 예: 홍*동)
  encrypted_phone: string;                    // AES-256 암호화된 휴대폰 번호
  masked_phone: string;                       // 마스킹된 휴대폰 번호 (010-****-1234)
  purpose: string;                            // 사용 목적 (예: 청년 1:1 심리상담)
  password_hash: string;                      // 4자리 비밀번호의 단방향 해시
  status: ReservationStatus;                  // 예약 상태 ('CONFIRMED' | 'CANCELLED')
  cancelled_at?: string | null;               // 취소 일시 (취소된 경우)
  cancel_reason?: string | null;              // 취소 사유
  created_at: string;                         // 생성 일시
  updated_at: string;                         // 수정 일시
}

// 2. 일반 사용자에게 공개되는 캘린더용 안전한 예약 정보 (민감정보 제외)
export interface PublicReservation {
  id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  user_category: UserCategory;
  masked_name: string;                        // 홍*동 형태
  purpose: string;
  status: ReservationStatus;
}

// 3. 관리자 전용 상세 예약 정보 (복호화된 원본 연락처 포함)
export interface AdminReservation extends Reservation {
  decrypted_phone?: string;                   // 복호화된 원본 전화번호
}

// 4. 공간 운영 설정 인터페이스
export interface SpaceSettings {
  id: number;
  space_name: string;
  weekday_open: string;                       // 기본 "11:00"
  weekday_close: string;                      // 기본 "21:00"
  saturday_open: string;                      // 기본 "11:00"
  saturday_close: string;                     // 기본 "19:00"
  closed_days: number[];                      // 정기 휴무 요일 (0: 일요일)
  max_continuous_hours: number;               // 1회 최대 연속 예약 가능 시간 (기본 3)
  max_advance_days: number;                   // 사전 오픈 일수 (기본 28일)
  admin_password_hash?: string;
  updated_at?: string;
}

// 5. 공간 점검 및 관리자 일정 차단 인터페이스 (블랙아웃)
export interface BlackoutSlot {
  id: string;
  blackout_date: string;                      // 차단 날짜 (YYYY-MM-DD)
  start_time: string;                         // 차단 시작 시간 (HH:00)
  end_time: string;                           // 차단 종료 시간 (HH:00)
  reason: string;                             // 차단 사유 (예: 시설 방역 소독)
  created_at: string;
}

// 6. 예약 신청 폼 데이터 (클라이언트 -> 서버 전송용)
export interface CreateReservationDto {
  reservation_date: string;                   // YYYY-MM-DD
  start_time: string;                         // HH:00
  end_time: string;                           // HH:00
  user_category: UserCategory;
  user_name: string;                          // 홍길동
  phone: string;                              // 010-1234-5678
  purpose: string;                            // 상담 목적
  password: string;                           // 간이 비밀번호 4자리
}

// 7. 예약 취소 요청 데이터
export interface CancelReservationDto {
  reservation_id: string;
  password?: string;                          // 일반 사용자는 4자리 비밀번호 필수
  is_admin?: boolean;                         // 관리자 강제 취소 여부
  cancel_reason?: string;                     // 취소 사유
}
