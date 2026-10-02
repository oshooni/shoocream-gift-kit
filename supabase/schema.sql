-- ============================================================
-- 슈크림마을 선물가게 — 고객DB 설계도
-- 수퍼베이스 > SQL Editor > New query 에 통째로 붙여넣고 Run 한 번.
-- (여러 번 실행해도 안전하게 짜두었어요)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 상품표 — 진짜 가격은 여기 있습니다
--    화면(js/app.js)의 가격과 똑같이 맞춰주세요.
--    결제 금액은 항상 이 표를 기준으로 DB가 계산합니다.
-- ------------------------------------------------------------
create table if not exists public.products (
  id          text primary key,
  name        text not null,
  price       integer not null check (price > 0),
  active      boolean not null default true
);

insert into public.products (id, name, price) values
  ('light',     '가볍게 세트',   18900),
  ('signature', '시그니처 세트', 32000),
  ('premium',   '프리미엄 세트', 48000)
on conflict (id) do update set name = excluded.name, price = excluded.price;

-- ------------------------------------------------------------
-- 2. 고객표 — 카카오로 로그인하면 자동으로 한 줄 생겨요 (1주차)
-- ------------------------------------------------------------
create table if not exists public.customers (
  id            uuid primary key references auth.users (id) on delete cascade,
  nickname      text,
  avatar_url    text,
  first_source  text,              -- 처음 들어온 경로 (utm)
  memo          text,              -- 사장님 메모 (대시보드에서 직접 적기)
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- 로그인한 순간 고객표에 자동 기록하는 장치
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.customers (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             new.raw_user_meta_data->>'user_name',
             new.raw_user_meta_data->>'preferred_username'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. 테스트 결과표 — 가두리망의 그물 (2주차)
-- ------------------------------------------------------------
create table if not exists public.test_results (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  result_type         text not null,
  recommended_product text references public.products (id),
  answers             jsonb,
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. 주문표 (4주차)
-- ------------------------------------------------------------
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),   -- = 포트원 paymentId
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id   text not null references public.products (id),
  quantity     integer not null default 1 check (quantity between 1 and 10),
  amount       integer,                                       -- DB가 계산해서 채움
  status       text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  buyer_name   text,
  buyer_phone  text,
  message      text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- 금액 지키기 ①: 주문을 만들 때 브라우저가 보낸 금액은 무시하고
--               상품표 가격 × 수량으로 다시 계산해서 덮어씁니다.
create or replace function public.set_order_amount()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  unit_price integer;
begin
  select price into unit_price from public.products where id = new.product_id and active;
  if unit_price is null then
    raise exception '판매 중인 상품이 아니에요: %', new.product_id;
  end if;
  new.amount  := unit_price * new.quantity;
  new.status  := 'pending';
  new.paid_at := null;
  return new;
end;
$$;

drop trigger if exists orders_set_amount on public.orders;
create trigger orders_set_amount
  before insert on public.orders
  for each row execute function public.set_order_amount();
-- 금액 지키기 ②는 결제 후 서버(api/payment-complete.js)가 포트원에 직접 물어보고 대조합니다.

-- ------------------------------------------------------------
-- 5. RLS (행 단위 보안) — "누가 무엇을 볼 수 있나"
--    로그인 = 누구인지 / RLS = 무엇을 볼 수 있는지
-- ------------------------------------------------------------
alter table public.products     enable row level security;
alter table public.customers    enable row level security;
alter table public.test_results enable row level security;
alter table public.orders       enable row level security;

-- 상품: 누구나 볼 수 있음 (판매 중인 것만)
drop policy if exists "상품은 누구나 조회" on public.products;
create policy "상품은 누구나 조회" on public.products
  for select to anon, authenticated using (active);

-- 고객: 내 정보만 보고, 내 정보만 고침
drop policy if exists "내 고객정보 조회" on public.customers;
create policy "내 고객정보 조회" on public.customers
  for select to authenticated using (id = auth.uid());
drop policy if exists "내 고객정보 수정" on public.customers;
create policy "내 고객정보 수정" on public.customers
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 테스트 결과: 내 것만 저장하고 내 것만 봄
drop policy if exists "내 테스트 결과 저장" on public.test_results;
create policy "내 테스트 결과 저장" on public.test_results
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "내 테스트 결과 조회" on public.test_results;
create policy "내 테스트 결과 조회" on public.test_results
  for select to authenticated using (user_id = auth.uid());

-- 주문: 내 주문만 만들고 내 주문만 봄.
--      수정(결제 완료 처리)은 손님이 못 하고 서버만 할 수 있어요 → update 정책을 일부러 안 만듦
drop policy if exists "내 주문 만들기" on public.orders;
create policy "내 주문 만들기" on public.orders
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "내 주문 조회" on public.orders;
create policy "내 주문 조회" on public.orders
  for select to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------------
-- 6. 사장님용 한눈에 보기 (대시보드 > Table Editor 에서 확인)
--    고객별: 언제 왔고, 테스트 몇 번 했고, 몇 번 샀는지
--    ⚠️ security_invoker 로 만들어서 RLS가 그대로 적용돼요.
--       손님이 열면 자기 줄만, 대시보드(관리자)에서는 전체가 보여요.
-- ------------------------------------------------------------
create or replace view public.customer_overview
with (security_invoker = true) as
select
  c.nickname,
  c.first_source,
  c.created_at                                         as joined_at,
  c.last_seen_at,
  (select count(*) from public.test_results t where t.user_id = c.id) as tests,
  (select count(*) from public.orders o where o.user_id = c.id and o.status = 'paid') as paid_orders,
  (select coalesce(sum(amount), 0) from public.orders o where o.user_id = c.id and o.status = 'paid') as total_paid,
  c.memo
from public.customers c
order by c.created_at desc;
