/* ============================================================
   ★ 여기만 바꾸면 됩니다 ★
   비워두면 "둘러보기 모드"로 동작해요.
   (상품·테스트·결과는 보이고, 로그인·결제만 안내 문구로 바뀝니다)

   여기 넣는 값은 브라우저에 공개돼도 괜찮은 값만입니다.
   ❌ 절대 넣으면 안 되는 것: 수퍼베이스 service_role 키, 포트원 API Secret
      → 이 두 개는 버셀 환경변수에만 넣습니다 (README 참고)
   ============================================================ */
window.SHOP_CONFIG = {
  // 1주차: 수퍼베이스 > Project Settings > API
  SUPABASE_URL: '',        // 예: 'https://abcdefgh.supabase.co'
  SUPABASE_ANON_KEY: '',   // 'anon public' 키 (긴 문자열)

  // 4주차: 포트원 관리자콘솔 > 결제 연동 > 연동 정보
  PORTONE_STORE_ID: '',    // 'store-' 로 시작
  PORTONE_CHANNEL_KEY: '', // 'channel-key-' 로 시작 (테스트 채널)

  // 내 가게 정보 — 화면 곳곳에 들어갑니다
  SHOP_NAME: '슈크림마을 선물가게',
  CONTACT: '인스타그램 @shoocream_village DM',
};
