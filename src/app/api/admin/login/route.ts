import { NextRequest, NextResponse } from 'next/server';
import { getSpaceSettings } from '@/lib/reservationService';
import { verifyPassword, hashPassword } from '@/lib/crypto';

/**
 * ==============================================================================
 * [POST /api/admin/login]
 * 관리자 마스터 비밀번호 검증 API
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

    // 1) 환경변수의 비밀번호와 직접 일치하거나
    // 2) 설정 DB의 비밀번호 해시와 일치하는지 검증
    const isDirectMatch = password === envAdminPassword;
    const isHashMatch = settings.admin_password_hash
      ? verifyPassword(password, settings.admin_password_hash)
      : false;

    if (!isDirectMatch && !isHashMatch) {
      return NextResponse.json(
        { success: false, message: '관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 관리자 세션 토큰(단순 서명 토큰) 생성
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
