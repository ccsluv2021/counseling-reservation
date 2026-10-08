import { NextRequest, NextResponse } from 'next/server';
import { getSpaceSettings } from '@/lib/reservationService';
import { verifyPassword, hashPassword } from '@/lib/crypto';

// DB 초기 마이그레이션 시 생성된 초기 더미 해시값
const INITIAL_DUMMY_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

/**
 * ==============================================================================
 * [POST /api/admin/login]
 * 관리자 마스터 비밀번호 검증 API
 * 
 * 1. 초기 상태: 기본 마스터 비밀번호('admin1234')로 즉시 접속 가능
 * 2. 비밀번호 변경 후: 사용자가 직접 변경한 새 암호화 해시로만 엄격 검증
 * ==============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: '관리자 비밀번호를 입력해 주세요.' },
        { status: 400 }
      );
    }

    const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
    const settings = await getSpaceSettings();
    const storedHash = settings.admin_password_hash || '';

    let isMatch = false;

    // 사용자가 관리자 화면에서 비밀번호를 변경한 적이 있는 경우 (새 솔트 해시 존재)
    if (storedHash && storedHash !== INITIAL_DUMMY_HASH) {
      isMatch = verifyPassword(password, storedHash);
    } else {
      // 초기 상태인 경우: 기본 비밀번호(admin1234)로 인증
      isMatch = password === envAdminPassword || (storedHash ? verifyPassword(password, storedHash) : false);
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: '관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 관리자 세션 토큰 생성
    const token = hashPassword(password + '_admin_session_auth');

    const response = NextResponse.json({
      success: true,
      message: '관리자 인증이 성공했습니다.',
      token,
    });

    // 보안 쿠키 설정 (관리자 권한 유지용)
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24시간 유지
    });

    return response;
  } catch (error) {
    console.error('관리자 로그인 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류로 관리자 로그인에 실패했습니다.' },
      { status: 500 }
    );
  }
}
