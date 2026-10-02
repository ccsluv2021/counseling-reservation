# 🏢 청년공간 1:1 상담실 예약 시스템

> **청년공간 상주 근무자, 위촉 외부 상담사, 버크만 1:1 디브리퍼** 전용 간편 일정 예약 및 공간 공유 웹 애플리케이션입니다.

---

## ✨ 핵심 기능 및 특징

1. **간편한 링크 예약 (무가입 방식)**:
   - 복잡한 회원가입 절차 없이, 관리자가 공유해 준 링크로 바로 접속하여 원하는 시간대를 1~3시간 단위로 즉시 예약할 수 있습니다.
2. **개인정보 안심 마스킹 및 보안 (최우선 과제)**:
   - **이름 마스킹**: 협업 관계자 간 일정 조율을 위해 캘린더에는 성함 가운데가 마스킹(`홍*동`, `김*`, `남**우`)되어 안전하게 표기됩니다.
   - **내담자 정보 미수집**: 상담실을 이용하는 청년(내담자)의 개인정보는 일절 수집하지 않아 유출을 원천 방지합니다.
   - **연락처 암호화**: 예약자의 휴대폰 번호는 미국 국가 표준 `AES-256-GCM` 알고리즘으로 양방향 암호화되어 데이터베이스에 보관됩니다.
   - **간이 암호 단방향 해시**: 취소용 4자리 비밀번호는 단방향 솔트 해시(`SHA-256`)로 암호화되어 관리자조차 비밀번호 원문을 볼 수 없습니다.
3. **직관적인 타임라인 캘린더**:
   - 주간/일자별 1시간 단위 슬롯 제공
   - 소속별 색상 뱃지 구분 (`청년공간 근무자`, `외부 상담사`, `버크만 디브리퍼`)
4. **간편 예약 취소**:
   - 상단 `[내 예약 취소]` 메뉴에서 본인이 설정한 4자리 비밀번호를 입력하면 즉시 직접 취소 가능 (시간 변경은 취소 후 재예약)
5. **관리자 전용 대시보드 (`/admin`)**:
   - 마스터 비밀번호로 안전하게 로그인 (기본 암호: `admin1234`)
   - 전체 예약 대장 조회 (관리자에게는 원본 성함 및 복호화된 실제 연락처 노출)
   - 관리자 직권 취소 및 예약 검색/필터링
   - **예약 대장 엑셀(CSV) 다운로드** (한글 깨짐 없는 UTF-8 BOM 지원)
   - 시설 점검, 대청소, 센터 행사 시 **일정 차단(블랙아웃)** 기능
   - 평일/토요일 운영 시간 및 최대 이용 시간 동적 설정

---

## 🚀 빠른 시작 가이드 (초보자용)

### 1. 패키지 설치 및 로컬 실행
VS Code 터미널에서 다음 명령어를 실행합니다:

```bash
# 로컬 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하면 바로 작동하는 시스템을 확인할 수 있습니다!
> 💡 **안내:** Supabase를 아직 생성하지 않았더라도 로컬 테스트용 메모리 데이터베이스가 내장되어 있어 예약, 취소, 관리자 기능 등 모든 화면이 완벽하게 동작합니다.

---

## 🗄️ Supabase 데이터베이스 연동 방법 (단계별 가이드)

실제 영구 저장용 클라우드 데이터베이스를 연동하려면 다음 3단계만 진행하시면 됩니다:

### 1단계: Supabase 프로젝트 생성
1. [Supabase 공식 홈페이지](https://supabase.com)에 로그인 후 **[New project]**를 클릭합니다.
2. 프로젝트 이름(예: `youth-counseling`)과 데이터베이스 암호를 입력하고 리전을 **Seoul (ap-northeast-2)**로 선택합니다.

### 2단계: 데이터베이스 테이블 생성 (SQL 붙여넣기)
1. Supabase 대시보드 좌측 메뉴에서 **SQL Editor** 아이콘을 클릭합니다.
2. **[New query]** 버튼을 누릅니다.
3. 프로젝트 내 `supabase/migrations/001_create_counseling_tables.sql` 파일의 전체 내용을 복사하여 붙여넣고, 우측 하단의 **[Run]** 버튼을 클릭합니다.
4. "Success. No rows returned" 메시지가 나오면 테이블 및 중복 방지 제약조건이 완벽히 설치된 것입니다!

### 3단계: 환경변수 설정 (`.env.local`)
1. Supabase 대시보드 좌측 하단 **Project Settings** > **API** 메뉴로 이동합니다.
2. `Project URL`, `anon public key`, `service_role secret key`를 복사합니다.
3. 프로젝트 루트에 있는 `.env.local` 파일에 다음과 같이 입력합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://내프로젝트아이디.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=내_anon_키
SUPABASE_SERVICE_ROLE_KEY=내_service_role_키

# 연락처 암호화용 32글자 비밀키 (원하는 32자리 문자로 변경 가능)
ENCRYPTION_SECRET=youth-counseling-secret-key-32ch!

# 관리자 기본 마스터 비밀번호
ADMIN_PASSWORD=admin1234
```

서버를 다시 시작(`npm run dev`)하면 실제 Supabase DB와 완벽히 연동됩니다!

---

## 🌐 Vercel 무료 원클릭 배포 방법

근무자와 외부 상담사들에게 카카오톡이나 문자로 공유할 실제 웹 주소(예: `https://my-counseling.vercel.app`)를 만드는 방법입니다:

1. [GitHub](https://github.com)에 이 프로젝트 코드를 업로드(Push)합니다.
2. [Vercel](https://vercel.com)에 접속하여 GitHub 계정으로 로그인합니다.
3. **[Add New...]** > **[Project]**를 누르고 방금 올린 저장소를 선택(Import)합니다.
4. **Environment Variables** 항목을 열고, `.env.local`에 적었던 5가지 환경변수를 동일하게 입력합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ENCRYPTION_SECRET`
   - `ADMIN_PASSWORD`
5. **[Deploy]** 버튼을 누르면 1분 만에 전 세계 어디서든 접속 가능한 전용 링크가 생성됩니다!

---

## 🔒 폴더 및 소스코드 구조 안내

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── reservations/route.ts       # 예약 현황 조회 및 신규 신청 API
│   │   │   ├── reservations/cancel/route.ts# 예약 취소 API (4자리 비밀번호 검증)
│   │   │   └── admin/                      # 관리자 전용 API (로그인, 설정, 차단)
│   │   ├── admin/page.tsx                  # 관리자 대시보드 화면
│   │   ├── layout.tsx                      # 루트 레이아웃
│   │   └── page.tsx                        # 메인 예약 캘린더 페이지
│   ├── components/
│   │   ├── Header.tsx                      # 상단 브랜드 헤더 및 모달 바로가기
│   │   ├── CalendarTimeline.tsx            # 주간/일별 1시간 단위 타임라인 컴포넌트
│   │   ├── ReservationModal.tsx            # 예약 신청 모달
│   │   ├── CancelModal.tsx                 # 예약 취소 모달
│   │   └── AdminLoginModal.tsx             # 관리자 로그인 모달
│   ├── lib/
│   │   ├── crypto.ts                       # AES-256 암호화, 마스킹, SHA-256 해시 함수
│   │   ├── reservationService.ts           # 예약 CRUD, 중복 방지, 충돌 제어 서비스
│   │   ├── supabase.ts                     # Supabase 클라이언트 연결 설정
│   │   └── utils.ts                        # 날짜 포맷팅 및 스타일 유틸리티
│   └── types/
│       └── reservation.ts                  # 데이터 모델 인터페이스 정의
└── supabase/
    └── migrations/
        └── 001_create_counseling_tables.sql# PostgreSQL 마이그레이션 SQL 스크립트
```

---

## 💬 문의 및 지원
시스템 사용 중 설정 변경이나 추가 기능(공간 추가, 알림 연동 등)이 필요하시면 언제든 말씀해 주세요!
