import { NextRequest, NextResponse } from 'next/server';
import { getSpaceSettings } from '@/lib/reservationService';
import { verifyPassword, hashPassword } from '@/lib/crypto';

/**
 * ==============================================================================
 * [POST /api/admin/login]
 * 관리자 마스터 비밀번호 검증 API
 * 
 * - DB(space_settings)에 저장된 관리자 비밀번호 해시를 최우선으로 검증
 * - 변경된 새 비밀번호로만 안전하게 로그인 승인
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

    // DB에 암호화 해시가 저장되어 있으면 해시로 엄격 검증, 없을 때만 기본값 폴백
    let isMatch = false;
    if (settings.admin_password_hash) {
      isMatch = verifyPassword(password, settings.admin_password_hash);
    } else {
      isMatch = password === envAdminPassword;
    }

    if (!isMatch) {
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
