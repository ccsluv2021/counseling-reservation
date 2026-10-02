import { NextRequest, NextResponse } from 'next/server';
import { createBlackout, deleteBlackout } from '@/lib/reservationService';

/**
 * ==============================================================================
 * [POST & DELETE /api/admin/blackout]
 * 관리자 전용 시설 점검 및 행사 시간대 차단(Blackout) 등록 및 해제 API
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

    const { date, startTime, endTime, reason } = await request.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: '차단할 날짜와 시간을 입력해 주세요.' },
        { status: 400 }
      );
    }

    const result = await createBlackout(date, startTime, endTime, reason);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('차단 등록 오류:', error);
    return NextResponse.json(
      { success: false, message: '차단 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value || request.headers.get('x-admin-token');
    if (!adminToken) {
      return NextResponse.json(
        { success: false, message: '관리자 권한 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '삭제할 차단 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await deleteBlackout(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('차단 해제 오류:', error);
    return NextResponse.json(
      { success: false, message: '차단 해제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
