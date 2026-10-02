/* ============================================================
   슈크림마을 선물가게 — 공용 스크립트
   모든 화면이 이 파일 하나를 같이 씁니다.
   ============================================================ */
(function () {
  var C = window.SHOP_CONFIG || {};

  /* ---------- 1. 상품표 ----------
     ★ 내 상품으로 바꾸는 곳 (id는 영어 소문자로)
     ⚠️ 가격은 화면 표시용입니다. 실제 결제 금액은 수퍼베이스 products 표의 가격으로
        DB가 다시 계산합니다. 가격을 바꾸면 SQL의 products 표도 같이 바꾸세요. */
  var PRODUCTS = {
    light: {
      id: 'light', name: '가볍게 세트', price: 18900, tag: '부담 없이 툭',
      items: ['두바이 쫀득쿠키 3종', '뚱카롱 2구'],
      desc: '집들이, 첫 방문, 가벼운 감사 인사에. 받는 사람도 부담 없는 크기예요.'
    },
    signature: {
      id: 'signature', name: '시그니처 세트', price: 32000, tag: '가장 많이 골라요',
      items: ['두바이 쫀득쿠키 5종', '뚱카롱 4구', '메시지 카드'],
      desc: '3만원대 선물의 정답. 생일, 기념일, 고마운 사람에게 딱 좋은 구성이에요.'
    },
    premium: {
      id: 'premium', name: '프리미엄 세트', price: 48000, tag: '격식 있는 자리',
      items: ['두바이 쫀득쿠키 5종', '뚱카롱 6구', '오레오 수건케이크', '보냉백'],
      desc: '어른께, 거래처에, 꼭 기억에 남아야 하는 자리에.'
    }
  };

  /* ---------- 2. 선물 테스트 ----------
     두 개의 축을 잽니다.
     - 관계 거리 (r): 가까움 / 중간 / 멂
     - 목적 (p): 부담 없이 / 기억에 남기기
     Q5 예산은 추천 상품을 바꾸고, Q6 취향 아는 정도는 결과 문구만 바꿉니다. */
  var QUESTIONS = [
    { q: '선물을 받을 사람은 누구인가요?', a: [
      { t: '가족이나 오래된 친구', r: 2 },
      { t: '자주 보는 동료·지인', r: 1 },
      { t: '거래처, 어른, 처음 뵙는 분', r: 0 } ] },
    { q: '어떤 자리에 들고 가나요?', a: [
      { t: '생일·기념일', p: 2 },
      { t: '감사 인사·축하', p: 1 },
      { t: '집들이·방문·모임', p: 0 } ] },
    { q: '그 사람과 얼마나 자주 연락하나요?', a: [
      { t: '거의 매일', r: 2 },
      { t: '한 달에 몇 번', r: 1 },
      { t: '특별한 일이 있을 때만', r: 0 } ] },
    { q: '선물을 받은 그 사람이 어떻게 느끼면 좋겠어요?', a: [
      { t: '오래 기억에 남았으면', p: 2 },
      { t: '센스 있다고 느꼈으면', p: 1 },
      { t: '부담 없이 받았으면', p: 0 } ] },
    { q: '예산은 어느 정도 생각하세요?', a: [
      { t: '2만원 안팎', b: 'light' },
      { t: '3만원대', b: 'signature' },
      { t: '4만원 이상', b: 'premium' },
      { t: '아직 정하지 않았어요', b: null } ] },
    { q: '그 사람의 취향을 얼마나 알고 있나요?', a: [
      { t: '꽤 잘 알아요', k: 'know' },
      { t: '대충은 알아요', k: 'some' },
      { t: '전혀 몰라요', k: 'none' } ] }
  ];

  var TYPES = {
    'close-light': { name: '편하게 툭, 마음은 꽉', emoji: '🧁', product: 'light',
      line: '가까운 사이일수록 거창한 것보다 자주, 가볍게. 받는 사람이 "뭘 이런 걸" 하고 웃는 선물이 제일 오래 가요.' },
    'close-memo': { name: '속까지 꽉 찬 진심', emoji: '💝', product: 'signature',
      line: '오래 본 사이라 오히려 고르기 어렵죠. 메시지 카드 한 장이 선물보다 더 오래 남아요.' },
    'mid-light': { name: '센스 있는 첫인사', emoji: '🍪', product: 'light',
      line: '자주 보지만 아주 가깝진 않은 사이. 부담은 덜고, 센스는 남기는 크기가 정답이에요.' },
    'mid-memo': { name: '기억에 남는 한 방', emoji: '✨', product: 'signature',
      line: '이번 선물로 한 단계 가까워질 수 있어요. "어디서 샀어?"라는 말이 나오는 걸로.' },
    'far-light': { name: '깔끔한 예의', emoji: '🎀', product: 'signature',
      line: '처음 뵙는 자리에선 너무 가벼워도, 너무 무거워도 어색해요. 포장이 단정한 3만원대가 안전해요.' },
    'far-memo': { name: '격식 있는 감동', emoji: '👑', product: 'premium',
      line: '어른이나 거래처처럼 꼭 잘 보여야 하는 자리. 구성과 보냉백까지 챙긴 세트가 마음을 대신 말해줘요.' }
  };

  var KNOW_LINE = {
    know: '취향을 알고 계시니, 메시지 카드에 그 사람만 아는 이야기 한 줄을 적어보세요.',
    some: '대충 아는 정도라면 여러 맛이 골고루 든 구성이 실패가 없어요.',
    none: '취향을 몰라도 괜찮아요. 그래서 이 세트는 호불호 없는 맛으로만 채웠어요.'
  };

  function scoreTest(answers) {
    // answers: 선택한 보기 번호 배열 (길이 6)
    var r = 0, p = 0, budget = null, know = 'some';
    answers.forEach(function (ai, qi) {
      var o = QUESTIONS[qi].a[ai];
      if (o.r != null) r += o.r;
      if (o.p != null) p += o.p;
      if (o.b !== undefined) budget = o.b;
      if (o.k) know = o.k;
    });
    var rel = r >= 3 ? 'close' : (r >= 2 ? 'mid' : 'far');   // r: 0~4
    var pur = p >= 3 ? 'memo' : 'light';                       // p: 0~4
    var key = rel + '-' + pur;
    var type = TYPES[key];
    var product = budget || type.product;                      // 예산이 유형보다 우선
    return { key: key, type: type, product: product, know: know, knowLine: KNOW_LINE[know] };
  }

  /* ---------- 3. 수퍼베이스 연결 ---------- */
  var sb = null;
  var CONNECTED = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  if (CONNECTED) {
    sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  }
  var PAY_READY = !!(C.PORTONE_STORE_ID && C.PORTONE_CHANNEL_KEY);

  /* ---------- 4. 작은 도구들 ---------- */
  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function page(name, params) {
    var u = name + '.html';
    if (params) u += '?' + new URLSearchParams(params).toString();
    return u;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  // 유입 경로 기억하기 (2·3주차: 어느 콘텐츠에서 왔는지)
  (function rememberSource() {
    var src = qs('utm_source');
    if (src && !store('first_source')) {
      store('first_source', [src, qs('utm_medium'), qs('utm_campaign'), qs('utm_content')].filter(Boolean).join(' / '));
    }
  })();

  function getUser() {
    if (!sb) return Promise.resolve(null);
    return sb.auth.getSession().then(function (r) { return r.data.session ? r.data.session.user : null; });
  }

  function login(nextPage) {
    if (!sb) { alertBrowse('카카오 로그인'); return; }
    var next = nextPage || (location.pathname.split('/').pop() || 'index.html') + location.search;
    store('after_login', next);
    sb.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: location.origin + '/' + 'login-done.html',
        scopes: 'profile_nickname profile_image'
      }
    });
  }

  function logout() {
    if (!sb) return;
    sb.auth.signOut().then(function () { location.href = 'index.html'; });
  }

  // 로그인 직후 고객DB 한 줄 업데이트 (최근 방문 · 처음 들어온 경로)
  function touchCustomer(user) {
    if (!sb || !user) return Promise.resolve();
    var patch = { last_seen_at: new Date().toISOString() };
    var src = store('first_source');
    return sb.from('customers').select('first_source').eq('id', user.id).maybeSingle().then(function (r) {
      if (r.data && !r.data.first_source && src) patch.first_source = src;
      return sb.from('customers').update(patch).eq('id', user.id);
    });
  }

  // 테스트 결과를 DB에 저장 (로그인한 사람만)
  function saveTestResult(user) {
    var pending = store('pending_result');
    if (!sb || !user || !pending) return Promise.resolve(false);
    return sb.from('test_results').insert({
      result_type: pending.key,
      recommended_product: pending.product,
      answers: pending.answers
    }).then(function (r) {
      if (!r.error) { try { localStorage.removeItem('pending_result'); } catch (e) {} return true; }
      console.warn(r.error); return false;
    });
  }

  function alertBrowse(what) {
    showToast('지금은 둘러보기 모드예요. ' + what + '은(는) js/config.js에 키를 넣으면 켜집니다.');
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = 'show';
    clearTimeout(t._h); t._h = setTimeout(function () { t.className = ''; }, 3600);
  }

  // 상단 메뉴의 로그인 버튼 / 둘러보기 배지
  function renderNav() {
    var slot = document.getElementById('nav-auth');
    if (!document.getElementById('browse-badge') && !CONNECTED) {
      var b = document.createElement('div');
      b.id = 'browse-badge';
      b.textContent = '둘러보기 모드 · 로그인과 결제는 설정 후 켜져요';
      document.body.prepend(b);
    }
    if (!slot) return;
    getUser().then(function (u) {
      if (u) {
        slot.innerHTML = '<a href="mypage.html">내 주문</a><button type="button" class="link-btn" id="logout-btn">로그아웃</button>';
        document.getElementById('logout-btn').onclick = logout;
      } else {
        slot.innerHTML = '<button type="button" class="kakao-sm" id="login-btn">카카오 로그인</button>';
        document.getElementById('login-btn').onclick = function () { login(); };
      }
    });
  }

  document.addEventListener('DOMContentLoaded', renderNav);

  window.Shop = {
    C: C, PRODUCTS: PRODUCTS, QUESTIONS: QUESTIONS, TYPES: TYPES, scoreTest: scoreTest,
    sb: sb, CONNECTED: CONNECTED, PAY_READY: PAY_READY,
    won: won, qs: qs, page: page, esc: esc, store: store,
    getUser: getUser, login: login, logout: logout, touchCustomer: touchCustomer,
    saveTestResult: saveTestResult, alertBrowse: alertBrowse, showToast: showToast
  };
})();
