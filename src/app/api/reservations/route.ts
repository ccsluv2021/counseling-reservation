import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicReservations,
  getBlackoutSlots,
  getSpaceSettings,
  createReservation,
} from '@/lib/reservationService';
import { CreateReservationDto } from '@/types/reservation';

/**
 * ==============================================================================
 * [GET /api/reservations]
 * 특정 날짜 범위의 상담실 예약 현황, 차단 슬롯, 기본 공간 설정을 조회합니다.
 * ==============================================================================
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'startDate와 endDate를 지정해 주세요.' },
        { status: 400 }
      );
    }

    // 병렬로 예약 목록, 차단 목록, 공간 설정 조회
    const [reservations, blackouts, settings] = await Promise.all([
      getPublicReservations(startDate, endDate),
      getBlackoutSlots(startDate, endDate),
      getSpaceSettings(),
    ]);

    return NextResponse.json({
      success: true,
      reservations,
      blackouts,
      settings,
    });
  } catch (error) {
    console.error('예약 현황 조회 API 오류:', error);
    return NextResponse.json(
      { success: false, message: '예약 현황을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * ==============================================================================
 * [POST /api/reservations]
 * 사용자가 입력한 상담실 예약 신청을 처리하고 데이터베이스에 안전하게 저장합니다.
 * ==============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateReservationDto = await request.json();

    const result = await createReservation(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('예약 신청 API 오류:', error);
    return NextResponse.json(
      { success: false, message: '예약 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
