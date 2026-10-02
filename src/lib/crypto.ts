import crypto from 'crypto';

/**
 * ==============================================================================
 * [crypto.ts] 개인정보 보안 및 암호화 유틸리티
 * 
 * 청년공간 상담실 예약 시스템에서 민감한 사용자 개인정보(이름 마스킹, 연락처 암호화,
 * 간이 비밀번호 단방향 해시)를 안전하게 보호하기 위한 보안 함수 모음입니다.
 * ==============================================================================
 */

// 암호화 키 가져오기 (기본값 설정 및 32바이트 보정)
const SECRET_KEY_RAW = process.env.ENCRYPTION_SECRET || 'youth-counseling-secret-key-32ch!';
// AES-256 암호화는 정확히 32바이트(256비트) 키를 필요로 합니다.
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_KEY_RAW).digest(); // 32바이트 Buffer
const ALGORITHM = 'aes-256-gcm'; // 인증 태그(Auth Tag)를 지원하는 가장 강력한 표준 암호화 알고리즘

/**
 * 1. 이름 마스킹 함수 (가운데 글자 * 처리)
 * 
 * @example
 * maskName("홍길동") -> "홍*동"
 * maskName("김철")   -> "김*"
 * maskName("남궁선우") -> "남**우"
 */
export function maskName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  const len = trimmed.length;

  if (len <= 1) {
    return trimmed;
  }
  if (len === 2) {
    // 2글자: 첫 글자만 보이고 뒤는 *
    return trimmed[0] + '*';
  }
  if (len === 3) {
    // 3글자: 첫 글자와 마지막 글자 사이를 * 처리
    return trimmed[0] + '*' + trimmed[2];
  }
  // 4글자 이상: 첫 글자와 마지막 글자만 남기고 중간을 *로 채움
  const middleStars = '*'.repeat(len - 2);
  return trimmed[0] + middleStars + trimmed[len - 1];
}

/**
 * 2. 휴대폰 번호 마스킹 함수 (가운데 4자리 * 처리)
 * 
 * @example
 * maskPhone("010-1234-5678") -> "010-****-5678"
 * maskPhone("01012345678")   -> "010-****-5678"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * 3. 휴대폰 번호 양방향 암호화 (AES-256-GCM)
 * 데이터베이스에 저장하기 전에 원본 번호를 완벽하게 암호화합니다.
 * 반환값 형식: "iv:authTag:encryptedData" (Hex 문자열)
 */
export function encryptPhone(plainText: string): string {
  if (!plainText) return '';
  // 96비트(12바이트) 난수 초기화 벡터(IV) 생성
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 위변조 검증용 Auth Tag (16바이트)
  const authTag = cipher.getAuthTag().toString('hex');

  // IV, AuthTag, 암호문을 콜론(:)으로 구분하여 하나의 문자열로 결합
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * 4. 휴대폰 번호 복호화 (관리자 확인용)
 * 관리자 권한으로 예약자의 실제 연락처를 확인해야 할 때만 사용됩니다.
 */
export function decryptPhone(cipherCombined: string): string {
  if (!cipherCombined) return '';
  try {
    const parts = cipherCombined.split(':');
    if (parts.length !== 3) {
      // 암호화 형식이 아닌 경우(구버전 호환) 원문 반환
      return cipherCombined;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('연락처 복호화 실패:', error);
    return '복호화 실패';
  }
}

/**
 * 5. 간이 비밀번호(4자리) 및 관리자 암호 단방향 해싱 (SHA-256)
 * 단방향 해시이므로 데이터베이스가 해킹당하더라도 원래 비밀번호를 절대 역추적할 수 없습니다.
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  // 고정 솔트와 결합하여 레인보우 테이블 공격 방어
  const salt = 'youth_counseling_salt_#2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * 6. 비밀번호 일치 여부 검증 함수
 */
export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const hashedInput = hashPassword(plainPassword);
  // 타이밍 공격(Timing Attack) 방지를 위해 crypto.timingSafeEqual 사용
  try {
    const a = Buffer.from(hashedInput);
    const b = Buffer.from(storedHash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
