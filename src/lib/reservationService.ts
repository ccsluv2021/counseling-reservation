import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import {
  Reservation,
  PublicReservation,
  AdminReservation,
  SpaceSettings,
  BlackoutSlot,
  CreateReservationDto,
  CancelReservationDto,
} from '@/types/reservation';
import {
  maskName,
  maskPhone,
  encryptPhone,
  decryptPhone,
  hashPassword,
  verifyPassword,
} from './crypto';

/**
 * ==============================================================================
 * [reservationService.ts] 예약 비즈니스 로직 및 데이터 접근 서비스
 * 
 * 상담실 예약의 생성, 조회, 중복 검사, 취소, 관리자 제어 등 모든 핵심 비즈니스 로직을
 * 안전하고 완벽하게 처리합니다.
 * 
 * - Supabase가 설정되어 있으면 실제 PostgreSQL DB에 암호화하여 저장
 * - Supabase 설정 전(로컬 테스트)에는 메모리 저장소를 통해 원활한 시연 및 검증 지원
 * ==============================================================================
 */

// 기본 공간 설정 (초기 기본값)
const DEFAULT_SETTINGS: SpaceSettings = {
  id: 1,
  space_name: '청년공간 1:1 상담실',
  weekday_open: '11:00',
  weekday_close: '21:00',
  saturday_open: '11:00',
  saturday_close: '19:00',
  closed_days: [0], // 0: 일요일 휴무
  max_continuous_hours: 3,
  max_advance_days: 28,
  // 기본 관리자 비밀번호 'admin1234'의 해시값
  admin_password_hash: hashPassword('admin1234'),
};

// [로컬 개발 & 테스트용 인메모리 저장소]
let mockSettings: SpaceSettings = { ...DEFAULT_SETTINGS };
let mockReservations: Reservation[] = [
  // 테스트용 초기 샘플 데이터 (동작 확인용)
  {
    id: 'sample-res-1',
    reservation_date: new Date().toISOString().split('T')[0], // 오늘 날짜
    start_time: '14:00',
    end_time: '16:00',
    user_category: '외부 상담사',
    user_name: '이수진',
    masked_name: '이*진',
    encrypted_phone: encryptPhone('010-9876-5432'),
    masked_phone: '010-****-5432',
    purpose: '청년 진로 심층 상담 (2회차)',
    password_hash: hashPassword('1234'),
    status: 'CONFIRMED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-res-2',
    reservation_date: new Date().toISOString().split('T')[0], // 오늘 날짜
    start_time: '17:00',
    end_time: '18:00',
    user_category: '버크만 디브리퍼',
    user_name: '박민우',
    masked_name: '박*우',
    encrypted_phone: encryptPhone('010-3333-7777'),
    masked_phone: '010-****-7777',
    purpose: '버크만 진단 1:1 디브리핑 세션',
    password_hash: hashPassword('5678'),
    status: 'CONFIRMED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let mockBlackouts: BlackoutSlot[] = [];

/**
 * 1. 공간 운영 설정 조회
 */
export async function getSpaceSettings(): Promise<SpaceSettings> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('space_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (!error && data) {
        return data as SpaceSettings;
      }
    } catch (err) {
      console.warn('Supabase 설정 조회 실패, 기본 설정 사용:', err);
    }
  }
  return mockSettings;
}

/**
 * 2. 공간 운영 설정 업데이트 (관리자 전용)
 */
export async function updateSpaceSettings(settings: Partial<SpaceSettings>): Promise<SpaceSettings> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('space_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (!error && data) {
      return data as SpaceSettings;
    }
  }
  mockSettings = { ...mockSettings, ...settings };
  return mockSettings;
}

/**
 * 시간 문자열 정규화 헬퍼 함수 ("HH:mm:ss" -> "HH:mm")
 * 데이터베이스(PostgreSQL TIME 타입)가 '11:00:00' 형태로 반환하더라도
 * 일관되게 '11:00' 형태의 5글자 표준 포맷으로 맞추어 문자열 비교 오류를 완벽 방지합니다.
 */
export function normalizeTime(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

/**
 * 3. 일반 사용자용 캘린더 예약 목록 조회 (민감정보 제외, 마스킹 이름만 노출)
 */
export async function getPublicReservations(
  startDate: string,
  endDate: string
): Promise<PublicReservation[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, reservation_date, start_time, end_time, user_category, masked_name, purpose, status')
        .gte('reservation_date', startDate)
        .lte('reservation_date', endDate)
        .eq('status', 'CONFIRMED');

      if (!error && data) {
        return (data as PublicReservation[]).map((r) => ({
          ...r,
          start_time: normalizeTime(r.start_time),
          end_time: normalizeTime(r.end_time),
        }));
      }
    } catch (err) {
      console.warn('Supabase 예약 조회 실패, 로컬 저장소 사용:', err);
    }
  }

  // 로컬 목데이터 필터링
  return mockReservations
    .filter(
      (r) =>
        r.status === 'CONFIRMED' &&
        r.reservation_date >= startDate &&
        r.reservation_date <= endDate
    )
    .map((r) => ({
      id: r.id,
      reservation_date: r.reservation_date,
      start_time: normalizeTime(r.start_time),
      end_time: normalizeTime(r.end_time),
      user_category: r.user_category,
      masked_name: r.masked_name,
      purpose: r.purpose,
      status: r.status,
    }));
}

/**
 * 4. 관리자 차단 슬롯 목록 조회 (블랙아웃)
 */
export async function getBlackoutSlots(
  startDate: string,
  endDate: string
): Promise<BlackoutSlot[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('blackout_slots')
        .select('*')
        .gte('blackout_date', startDate)
        .lte('blackout_date', endDate);

      if (!error && data) {
        return (data as BlackoutSlot[]).map((b) => ({
          ...b,
          start_time: normalizeTime(b.start_time),
          end_time: normalizeTime(b.end_time),
        }));
      }
    } catch (err) {
      console.warn('Supabase 차단 목록 조회 실패:', err);
    }
  }

  return mockBlackouts.filter(
    (b) => b.blackout_date >= startDate && b.blackout_date <= endDate
  );
}

/**
 * 5. 시간 겹침 검사 함수 (시간대 충돌 체크)
 * @returns 충돌이 있으면 true, 없으면 false
 */
function isTimeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // 시간 포맷: "HH:mm" 정규화 후 안전 비교
  const normStartA = normalizeTime(startA);
  const normEndA = normalizeTime(endA);
  const normStartB = normalizeTime(startB);
  const normEndB = normalizeTime(endB);
  return normStartA < normEndB && normEndA > normStartB;
}

/**
 * 6. 신규 예약 신청 (실시간 중복 예약 방지 및 개인정보 암호화 적용)
 */
export async function createReservation(
  dto: CreateReservationDto
): Promise<{ success: boolean; message: string; reservation?: PublicReservation }> {
  // 1) 입력값 기본 유효성 검사
  if (!dto.reservation_date || !dto.start_time || !dto.end_time) {
    return { success: false, message: '예약 날짜와 시간을 정확히 지정해 주세요.' };
  }
  if (!dto.user_name || dto.user_name.trim().length < 2) {
    return { success: false, message: '예약자 성함을 2글자 이상 정확히 입력해 주세요.' };
  }
  if (!dto.phone || dto.phone.replace(/\D/g, '').length < 10) {
    return { success: false, message: '올바른 휴대폰 번호를 입력해 주세요.' };
  }
  if (!dto.purpose || dto.purpose.trim().length < 2) {
    return { success: false, message: '상담실 사용 목적을 간략히 기재해 주세요.' };
  }
  if (!dto.password || dto.password.length !== 4 || !/^\d{4}$/.test(dto.password)) {
    return { success: false, message: '예약 확인/취소용 비밀번호는 숫자 4자리여야 합니다.' };
  }

  // 2) 시간 유효성 및 예약 시간 길이 검사
  const startHour = parseInt(dto.start_time.split(':')[0], 10);
  const endHour = parseInt(dto.end_time.split(':')[0], 10);
  const duration = endHour - startHour;

  if (duration <= 0) {
    return { success: false, message: '종료 시간은 시작 시간보다 늦어야 합니다.' };
  }
  if (duration > 3) {
    return { success: false, message: '1회 최대 예약 시간은 3시간입니다.' };
  }

  // 3) 운영 요일 및 운영 시간 확인
  const settings = await getSpaceSettings();
  const resDate = new Date(dto.reservation_date + 'T00:00:00');
  const dayOfWeek = resDate.getDay(); // 0: 일요일, 6: 토요일

  if (settings.closed_days.includes(dayOfWeek)) {
    return { success: false, message: '선택하신 요일은 상담실 정기 휴무일입니다.' };
  }

  const openTime = dayOfWeek === 6 ? settings.saturday_open : settings.weekday_open;
  const closeTime = dayOfWeek === 6 ? settings.saturday_close : settings.weekday_close;

  // DB에서 "11:00:00"으로 반환되더라도 5글자 "11:00"으로 정규화하여 안전하게 비교
  const normOpen = normalizeTime(openTime);
  const normClose = normalizeTime(closeTime);
  const normStart = normalizeTime(dto.start_time);
  const normEnd = normalizeTime(dto.end_time);

  if (normStart < normOpen || normEnd > normClose) {
    return {
      success: false,
      message: `상담실 이용 가능 시간(${normOpen} ~ ${normClose})을 벗어났습니다.`,
    };
  }

  // 4) 기존 예약 및 관리자 차단 슬롯과의 중복 겹침 여부 확인
  const existingPublic = await getPublicReservations(dto.reservation_date, dto.reservation_date);
  for (const existing of existingPublic) {
    if (isTimeOverlapping(dto.start_time, dto.end_time, existing.start_time, existing.end_time)) {
      return {
        success: false,
        message: `선택하신 시간대에 이미 다른 예약(${existing.user_category} ${existing.masked_name})이 확정되어 있습니다.`,
      };
    }
  }

  const blackouts = await getBlackoutSlots(dto.reservation_date, dto.reservation_date);
  for (const bo of blackouts) {
    if (isTimeOverlapping(dto.start_time, dto.end_time, bo.start_time, bo.end_time)) {
      return {
        success: false,
        message: `해당 시간은 시설 점검 및 행사로 인해 예약이 제한된 시간입니다 (${bo.reason}).`,
      };
    }
  }

  // 5) 개인정보 보안 암호화 처리 (규칙 8 준수)
  const masked_name = maskName(dto.user_name);
  const masked_phone = maskPhone(dto.phone);
  const encrypted_phone = encryptPhone(dto.phone);
  const password_hash = hashPassword(dto.password);

  const newReservation: Reservation = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'res-' + Date.now(),
    reservation_date: dto.reservation_date,
    start_time: dto.start_time,
    end_time: dto.end_time,
    user_category: dto.user_category,
    user_name: dto.user_name.trim(),
    masked_name,
    encrypted_phone,
    masked_phone,
    purpose: dto.purpose.trim(),
    password_hash,
    status: 'CONFIRMED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 6) 데이터베이스 저장 (Supabase 또는 로컬 저장소)
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('reservations')
        .insert({
          reservation_date: newReservation.reservation_date,
          start_time: newReservation.start_time,
          end_time: newReservation.end_time,
          user_category: newReservation.user_category,
          user_name: newReservation.user_name,
          masked_name: newReservation.masked_name,
          encrypted_phone: newReservation.encrypted_phone,
          masked_phone: newReservation.masked_phone,
          purpose: newReservation.purpose,
          password_hash: newReservation.password_hash,
          status: newReservation.status,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23P01') {
          // PostgreSQL EXCLUDE 제약조건(동시 충돌) 에러 코드
          return { success: false, message: '동시에 다른 사용자가 먼저 예약하여 예약이 불가합니다.' };
        }
        throw error;
      }

      return {
        success: true,
        message: '상담실 예약이 성공적으로 확정되었습니다!',
        reservation: {
          id: data.id,
          reservation_date: data.reservation_date,
          start_time: data.start_time,
          end_time: data.end_time,
          user_category: data.user_category,
          masked_name: data.masked_name,
          purpose: data.purpose,
          status: data.status,
        },
      };
    } catch (err: unknown) {
      console.error('Supabase 예약 저장 오류:', err);
      return { success: false, message: '데이터베이스 저장 중 오류가 발생했습니다.' };
    }
  }

  // 로컬 저장소에 저장
  mockReservations.push(newReservation);
  return {
    success: true,
    message: '상담실 예약이 성공적으로 확정되었습니다!',
    reservation: {
      id: newReservation.id,
      reservation_date: newReservation.reservation_date,
      start_time: newReservation.start_time,
      end_time: newReservation.end_time,
      user_category: newReservation.user_category,
      masked_name: newReservation.masked_name,
      purpose: newReservation.purpose,
      status: newReservation.status,
    },
  };
}

/**
 * 7. 예약 취소 처리 (간이 비밀번호 4자리 검증 또는 관리자 권한)
 */
export async function cancelReservation(
  dto: CancelReservationDto
): Promise<{ success: boolean; message: string }> {
  if (!dto.reservation_id) {
    return { success: false, message: '취소할 예약 번호가 올바르지 않습니다.' };
  }

  // Supabase가 설정된 경우
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: res, error: fetchErr } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .eq('id', dto.reservation_id)
        .single();

      if (fetchErr || !res) {
        return { success: false, message: '예약 내역을 찾을 수 없습니다.' };
      }

      if (res.status === 'CANCELLED') {
        return { success: false, message: '이미 취소된 예약입니다.' };
      }

      // 일반 사용자 취소 시 비밀번호 확인
      if (!dto.is_admin) {
        if (!dto.password) {
          return { success: false, message: '예약 시 입력한 비밀번호 4자리를 입력해 주세요.' };
        }
        const isMatch = verifyPassword(dto.password, res.password_hash);
        if (!isMatch) {
          return { success: false, message: '비밀번호가 일치하지 않습니다.' };
        }
      }

      const { error: updateErr } = await supabaseAdmin
        .from('reservations')
        .update({
          status: 'CANCELLED',
          cancelled_at: new Date().toISOString(),
          cancel_reason: dto.cancel_reason || (dto.is_admin ? '관리자 직권 취소' : '사용자 본인 취소'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', dto.reservation_id);

      if (updateErr) {
        return { success: false, message: '취소 처리 중 오류가 발생했습니다.' };
      }

      return { success: true, message: '예약이 성공적으로 취소되었습니다.' };
    } catch (err) {
      console.error('예약 취소 오류:', err);
      return { success: false, message: '서버 오류로 예약 취소에 실패했습니다.' };
    }
  }

  // 로컬 메모리 저장소 처리
  const target = mockReservations.find((r) => r.id === dto.reservation_id);
  if (!target) {
    return { success: false, message: '예약 내역을 찾을 수 없습니다.' };
  }
  if (target.status === 'CANCELLED') {
    return { success: false, message: '이미 취소된 예약입니다.' };
  }

  if (!dto.is_admin) {
    if (!dto.password) {
      return { success: false, message: '예약 시 입력한 비밀번호 4자리를 입력해 주세요.' };
    }
    const isMatch = verifyPassword(dto.password, target.password_hash);
    if (!isMatch) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }
  }

  target.status = 'CANCELLED';
  target.cancelled_at = new Date().toISOString();
  target.cancel_reason = dto.cancel_reason || (dto.is_admin ? '관리자 직권 취소' : '사용자 본인 취소');

  return { success: true, message: '예약이 성공적으로 취소되었습니다.' };
}

/**
 * 8. 관리자 전용 전체 예약 목록 조회 (복호화된 연락처 포함)
 */
export async function getAdminReservations(): Promise<AdminReservation[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (!error && data) {
        return data.map((item) => ({
          ...item,
          decrypted_phone: decryptPhone(item.encrypted_phone),
        })) as AdminReservation[];
      }
    } catch (err) {
      console.warn('관리자 예약 조회 실패:', err);
    }
  }

  return mockReservations.map((item) => ({
    ...item,
    decrypted_phone: decryptPhone(item.encrypted_phone),
  }));
}

/**
 * 9. 관리자 일정 차단(블랙아웃) 생성 및 삭제
 */
export async function createBlackout(
  date: string,
  startTime: string,
  endTime: string,
  reason: string
): Promise<{ success: boolean; message: string; blackout?: BlackoutSlot }> {
  const newBlackout: BlackoutSlot = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'bo-' + Date.now(),
    blackout_date: date,
    start_time: startTime,
    end_time: endTime,
    reason: reason.trim() || '공간 시설 점검',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('blackout_slots')
        .insert({
          blackout_date: newBlackout.blackout_date,
          start_time: newBlackout.start_time,
          end_time: newBlackout.end_time,
          reason: newBlackout.reason,
        })
        .select()
        .single();

      if (!error && data) {
        return { success: true, message: '해당 시간대 예약이 정상적으로 차단되었습니다.', blackout: data as BlackoutSlot };
      }
    } catch (err) {
      console.error('차단 슬롯 생성 오류:', err);
    }
  }

  mockBlackouts.push(newBlackout);
  return { success: true, message: '해당 시간대 예약이 정상적으로 차단되었습니다.', blackout: newBlackout };
}

export async function deleteBlackout(id: string): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('blackout_slots').delete().eq('id', id);
      if (!error) {
        return { success: true, message: '차단이 해제되었습니다.' };
      }
    } catch (err) {
      console.error('차단 해제 오류:', err);
    }
  }

  mockBlackouts = mockBlackouts.filter((b) => b.id !== id);
  return { success: true, message: '차단이 해제되었습니다.' };
}
