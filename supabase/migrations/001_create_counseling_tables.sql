-- ==============================================================================
-- [001_create_counseling_tables.sql]
-- 청년공간 1:1 상담실 예약 시스템 데이터베이스 마이그레이션 스크립트
--
-- 목적:
-- 1. 상담실 운영 설정 테이블 (space_settings)
-- 2. 상담실 예약 관리 테이블 (reservations)
-- 3. 관리자 일정 차단/블랙아웃 테이블 (blackout_slots)
-- 4. DB 레벨 중복 예약 방지 제약조건 (btree_gist EXCLUDE)
-- 5. 보안 및 성능을 위한 인덱스 설정
-- ==============================================================================

-- 1. 시간 범위 겹침 방지(EXCLUDE)를 위한 btree_gist 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ------------------------------------------------------------------------------
-- 2. 상담실 운영 설정 테이블 (space_settings)
-- 상담실의 기본 운영 시간, 요일별 휴무 여부, 관리자 비밀번호 등을 저장합니다.
-- 시스템당 1개의 설정 레코드(id=1)만 유지합니다.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS space_settings (
    id INT PRIMARY KEY DEFAULT 1,
    space_name TEXT NOT NULL DEFAULT '청년공간 1:1 상담실',
    weekday_open TIME NOT NULL DEFAULT '11:00',      -- 평일 시작 시간 (오전 11시)
    weekday_close TIME NOT NULL DEFAULT '21:00',     -- 평일 종료 시간 (오후 9시)
    saturday_open TIME NOT NULL DEFAULT '11:00',     -- 토요일 시작 시간 (오전 11시)
    saturday_close TIME NOT NULL DEFAULT '19:00',    -- 토요일 종료 시간 (오후 7시)
    closed_days INT[] NOT NULL DEFAULT '{0}',        -- 정기 휴무 요일 (0: 일요일, 6: 토요일 등)
    max_continuous_hours INT NOT NULL DEFAULT 3,     -- 1회 최대 연속 예약 가능 시간 (기본 3시간)
    max_advance_days INT NOT NULL DEFAULT 28,        -- 사전 예약 오픈 일수 (오늘 기준 28일/4주)
    admin_password_hash TEXT NOT NULL,               -- 관리자 마스터 비밀번호 단방향 해시값
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 초기 기본 설정 행 삽입 (관리자 초기 비밀번호 해시는 기본값 세팅)
-- 기본 관리자 비밀번호: 'admin1234' (추후 관리자 화면에서 변경 가능)
INSERT INTO space_settings (id, space_name, weekday_open, weekday_close, saturday_open, saturday_close, closed_days, max_continuous_hours, max_advance_days, admin_password_hash)
VALUES (
    1,
    '청년공간 1:1 상담실',
    '11:00',
    '21:00',
    '11:00',
    '19:00',
    '{0}',
    3,
    28,
    -- 'admin1234'의 SHA-256 해시값 (초기값)
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. 상담실 예약 관리 테이블 (reservations)
-- 근무자, 외부 상담사, 버크만 디브리퍼의 상담실 예약 내역을 저장합니다.
-- 개인정보 보호를 위해 연락처는 양방향 암호화(AES-256), 간이 비밀번호는 단방향 해시로 저장합니다.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 예약 일시 정보
    reservation_date DATE NOT NULL,                  -- 예약 날짜 (YYYY-MM-DD)
    start_time TIME NOT NULL,                        -- 시작 시간 (HH:00)
    end_time TIME NOT NULL,                          -- 종료 시간 (HH:00)
    
    -- 예약자 정보
    user_category TEXT NOT NULL CHECK (
        user_category IN ('청년공간 근무자', '외부 상담사', '버크만 디브리퍼')
    ),                                               -- 예약자 소속
    user_name TEXT NOT NULL,                         -- 예약자 성함 원본 (관리자용)
    masked_name TEXT NOT NULL,                       -- 마스킹된 성함 (일반 사용자 캘린더용, 예: 홍*동)
    encrypted_phone TEXT NOT NULL,                   -- 암호화된 휴대폰 번호 (AES-256)
    masked_phone TEXT NOT NULL,                      -- 마스킹된 휴대폰 번호 (010-****-1234)
    purpose TEXT NOT NULL,                           -- 사용 목적 (예: 청년 1:1 심리상담)
    
    -- 본인 확인 및 취소용 비밀번호 (4자리 단방향 해시값)
    password_hash TEXT NOT NULL,
    
    -- 상태 관리
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (
        status IN ('CONFIRMED', 'CANCELLED')
    ),                                               -- CONFIRMED: 확정, CANCELLED: 취소됨
    cancelled_at TIMESTAMPTZ,                        -- 취소된 일시
    cancel_reason TEXT,                              -- 취소 사유 (사용자 직접 취소 or 관리자 취소)
    
    -- 메타 정보
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. DB 레벨 중복 예약 방지 제약조건 (Double-Booking 방지)
-- 상태가 'CONFIRMED'인 예약들 중, 같은 날짜에 시간이 겹치면 데이터베이스 차원에서 자동으로 입력을 거부합니다.
-- 이를 통해 동시 요청 시 발생하는 0.001초 차이의 중복 예약도 원천 차단됩니다.
-- ------------------------------------------------------------------------------
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS no_overlapping_counseling_reservations;

ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_counseling_reservations
EXCLUDE USING gist (
    reservation_date WITH =,
    tsrange(
        (reservation_date + start_time),
        (reservation_date + end_time)
    ) WITH &&
)
WHERE (status = 'CONFIRMED');

-- ------------------------------------------------------------------------------
-- 5. 관리자 공간 점검 및 행사 차단 테이블 (blackout_slots)
-- 공간 대청소, 센터 자체 행사 등으로 인해 예약을 받지 못하도록 특정 시간대를 막아두는 테이블입니다.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blackout_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blackout_date DATE NOT NULL,                     -- 차단 날짜 (YYYY-MM-DD)
    start_time TIME NOT NULL,                        -- 차단 시작 시간 (HH:00)
    end_time TIME NOT NULL,                          -- 차단 종료 시간 (HH:00)
    reason TEXT NOT NULL,                            -- 차단 사유 (예: 상담실 소독 방역 작업)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. 빠른 조회를 위한 데이터베이스 인덱스(Index) 생성
-- 캘린더 화면에서 특정 날짜 범위의 예약을 빠르게 조회하기 위한 인덱스입니다.
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reservations_date_status
ON reservations (reservation_date, status);

CREATE INDEX IF NOT EXISTS idx_blackout_date
ON blackout_slots (blackout_date);

-- ==============================================================================
-- 마이그레이션 스크립트 작성 완료
-- ==============================================================================
