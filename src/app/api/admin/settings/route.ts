import { NextRequest, NextResponse } from 'next/server';
import { updateSpaceSettings, getSpaceSettings } from '@/lib/reservationService';

/**
 * ==============================================================================
 * [POST /api/admin/settings]
 * 관리자 전용 상담실 운영 시간 및 휴무 요일 설정 변경
 * ==============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value || request.headers.get('x-admin-token');
    if (!adminToken) {
      return NextResponse.json(
        { success: false, message: '관리자 권한 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updated = await updateSpaceSettings(body);

    return NextResponse.json({
      success: true,
      message: '공간 설정이 성공적으로 저장되었습니다.',
      settings: updated,
    });
  } catch (error) {
    console.error('설정 저장 오류:', error);
    return NextResponse.json(
      { success: false, message: '설정 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
