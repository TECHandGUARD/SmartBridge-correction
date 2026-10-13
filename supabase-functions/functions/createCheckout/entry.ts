import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { serverConnection, appUrl } from '../../shared/config.ts';
import { authorize, withHttp, failure } from '../../shared/http.ts';
import { readJson, text, uuid, consumeQuota, json, apiError, providerJson } from '../../shared/api.ts';
import { paymentSettings, planAmount, checkoutUrl } from '../../shared/payments.ts';
serve(withHttp(async (request) => {
    try {
        const { url, key } = serverConnection();
        const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const user = await authorize(request, client);
        const body = await readJson(request), product = text(body.product, 'product', 20), id = uuid(body.request_id, 'request_id');
        if (['amount', 'user_id', 'successUrl', 'cancelUrl', 'failureUrl'].some(field => Object.hasOwn(body, field)))
            failure(400, 'Price, account and callback URLs are chosen by the server');
        const settings = paymentSettings(), amount = planAmount(product);
        await consumeQuota(client, user.id, 'checkout');
        const { data: order, error } = await client.rpc('create_payment_order', { actor_id: user.id, request_id: id, product_key: product, quoted_amount: amount, payment_mode: settings.mode });
        if (error || !order)
            failure(409, 'Payment intent unavailable for this account');
        if (order.status === 'paid')
            return json({ order_id: order.id, status: 'paid' });
        if (order.checkout_id && order.redirect_url)
            return json({ order_id: order.id, redirect_url: checkoutUrl(order.redirect_url), amount_cents: order.amount_cents, mode: order.mode });
        const checkout = await providerJson('https://payments.yoco.com/api/checkouts', { method: 'POST', headers: { 'Authorization': `Bearer ${settings.key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `smartbridge-${order.id}` }, body: JSON.stringify({ amount: order.amount_cents, currency: 'ZAR', successUrl: appUrl('/Premium?payment=processing'), cancelUrl: appUrl('/Premium?payment=cancelled'), failureUrl: appUrl('/Premium?payment=failed'), metadata: { order_id: order.id }, externalId: order.id }) });
        const redirect = checkoutUrl(checkout.redirectUrl);
        if (!checkout.id || checkout.amount !== order.amount_cents || checkout.currency !== 'ZAR' || checkout.processingMode !== settings.mode)
            failure(502, 'Checkout did not match the order');
        const { error: saveError } = await client.from('payment_orders').update({ checkout_id: checkout.id, redirect_url: redirect }).eq('id', order.id).eq('user_id', user.id);
        if (saveError)
            failure(503, 'Checkout tracking unavailable. Retry the same request.');
        return json({ order_id: order.id, redirect_url: redirect, amount_cents: order.amount_cents, mode: settings.mode });
    }
    catch (error) {
        return apiError(error);
    }
}));
