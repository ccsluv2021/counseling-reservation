import { NextRequest, NextResponse } from 'next/server';
import { cancelReservation } from '@/lib/reservationService';
import { CancelReservationDto } from '@/types/reservation';

/**
 * ==============================================================================
 * [POST /api/reservations/cancel]
 * 예약 번호와 4자리 비밀번호(또는 관리자 인증)를 확인하여 예약을 취소합니다.
 * ==============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const body: CancelReservationDto = await request.json();

    const result = await cancelReservation(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('예약 취소 API 오류:', error);
    return NextResponse.json(
      { success: false, message: '예약 취소 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
