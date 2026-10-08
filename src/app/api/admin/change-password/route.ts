import { NextRequest, NextResponse } from 'next/server';
import { getSpaceSettings, updateSpaceSettings } from '@/lib/reservationService';
import { verifyPassword, hashPassword } from '@/lib/crypto';

/**
 * ==============================================================================
 * [POST /api/admin/change-password]
 * 관리자 마스터 비밀번호 실시간 변경 API
 * 
 * - 관리자 권한(토큰) 확인
 * - 현재 비밀번호 검증 후 새 비밀번호를 SHA-256 단방향 해시로 암호화하여 DB 저장
 * - 새로운 세션 토큰을 발급하여 로그인 상태 유지
 * ==============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const adminToken =
      request.cookies.get('admin_token')?.value || request.headers.get('x-admin-token');

    if (!adminToken) {
      return NextResponse.json(
        { success: false, message: '관리자 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { success: false, message: '새 비밀번호는 최소 4자 이상으로 설정해 주세요.' },
        { status: 400 }
      );
    }

    const settings = await getSpaceSettings();
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin1234';

    // 1. 현재 비밀번호 검증 (DB 해시 우선, 없으면 환경변수 기본값 검증)
    let isCurrentValid = false;
    if (settings.admin_password_hash) {
      isCurrentValid = verifyPassword(currentPassword, settings.admin_password_hash);
    } else {
      isCurrentValid = currentPassword === envAdminPassword;
    }

    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: '현재 관리자 비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 2. 새 비밀번호 SHA-256 해시 생성 및 DB 업데이트
    const newPasswordHash = hashPassword(newPassword);
    await updateSpaceSettings({
      admin_password_hash: newPasswordHash,
    });

    // 3. 새 세션 토큰 발급
    const newToken = hashPassword(newPassword + '_admin_session_auth');

    const response = NextResponse.json({
      success: true,
      message: '관리자 마스터 비밀번호가 안전하게 변경되었습니다.',
      token: newToken,
    });

    // 쿠키 갱신
    response.cookies.set('admin_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24시간
    });

    return response;
  } catch (error) {
    console.error('관리자 비밀번호 변경 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류로 비밀번호 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
