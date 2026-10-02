/* ============================================================
   결제 확인 서버 (버셀이 자동으로 /api/payment-complete 로 열어줘요)

   왜 서버가 필요할까?
   브라우저는 손님 손에 있어서 "결제됐어요"를 얼마든지 꾸밀 수 있어요.
   그래서 서버가 포트원에 직접 물어보고, DB의 주문 금액과 똑같을 때만 "결제 완료"로 바꿉니다.

   이 파일이 쓰는 비밀 열쇠 (버셀 > Settings > Environment Variables 에만 넣기)
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY   ← 절대 브라우저(config.js)에 넣지 않기
   - PORTONE_API_SECRET          ← 절대 브라우저(config.js)에 넣지 않기
   ============================================================ */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'POST만 받아요' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORTONE_API_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PORTONE_API_SECRET) {
    return res.status(500).json({ message: '서버 환경변수가 설정되지 않았어요 (README 5단계)' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const paymentId = body && body.paymentId;
  if (!paymentId || !/^[0-9a-f-]{36}$/i.test(paymentId)) {
    return res.status(400).json({ message: '주문 번호가 올바르지 않아요' });
  }

  const db = (path, init = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(init.headers || {}),
      },
    });

  try {
    // 1) 우리 DB의 주문 찾기
    const orderRes = await db(`orders?id=eq.${paymentId}&select=id,amount,status`);
    const orders = await orderRes.json();
    const order = Array.isArray(orders) ? orders[0] : null;
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없어요' });
    if (order.status === 'paid') return res.status(200).json({ status: 'paid' }); // 이미 처리됨

    // 2) 포트원에 "이 결제 진짜 됐어?" 직접 물어보기
    const pRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
    });
    if (!pRes.ok) {
      return res.status(502).json({ message: '포트원에서 결제 정보를 가져오지 못했어요' });
    }
    const payment = await pRes.json();

    // ★ 실결제로 바꾼 뒤에는 아래 주석을 풀어주세요.
    //    누군가 테스트 채널로 결제해놓고 "결제했다"고 속이는 걸 막아줘요.
    // if (payment.channel && payment.channel.type !== 'LIVE') {
    //   return res.status(400).json({ status: 'failed', message: '테스트 결제는 인정되지 않아요' });
    // }

    // 3) 금액 대조 — DB 금액과 실제 결제 금액이 다르면 완료 처리하지 않음
    const paidTotal = payment && payment.amount ? payment.amount.total : null;
    if (payment.status === 'PAID' && paidTotal === order.amount) {
      await db(`orders?id=eq.${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
      });
      return res.status(200).json({ status: 'paid' });
    }

    if (payment.status === 'PAID' && paidTotal !== order.amount) {
      // 금액이 다르면 위조 시도일 수 있어요. 실패로 표시하고 확인 후 포트원 콘솔에서 취소하세요.
      await db(`orders?id=eq.${paymentId}`, { method: 'PATCH', body: JSON.stringify({ status: 'failed' }) });
      return res.status(400).json({ status: 'failed', message: '결제 금액이 주문 금액과 달라요. 판매자에게 문의해주세요.' });
    }

    if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      await db(`orders?id=eq.${paymentId}`, { method: 'PATCH', body: JSON.stringify({ status: payment.status === 'FAILED' ? 'failed' : 'cancelled' }) });
    }
    return res.status(200).json({ status: String(payment.status || 'unknown').toLowerCase(), message: '아직 결제가 완료되지 않았어요' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '결제 확인 중 오류가 났어요' });
  }
};
