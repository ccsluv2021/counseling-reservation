import { createClient } from '@supabase/supabase-js';

/**
 * ==============================================================================
 * [supabase.ts] Supabase 클라이언트 설정 모듈
 * 
 * 데이터베이스 연결을 위한 클라이언트를 초기화합니다.
 * 1. supabase: 일반 클라이언트(브라우저 및 공용 데이터 조회)
 * 2. supabaseAdmin: 서버 사이드 전용 어드민 클라이언트 (개인정보 암호화 저장, 관리자 모드 전용)
 * ==============================================================================
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 실제 Supabase URL 설정 여부 검사
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

// 1. 일반 공용 Supabase 클라이언트
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 2. 관리자/서버 사이드 전용 Supabase 클라이언트 (Service Role Key)
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
