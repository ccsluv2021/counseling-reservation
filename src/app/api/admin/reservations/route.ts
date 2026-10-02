import { NextRequest, NextResponse } from 'next/server';
import { getAdminReservations } from '@/lib/reservationService';

/**
 * ==============================================================================
 * [GET /api/admin/reservations]
 * 관리자 전용 전체 예약 목록 조회 (복호화된 원본 연락처 포함)
 * ==============================================================================
 */
export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value || request.headers.get('x-admin-token');

    if (!adminToken) {
      return NextResponse.json(
        { success: false, message: '관리자 권한 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const reservations = await getAdminReservations();

    return NextResponse.json({
      success: true,
      reservations,
    });
  } catch (error) {
    console.error('관리자 예약 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '예약 내역을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
