# 🧁 슈크림마을 선물가게 — 판매 사이트 스타터 킷

노슈니 4주 정규반 「내 제품을 구매해 줄 진짜 고객 만들기」 실습용 견본 사이트입니다.
완성된 판매 사이트 한 벌을 통째로 가져가서, 글자·사진·상품만 내 것으로 바꿔 쓰면 됩니다.

> 이케아 쇼룸처럼 꾸며진 방을 그대로 가져가서, 커튼이랑 액자만 내 취향으로 바꾸는 거예요.

---

## 한눈에 보기

| 주차 | 이 킷에서 쓰는 부분 | 켜지는 기능 |
|---|---|---|
| 1주 · 판매 사이트 + 로그인 + 고객DB | `index.html` · `config.js` · `schema.sql` | 사이트 배포, 카카오 로그인, 고객표 자동 기록 |
| 2주 · 고객 가두리망 | `test.html` · `result.html` | 테스트(미끼) → 결과 저장하려면 로그인 → DB에 쌓임 |
| 3주 · 콘텐츠 | 링크 끝에 `?utm_source=...` | 어느 콘텐츠에서 온 고객인지 고객표에 기록 |
| 4주 · 결제 유저플로우 | `order.html` · `complete.html` · `api/payment-complete.js` | 포트원 테스트 결제, 서버 금액 검증, 내 주문 |

## 화면 구성

| 파일 | 역할 |
|---|---|
| `public/index.html` | 판매 상세페이지 |
| `public/test.html` | 선물 테스트 6문항 (미끼) |
| `public/result.html` | 결과 + 상품 추천 + 카카오 로그인 유도 |
| `public/login-done.html` | 로그인 직후 고객DB 기록하고 원래 화면으로 돌려보내기 |
| `public/order.html` | 주문서 + 결제창 |
| `public/complete.html` | 주문 완료 (서버가 확인한 결과만 보여줌) |
| `public/mypage.html` | 내 주문 · 저장한 테스트 결과 |
| `public/terms.html` | 이용약관·환불규정 (결제 심사용) |

## 뒤에서 돌아가는 도구

| 하는 일 | 도구 | 비유 |
|---|---|---|
| 사이트 올리기 | 버셀 (Vercel) | 가게 건물 |
| 로그인 · 고객DB | 수퍼베이스 (Supabase) + 카카오 | 손님 명부 |
| 결제 | 포트원 (PortOne) V2 | 계산대 |

---

## 0단계. 일단 열어보기 (설정 없이 1분)

`public/index.html` 파일을 더블클릭해서 브라우저로 여세요.
상품·테스트·결과까지 다 보입니다. 맨 위에 "둘러보기 모드" 띠가 보이면 정상이에요.
로그인과 결제는 아래 설정을 마치면 켜집니다.

---

## 사전 준비: 계정 5개 (개강 전에)

모두 무료로 시작할 수 있어요. 같은 구글 계정으로 가입하면 편해요.

1. 깃허브 — github.com
2. 버셀 — vercel.com (깃허브로 가입)
3. 수퍼베이스 — supabase.com (깃허브로 가입)
4. 카카오 디벨로퍼스 — developers.kakao.com (내 카카오 계정)
5. 포트원 — admin.portone.io (4주차 전까지)

---

## 1단계. 수퍼베이스: 손님 명부 만들기 (1주차)

1. 수퍼베이스 → New project → 이름 아무거나, 비밀번호 저장, 지역은 Northeast Asia (Seoul)
2. 왼쪽 메뉴 SQL Editor → New query
3. `supabase/schema.sql` 내용을 통째로 붙여넣고 Run
4. 왼쪽 Table Editor에 `products` `customers` `test_results` `orders` 4개가 생겼으면 성공
5. Project Settings → API (또는 Data API) 에서 두 값을 복사해 둡니다
   - Project URL → `SUPABASE_URL`
   - anon public 키 → `SUPABASE_ANON_KEY`
   - service_role 키 → 5단계에서 버셀에만 넣습니다. 절대 config.js에 넣지 마세요

## 2단계. 사이트에 내 정보 넣기 (1주차)

`public/js/config.js` 를 열고 1단계에서 복사한 두 값을 붙여넣습니다.

```js
SUPABASE_URL: 'https://abcdefgh.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOi...',
SHOP_NAME: '내 가게 이름',
CONTACT: '인스타그램 @내계정 DM',
```

내 상품으로 바꾸는 곳 (★ 표시를 따라가세요)
- 상품 이름·가격·구성: `public/js/app.js` 맨 위 `PRODUCTS`
- 페이지 문구·사진: `public/index.html` 의 ★ 표시
- 색: `public/css/style.css` 맨 위 `:root`

### ⚠️ 여기서 제일 많이 막혀요 — 두 가지만 지키면 됩니다

**① `light` `signature` `premium` 이라는 id는 절대 바꾸지 마세요**

상품 **이름**은 마음껏 바꾸셔도 됩니다. 하지만 그 앞에 붙은 `light:` `signature:` `premium:` 이 영어 단어는
사람이 읽는 이름이 아니라 **프로그램끼리 상품을 알아보는 번호표**예요. 네 군데에 똑같이 적혀 있습니다.

| 어디 | 무엇 |
|---|---|
| `public/js/app.js` 의 `PRODUCTS` | 상품 정보 |
| `public/js/app.js` 의 `QUESTIONS` 5번 문항 | 예산에 따른 추천 |
| `public/js/app.js` 의 `TYPES` | 결과 유형 6개의 추천 상품 |
| `supabase/schema.sql` 의 `products` 표 | 진짜 가격 |

한 군데만 바꾸면 **결과 화면에 추천 상품이 안 나오거나 주문이 실패**하는데, 화면에 아무 에러도 안 떠서
원인을 찾기 아주 어렵습니다. 그냥 두세요. 손님 눈에는 보이지 않는 글자예요.

```js
// 이렇게 바꾸세요 ✅ — 번호표(light)는 그대로, 이름만 내 상품으로
light: { id: 'light', name: '소프트 쿠키 세트', price: 15000, ... }

// 이러면 깨집니다 ❌ — 번호표를 바꿈
cookie: { id: 'cookie', name: '소프트 쿠키 세트', price: 15000, ... }
```

**② 가격은 반드시 두 군데를 똑같이 고쳐야 합니다**

| 어디 | 역할 |
|---|---|
| `public/js/app.js` 의 `PRODUCTS` → `price` | 손님 **화면에 보이는** 가격 |
| 수퍼베이스 `products` 표의 `price` | 실제로 **결제되는** 가격 |

실제 결제 금액은 언제나 수퍼베이스 표를 기준으로 계산합니다(손님이 금액을 조작하지 못하게 하는 장치예요).
그래서 `app.js`만 32000원으로 고치고 수퍼베이스를 18900원 그대로 두면,
**화면에는 32,000원이라고 써놓고 18,900원이 결제**됩니다.

수퍼베이스 쪽은 왼쪽 메뉴 **Table Editor → `products`** 에서 숫자만 직접 고치면 됩니다.

## 3단계. 버셀에 올리기 (1주차)

1. 깃허브 → New repository → 이름 정하고 Create
2. "uploading an existing file" 클릭 → 이 폴더 안의 내용물 전체(`public`, `api`, `supabase`, `vercel.json`, `README.md`)를 끌어다 놓기 → Commit
3. 버셀 → Add New → Project → 방금 만든 저장소 Import
4. Framework Preset은 Other 그대로 → Deploy
5. 나온 주소(`https://내프로젝트.vercel.app`)를 복사해 둡니다

> 클로드 코드를 쓰면 "이 폴더를 깃허브에 올리고 버셀에 배포해줘"로 2~5를 대신 시킬 수 있어요.

## 4단계. 카카오 로그인 켜기 (1주차)

카카오 디벨로퍼스
1. 내 애플리케이션 → 애플리케이션 추가하기
2. 앱 키에서 REST API 키 복사
3. 카카오 로그인 → 활성화 ON
4. 리다이렉트 URI에 등록: `https://내프로젝트아이디.supabase.co/auth/v1/callback`
   (수퍼베이스 Project URL 뒤에 `/auth/v1/callback`)
5. 동의항목 → 닉네임, 프로필 사진 → 필수 또는 선택 동의로 설정
6. 보안 → Client Secret 코드 생성 → 활성화 → 복사

수퍼베이스
1. Authentication → Sign In / Providers → Kakao
2. Enable ON, REST API 키와 Client Secret 붙여넣기
3. 이메일은 받지 않으므로 "Allow users without an email" 옵션이 보이면 ON
4. Authentication → URL Configuration
   - Site URL: `https://내프로젝트.vercel.app`
   - Redirect URLs에 추가: `https://내프로젝트.vercel.app/**`

확인: 내 사이트 → 카카오 로그인 → 수퍼베이스 Table Editor의 `customers` 표에 내 닉네임이 한 줄 생기면 1주차 완성 🎉

## 5단계. 결제 켜기 (4주차)

포트원 (admin.portone.io)
1. 회원가입 → 결제 연동 → 연동 정보
2. 테스트 채널 추가 (PG사는 수업에서 안내하는 것으로) → 채널 키 복사
3. Store ID 복사
4. API Secret 발급 → 복사 (버셀에만 넣습니다)

`public/js/config.js`
```js
PORTONE_STORE_ID: 'store-...',
PORTONE_CHANNEL_KEY: 'channel-key-...',
```

버셀 → 내 프로젝트 → Settings → Environment Variables 에 3개 추가 후 Redeploy

| 이름 | 값 |
|---|---|
| `SUPABASE_URL` | 수퍼베이스 Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 수퍼베이스 service_role 키 |
| `PORTONE_API_SECRET` | 포트원 API Secret |

확인: 주문하기 → 테스트 결제 → 완료 화면 → `orders` 표의 status가 `paid` 로 바뀌면 4주차 완성 🎉

테스트 결제는 실제로 돈이 빠져나가지 않아요. 실결제는 사업자 등록 → 포트원에서 PG 심사 → 실연동 채널 키로 바꾸고, `api/payment-complete.js`의 ★ 주석을 풀면 됩니다.

---

## 꼭 알아야 할 것 3가지 (수업에서 다룹니다)

1. 어떤 열쇠를 브라우저에 둬도 되나
   - 괜찮음: 수퍼베이스 anon 키, 포트원 Store ID · Channel Key → `config.js`
   - 절대 안 됨: 수퍼베이스 service_role 키, 포트원 API Secret → 버셀 환경변수에만
2. 금액은 두 번 막는다
   - 주문 만들 때: DB가 상품표 가격으로 금액을 다시 계산해서 덮어씀 (`schema.sql` 4번)
   - 결제 후: 서버가 포트원에 직접 물어보고 실제 결제 금액과 대조 (`api/payment-complete.js`)
3. 로그인과 RLS는 다르다
   - 로그인은 "누구인지", RLS는 "무엇을 볼 수 있는지"
   - `mypage.html` 코드에는 "내 것만" 조건이 한 줄도 없는데 내 주문만 보여요

## 사장님용: 고객DB 보는 법

수퍼베이스 → Table Editor
- `customer_overview` — 고객별로 언제 왔는지, 어디서 왔는지, 테스트 몇 번, 결제 몇 번, 총 얼마
- `customers` 의 `memo` 칸에 직접 메모 가능
- `test_results` — 누가 어떤 유형이 나왔는지 (2주차 가두리망 분석)

콘텐츠별 유입 보기 (3주차): 콘텐츠에 넣는 링크 끝에 이렇게 붙이세요.
`https://내프로젝트.vercel.app/test.html?utm_source=instagram&utm_content=1016_reels`

## 막혔을 때

| 증상 | 확인할 것 |
|---|---|
| 계속 "둘러보기 모드"로 나옴 | `config.js`에 URL과 anon 키를 넣었는지, 저장 후 다시 배포했는지 |
| 카카오 로그인 후 에러 | 카카오 리다이렉트 URI 철자, 수퍼베이스 Redirect URLs에 내 주소 + `/**` |
| 로그인은 되는데 customers 표가 비어 있음 | `schema.sql`을 끝까지 Run 했는지 (트리거) |
| 주문 만들기 실패 | 수퍼베이스 `products` 표에 같은 id(`light` 등)가 있는지 (2단계 ① 참고) |
| 결과 화면에 추천 상품이 비어 있음 | 상품 id를 바꾸지 않았는지 (2단계 ①) |
| 화면 가격과 결제 금액이 다름 | 수퍼베이스 `products` 표의 가격도 같이 고쳤는지 (2단계 ②) |
| 결제 후 "확인에 문제" | 버셀 환경변수 3개를 넣고 Redeploy 했는지 |

---

만든 사람: 노슈니(오수인) · 노슈니 4주 정규반 실습용
이 킷을 바탕으로 다른 사람에게 가르치거나 배포할 때는 출처(노슈니)를 표기해주세요.
