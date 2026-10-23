const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Helper for making HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('  SIX WINGS E-COMMERCE — AUTOMATED END-TO-END TEST SUITE');
  console.log('  Verifying all 12 Prompt Test Cases & Order-to-Payment Flow');
  console.log('=============================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failedCount++;
    }
  }

  try {
    // 0. HEALTH CHECK
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.brand === 'Six Wings', 'API Server online & healthy');

    // 1. TEST CASE 1: Customer adds ₹799 sample product to cart
    console.log('\n--> [TEST CASE 1 & 2]: Customer selects product (₹799), size, color & quantity');
    const productsRes = await request('GET', '/products');
    const sampleProduct = productsRes.body.products.find((p) => p.price === 799);
    assert(sampleProduct && sampleProduct.price === 799, `Found sample test product at ₹799: "${sampleProduct?.name}"`);

    const sessionId = `test_sess_${Date.now()}`;
    const addToCartRes = await request('POST', '/cart/add', {
      productId: sampleProduct.id,
      size: 'M',
      color: 'Onyx Black',
      quantity: 1
    }, { 'x-session-id': sessionId });

    assert(addToCartRes.status === 200 && addToCartRes.body.success, 'Added product to cart with size M, color Onyx Black');
    assert(addToCartRes.body.subtotal === 799, 'Cart subtotal matches exact test price ₹799');
    assert(addToCartRes.body.delivery_charge === 99, 'Delivery charge is ₹99 for orders under ₹999');
    assert(addToCartRes.body.total_amount === 898, 'Total calculated correctly (₹799 + ₹99 = ₹898)');

    // 2. TEST CASE 11: Invalid input rejected
    console.log('\n--> [TEST CASE 11]: Invalid input and checkout validation');
    const invalidCheckoutRes = await request('POST', '/orders', {
      customer_name: '', // Empty name
      customer_email: 'invalid-email',
      customer_phone: '123'
    }, { 'x-session-id': sessionId });
    assert(invalidCheckoutRes.status === 400 && !invalidCheckoutRes.body.success, 'Invalid checkout details properly rejected with 400 Bad Request');

    // 3. TEST CASE 3 & 4: Customer enters delivery details and places order
    console.log('\n--> [TEST CASE 3 & 4]: Customer places order with delivery details');
    const orderPayload = {
      customer_name: 'Alex Turner',
      customer_email: 'alex@example.com',
      customer_phone: '9876543210',
      shipping_address: '42, Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin_code: '560038',
      order_notes: 'Urgent college project demo delivery',
      payment_method: 'upi_simulator'
    };

    const orderRes = await request('POST', '/orders', orderPayload, { 'x-session-id': sessionId });
    assert(orderRes.status === 201 && orderRes.body.success, 'Order successfully created in persistent database');
    const order = orderRes.body.order;
    assert(order.id.startsWith('SW-'), `Unique Order ID generated: ${order.id}`);
    assert(order.total_amount === 898, `Order total matches ₹898`);
    assert(order.payment_status === 'unpaid', 'Order status initialized to "unpaid" prior to simulation');
    assert(order.order_status === 'Pending', 'Order status initialized to "Pending"');

    // 4. TEST CASE 5: Customer simulates successful payment
    console.log('\n--> [TEST CASE 5 & 6]: Customer simulates successful payment & saves demo txn');
    const initPayRes = await request('POST', '/payments/initiate', { orderId: order.id });
    assert(initPayRes.status === 200 && initPayRes.body.demo_payment_details.demo_upi_id === 'sixwings.demo@upi',
      'Payment simulator session initialized with Demo UPI ID: sixwings.demo@upi');

    const simSuccessRes = await request('POST', '/payments/simulate', {
      orderId: order.id,
      action: 'success',
      idempotencyKey: `idem_test_${Date.now()}`
    });
    assert(simSuccessRes.status === 200 && simSuccessRes.body.success, 'Simulated payment completed successfully');
    const txnRef = simSuccessRes.body.demo_transaction_ref;
    assert(txnRef && txnRef.startsWith('DEMO-TXN-'), `Unique demo transaction reference generated: ${txnRef}`);
    assert(simSuccessRes.body.order.payment_status === 'paid', 'Order payment status updated to "paid"');
    assert(simSuccessRes.body.order.order_status === 'Confirmed', 'Order status progressed to "Confirmed"');

    // 5. TEST: Repeated clicks / Idempotency protection
    console.log('\n--> [TEST CASE: Idempotency]: Duplicate payment prevented for same order');
    const duplicatePayRes = await request('POST', '/payments/simulate', {
      orderId: order.id,
      action: 'success'
    });
    assert(duplicatePayRes.status === 409 && !duplicatePayRes.body.success, 'Duplicate payment prevented with 409 Conflict');

    // 6. TEST CASE 7: Customer sees payment and order confirmation
    console.log('\n--> [TEST CASE 7]: Customer verifies saved order & payment confirmation');
    const verifyOrderRes = await request('GET', `/orders/${order.id}`, null, { 'x-guest-email': 'alex@example.com' });
    assert(verifyOrderRes.status === 200 && verifyOrderRes.body.order.payment_status === 'paid',
      'Customer order query reflects "paid" status');
    assert(verifyOrderRes.body.order.demo_transaction_ref === txnRef,
      'Customer order query returns correct demo transaction reference');

    // 7. TEST CASE 8: Admin opens dashboard and verifies the demo transaction
    console.log('\n--> [TEST CASE 8]: Admin verifies the demo transaction');
    const adminLoginRes = await request('POST', '/auth/login', {
      email: 'admin@sixwings.com',
      password: 'Admin@SixWings2026'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.token, 'Admin authenticated successfully');
    const adminToken = adminLoginRes.body.token;

    const adminPaymentsRes = await request('GET', '/admin/payments', null, { Authorization: `Bearer ${adminToken}` });
    const paymentRecord = adminPaymentsRes.body.records.find((r) => r.order_id === order.id);
    assert(paymentRecord !== undefined, `Admin dashboard found payment record for #${order.id}`);
    assert(paymentRecord.demo_transaction_reference === txnRef, `Demo transaction reference matches in admin portal`);
    assert(paymentRecord.order_amount === 898, `Order amount ₹898 displayed accurately in admin portal`);

    // Admin verifies payment
    const verifyActionRes = await request('POST', `/admin/payments/${order.id}/verify`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(verifyActionRes.status === 200 && verifyActionRes.body.success, 'Admin successfully marked demo payment as verified');
    assert(verifyActionRes.body.order.payment_verified === true, 'Order payment_verified flag set to true');

    // Check audit log
    const auditRes = await request('GET', '/admin/audit-logs', null, { Authorization: `Bearer ${adminToken}` });
    const verifyAudit = auditRes.body.logs.find((l) => l.action === 'VERIFY_PAYMENT' && l.entity_id === order.id);
    assert(verifyAudit !== undefined, 'Admin payment verification recorded in immutable audit log');

    // 8. TEST CASE 9: Customer simulates a failed payment and retries
    console.log('\n--> [TEST CASE 9]: Customer simulates failed payment, order kept unpaid & retries');
    const sess2 = `test_sess_fail_${Date.now()}`;
    await request('POST', '/cart/add', {
      productId: sampleProduct.id,
      size: 'L',
      color: 'Onyx Black',
      quantity: 1
    }, { 'x-session-id': sess2 });

    const failOrderRes = await request('POST', '/orders', {
      ...orderPayload,
      customer_email: 'alex_retry@example.com'
    }, { 'x-session-id': sess2 });
    const orderFail = failOrderRes.body.order;

    // Simulate Failure
    const failSimRes = await request('POST', '/payments/simulate', {
      orderId: orderFail.id,
      action: 'failed',
      failureReason: 'Customer bank decline simulation'
    });
    assert(failSimRes.status === 200 && failSimRes.body.action === 'failed', 'Simulated failure recorded');
    assert(failSimRes.body.order.payment_status === 'failed', 'Payment status set to "failed"');
    assert(failSimRes.body.order.order_status === 'Pending', 'Order kept in "Pending" status and unpaid');

    // Retry Payment on the same order
    const retryRes = await request('POST', '/payments/simulate', {
      orderId: orderFail.id,
      action: 'success'
    });
    assert(retryRes.status === 200 && retryRes.body.action === 'success', 'Retry payment simulation succeeded');
    assert(retryRes.body.order.payment_status === 'paid', 'Retried order successfully updated to "paid"');

    // 9. TEST: Customer simulates cancelled payment
    console.log('\n--> [TEST: Cancelled Payment]: Customer simulates cancelled payment');
    const sess3 = `test_sess_cancel_${Date.now()}`;
    await request('POST', '/cart/add', {
      productId: sampleProduct.id,
      size: 'S',
      color: 'Onyx Black',
      quantity: 1
    }, { 'x-session-id': sess3 });
    const cancelOrderRes = await request('POST', '/orders', {
      ...orderPayload,
      customer_email: 'alex_cancel@example.com'
    }, { 'x-session-id': sess3 });
    const orderCancel = cancelOrderRes.body.order;

    const cancelSimRes = await request('POST', '/payments/simulate', {
      orderId: orderCancel.id,
      action: 'cancelled'
    });
    assert(cancelSimRes.status === 200 && cancelSimRes.body.action === 'cancelled', 'Simulated cancellation recorded');
    assert(cancelSimRes.body.order.payment_status === 'cancelled', 'Order status set to "cancelled"');

    // 10. TEST CASE 10: Refresh and persistent database reload
    console.log('\n--> [TEST CASE 10]: Website refresh and database reload test');
    const dbReloadCheck = await request('GET', `/orders/${order.id}`, null, { 'x-guest-email': 'alex@example.com' });
    assert(dbReloadCheck.status === 200 && dbReloadCheck.body.order.payment_verified === true,
      'Saved order, transaction, and admin verification persist across reads from storage');

    // 11. TEST CASE 12: Customer isolation & unauthorized admin access
    console.log('\n--> [TEST CASE 12 & Security]: Customer order isolation & unauthorized admin access');
    // Customer B tries to view Customer A's order with wrong email
    const snoopingRes = await request('GET', `/orders/${order.id}`, null, { 'x-guest-email': 'attacker@evil.com' });
    assert(snoopingRes.status === 401 || snoopingRes.status === 403, 'Snooping customer blocked from accessing another customer\'s order');

    // Regular customer token trying to access admin dashboard
    const customerLogin = await request('POST', '/auth/login', {
      email: 'alex@example.com',
      password: 'Customer@123'
    });
    const customerToken = customerLogin.body.token;
    const unauthorizedAdminRes = await request('GET', '/admin/stats', null, {
      Authorization: `Bearer ${customerToken}`
    });
    assert(unauthorizedAdminRes.status === 403, 'Regular customer denied access to Admin Dashboard (403 Forbidden)');

    // 12. SUMMARY
    console.log('\n=============================================================');
    console.log(`  TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('=============================================================\n');

    if (failedCount === 0) {
      console.log('🎉 ALL 12 TEST CASES AND COMPLETE ORDER-TO-PAYMENT WORKFLOW PASSED!\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTestSuite();
