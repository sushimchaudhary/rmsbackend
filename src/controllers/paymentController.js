// const crypto = require('crypto');
// const { prisma } = require('../config/dbConnect');
// const { emitEvent } = require('../utils/socket');

// const FRONTEND_URL = process.env.FRONTEND_MENU_URL || 'http://localhost:3000';
// const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// // Trim + strip stray quotes
// const ESEWA_SECRET_KEY = (process.env.ESEWA_SECRET_KEY || '')
//   .trim()
//   .replace(/^["']|["']$/g, '');
// const ESEWA_PRODUCT_CODE = (process.env.ESEWA_PRODUCT_CODE || '')
//   .trim()
//   .replace(/^["']|["']$/g, '');

// // 🔍 One-time boot check
// console.log('\n=== 🔍 [eSewa Config Boot Check] ===');
// console.log('ESEWA_SECRET_KEY raw from env:', JSON.stringify(process.env.ESEWA_SECRET_KEY));
// console.log('ESEWA_SECRET_KEY after trim/strip:', JSON.stringify(ESEWA_SECRET_KEY));
// console.log('ESEWA_SECRET_KEY length:', ESEWA_SECRET_KEY.length, '(expect 17 for UAT test key)');
// console.log('ESEWA_PRODUCT_CODE:', JSON.stringify(ESEWA_PRODUCT_CODE));

// (function selfTestSignature() {
//   const testString = 'total_amount=100,transaction_uuid=241028,product_code=EPAYTEST';
//   const testSig = crypto
//     .createHmac('sha256', '8gBmpyUzFi24P145')
//     .update(testString)
//     .digest('base64');
//   console.log('🧪 [Self-test] Known-good key + known-good string → signature:', testSig);
// })();
// console.log('=====================================\n');

// const redirectFailure = (res, reason, detail) => {
//   const query = new URLSearchParams({ status: 'failed', reason });
//   if (detail) query.set('detail', String(detail));
//   return res.redirect(`${FRONTEND_URL}/payment-failed?${query.toString()}`);
// };

// exports.initiateEsewa = async (req, res) => {
//   try {
//     console.log('\n--- 🚀 [STEP 1: INITIATE ESEWA PAYMENT] ---');
//     console.log('📥 Request Body:', req.body);

//     const { amount, orderId } = req.body;

//     if (!amount || !orderId) {
//       console.warn('⚠️ [Initiate Failed]: Missing amount or orderId');
//       return res.status(400).json({ success: false, message: "Amount and OrderId are required fields." });
//     }

//     const numAmount = Number(amount);
//     if (isNaN(numAmount) || numAmount <= 0) {
//       console.warn('⚠️ [Initiate Failed]: Invalid Amount:', amount);
//       return res.status(400).json({ success: false, message: "Invalid amount provided." });
//     }

//     const totalAmountStr = numAmount.toFixed(2);
//     const cleanOrderId = String(orderId).trim();
//     const transactionUuid = `${cleanOrderId}-${Date.now()}`;

//     const dataString = `total_amount=${totalAmountStr},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`;

//     const signature = crypto
//       .createHmac('sha256', ESEWA_SECRET_KEY)
//       .update(dataString)
//       .digest('base64');

//     console.log('🔑 [Signature Generation Details]:');
//     console.log('   - Key used (length):', ESEWA_SECRET_KEY.length);
//     console.log('   - Raw Data String:', JSON.stringify(dataString));
//     console.log('   - Generated Signature:', signature);

//     const responsePayload = {
//       amount: totalAmountStr,
//       tax_amount: "0.00",
//       total_amount: totalAmountStr,
//       transaction_uuid: transactionUuid,
//       product_code: ESEWA_PRODUCT_CODE,
//       product_service_charge: "0.00",
//       product_delivery_charge: "0.00",
//       success_url: `${BACKEND_URL}/api/payment/esewa-success`,
//       failure_url: `${BACKEND_URL}/api/payment/esewa-failure`,
//       signed_field_names: "total_amount,transaction_uuid,product_code",
//       signature: signature
//     };

//     const verifyString = responsePayload.signed_field_names
//       .split(',')
//       .map((f) => `${f}=${responsePayload[f]}`)
//       .join(',');
//     const verifySig = crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(verifyString).digest('base64');
//     console.log('🔁 [Self-consistency check] Matches original?', verifySig === signature);

//     return res.status(200).json({ success: true, payment_data: responsePayload });

//   } catch (error) {
//     console.error("🔥 [Initiate Exception Error]:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to initiate eSewa payment signature.",
//       error: error.message
//     });
//   }
// };

// exports.esewaPayment = async (req, res) => {
//   try {
//     console.log('\n--- 🔄 [STEP 2: ESEWA CALLBACK RECEIVED] ---');
//     console.log('📥 Query Params:', req.query);
//     console.log('📥 Body Params:', req.body);

//     const dataToken = req.query.data || req.body.data;
//     if (!dataToken) return redirectFailure(res, 'missing_data', 'encoded_data_missing');

//     const normalizedToken = String(dataToken).trim().replace(/ /g, '+');
//     const decodedString = Buffer.from(normalizedToken, 'base64').toString('utf-8');

//     let decoded;
//     try {
//       decoded = JSON.parse(decodedString);
//       console.log('🔓 [Decoded eSewa Payload]:', decoded);
//     } catch (pErr) {
//       console.error('🔥 [JSON Parse Error]: Failed to parse base64 decoded string:', decodedString);
//       return redirectFailure(res, 'invalid_json', 'base64_decode_failed');
//     }

//     if (decoded.status !== 'COMPLETE') {
//       console.warn(`⚠️ [Payment Not Complete]: Status received is ${decoded.status}`);
//       return redirectFailure(res, 'incomplete_status', decoded.status);
//     }

//     const signedFields = String(decoded.signed_field_names || '').split(',');
//     const expectedDataString = signedFields.map((field) => `${field}=${decoded[field] ?? ''}`).join(',');

//     const generatedHash = crypto
//       .createHmac('sha256', ESEWA_SECRET_KEY)
//       .update(expectedDataString)
//       .digest('base64')
//       .trim();

//     const receivedSignature = String(decoded.signature || '').trim();

//     if (generatedHash !== receivedSignature) {
//       console.error('❌ [Signature Mismatch Detected!] Secret key or field mismatch.');
//       return redirectFailure(res, 'signature_mismatch', 'signature_check_failed');
//     }
//     console.log('✅ [Signature Verified Successfully]');

//     const uuidParts = String(decoded.transaction_uuid || '').split('-');
//     const parsedOrderId = uuidParts[0];

//     console.log(`📦 [Finding Order]: Parsed Order ID = ${parsedOrderId}`);
    
//     // Prisma Order lookup
//     const order = await prisma.order.findUnique({
//       where: { id: parsedOrderId },
//       include: { table: true },
//     });

//     if (!order) return redirectFailure(res, 'order_not_found', parsedOrderId);

//     // Prisma Payment lookup
//     let payment = await prisma.payment.findFirst({
//       where: { transactionId: decoded.transaction_code },
//     });

//     if (!payment) {
//       console.log(`💳 [Processing New Payment Record]: TxnCode = ${decoded.transaction_code}`);
//       const cleanEsewaAmount = String(decoded.total_amount).replace(/,/g, '');
//       const numAmount = Number(cleanEsewaAmount);

//       payment = await prisma.payment.create({
//         data: {
//           order_id: order.id,
//           user_id: req.user?.id || req.user?._id || null,
//           transactionId: decoded.transaction_code,
//           amount: numAmount,
//           paymentMethod: 'esewa',
//           status: 'completed',
//           paymentDetails: decoded,
//         },
//       });
//       console.log('✅ [Payment Saved to DB]:', payment.id);

//       // Order update
//       const updatedOrder = await prisma.order.update({
//         where: { id: order.id },
//         data: {
//           status: 'preparing',
//           payment_choice: 'pay_now',
//         },
//         include: { table: true },
//       });
//       console.log(`✅ [Order Updated]: ID=${updatedOrder.id}, Status=preparing`);

//       // Bill update/upsert
//       const bill = await prisma.bill.upsert({
//         where: { order_id: order.id },
//         update: {
//           is_paid: true,
//           payment_method: 'digital_wallet',
//           subtotal: updatedOrder.total_amount,
//           grand_total: updatedOrder.total_amount,
//         },
//         create: {
//           order_id: order.id,
//           branch_id: order.branch_id,
//           is_paid: true,
//           payment_method: 'digital_wallet',
//           subtotal: updatedOrder.total_amount,
//           grand_total: updatedOrder.total_amount,
//         },
//       });
//       console.log(`✅ [Bill Saved]: Bill ID=${bill.id}, Paid=${bill.is_paid}`);

//       try {
//         const rooms = ['admin', `order_${updatedOrder.id}`];
//         if (updatedOrder.table_id) rooms.push(`table_${updatedOrder.table_id}`);
        
//         emitEvent('order:updated', updatedOrder, rooms);
//         emitEvent('bill:created', bill, rooms);
//         console.log('📡 [Socket Events Emitted] to rooms:', rooms);
//       } catch (socketErr) {
//         console.error('⚠️ [Socket Emit Failed]:', socketErr.message);
//       }
//     } else {
//       console.log('ℹ️ [Duplicate Payment Request Ignored]: Transaction already recorded.');
//     }

//     console.log(`🎉 [Payment Process Completed]: Redirecting to Frontend Success Page.`);
//     return res.redirect(`${FRONTEND_URL}/payment-success?status=success&orderId=${order.id}`);

//   } catch (error) {
//     console.error("🔥 [Verification Exception Error]:", error);
//     return redirectFailure(res, 'server_error', error.message);
//   }
// };

// exports.esewaFailure = async (req, res) => {
//   try {
//     console.log('\n--- 🛑 [eSewa Failure Callback Triggered] ---');
//     console.log('📥 Query Params:', req.query);
//     console.log('📥 Body Params:', req.body);
//     const detail = req.query.message || req.query.error || req.query.reason || 'gateway_rejected';
//     return redirectFailure(res, 'gateway_failed', detail);
//   } catch (error) {
//     console.error('🔥 [Failure Callback Error]:', error);
//     return redirectFailure(res, 'gateway_failed', 'failure_callback_exception');
//   }
// };


const crypto = require('crypto');
const { prisma } = require('../config/dbConnect');
const { emitEvent } = require('../utils/socket');
const { resolveMerchantAccount } = require('../services/merchantaccountService');

const FRONTEND_URL = process.env.FRONTEND_MENU_URL;
const BACKEND_URL = process.env.BACKEND_URL;

const redirectFailure = (res, reason, detail) => {
  const query = new URLSearchParams({ status: 'failed', reason });
  if (detail) query.set('detail', String(detail));
  return res.redirect(`${FRONTEND_URL}/payment-failed?${query.toString()}`);
};

// Shared: fetch the order + resolve which merchant account should be charged.
// This replaces the old single static ESEWA_SECRET_KEY/PRODUCT_CODE from env —
// each restaurant/branch now has its own gateway credentials in merchant_accounts.
async function getOrderAndMerchant(orderId, provider) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { table: true },
  });
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }

  const merchant = await resolveMerchantAccount({ branch_id: order.branch_id, provider });
  return { order, merchant };
}

/* =========================================================================
   ESEWA — customer order payments
   ========================================================================= */

exports.initiateEsewa = async (req, res) => {
  try {
    console.log('\n--- 🚀 [STEP 1: INITIATE ESEWA PAYMENT] ---');
    console.log('📥 Request Body:', req.body);

    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and OrderId are required fields.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount provided.' });
    }

    const { merchant } = await getOrderAndMerchant(orderId, 'esewa');

    const totalAmountStr = numAmount.toFixed(2);
    const cleanOrderId = String(orderId).trim();
    const transactionUuid = `${cleanOrderId}-${Date.now()}`;

    const dataString = `total_amount=${totalAmountStr},transaction_uuid=${transactionUuid},product_code=${merchant.productCode}`;

    const signature = crypto.createHmac('sha256', merchant.secretKey).update(dataString).digest('base64');

    console.log('🔑 [Signature Generation]: merchant_account_id=', merchant.id, 'scope=', merchant.scope);

    const responsePayload = {
      amount: totalAmountStr,
      tax_amount: '0.00',
      total_amount: totalAmountStr,
      transaction_uuid: transactionUuid,
      product_code: merchant.productCode,
      product_service_charge: '0.00',
      product_delivery_charge: '0.00',
      success_url: `${BACKEND_URL}/api/payment/esewa-success`,
      failure_url: `${BACKEND_URL}/api/payment/esewa-failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    };

    return res.status(200).json({ success: true, payment_data: responsePayload });
  } catch (error) {
    console.error('🔥 [Initiate Esewa Exception]:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to initiate eSewa payment signature.',
    });
  }
};

exports.esewaPayment = async (req, res) => {
  try {
    console.log('\n--- 🔄 [STEP 2: ESEWA CALLBACK RECEIVED] ---');

    const dataToken = req.query.data || req.body.data;
    if (!dataToken) return redirectFailure(res, 'missing_data', 'encoded_data_missing');

    const normalizedToken = String(dataToken).trim().replace(/ /g, '+');
    const decodedString = Buffer.from(normalizedToken, 'base64').toString('utf-8');

    let decoded;
    try {
      decoded = JSON.parse(decodedString);
    } catch (pErr) {
      console.error('🔥 [JSON Parse Error]:', decodedString);
      return redirectFailure(res, 'invalid_json', 'base64_decode_failed');
    }

    if (decoded.status !== 'COMPLETE') {
      return redirectFailure(res, 'incomplete_status', decoded.status);
    }

    const uuidParts = String(decoded.transaction_uuid || '').split('-');
    const parsedOrderId = uuidParts[0];

    const { order, merchant } = await getOrderAndMerchant(parsedOrderId, 'esewa').catch((e) => {
      throw e;
    });

    const signedFields = String(decoded.signed_field_names || '').split(',');
    const expectedDataString = signedFields.map((field) => `${field}=${decoded[field] ?? ''}`).join(',');

    const generatedHash = crypto
      .createHmac('sha256', merchant.secretKey)
      .update(expectedDataString)
      .digest('base64')
      .trim();

    const receivedSignature = String(decoded.signature || '').trim();

    if (generatedHash !== receivedSignature) {
      console.error('❌ [Signature Mismatch] merchant_account_id=', merchant.id);
      return redirectFailure(res, 'signature_mismatch', 'signature_check_failed');
    }
    console.log('✅ [Signature Verified] merchant_account_id=', merchant.id);

    // Prisma Payment lookup — idempotency guard against duplicate webhook delivery
    let payment = await prisma.payment.findFirst({
      where: { transactionId: decoded.transaction_code },
    });

    if (!payment) {
      const cleanEsewaAmount = String(decoded.total_amount).replace(/,/g, '');
      const numAmount = Number(cleanEsewaAmount);

      payment = await prisma.payment.create({
        data: {
          order_id: order.id,
          user_id: req.user?.id || req.user?._id || null,
          transactionId: decoded.transaction_code,
          amount: numAmount,
          paymentMethod: 'esewa',
          status: 'completed',
          paymentDetails: decoded,
          merchant_account_id: merchant.id,
        },
      });

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'preparing', payment_choice: 'pay_now' },
        include: { table: true },
      });

      const bill = await prisma.bill.upsert({
        where: { order_id: order.id },
        update: {
          is_paid: true,
          payment_method: 'digital_wallet',
          sub_total: updatedOrder.total_amount,
          grand_total: updatedOrder.total_amount,
        },
        create: {
          bill_number: `BILL-${Date.now()}`,
          order_id: order.id,
          branch_id: order.branch_id,
          is_paid: true,
          payment_method: 'digital_wallet',
          sub_total: updatedOrder.total_amount,
          grand_total: updatedOrder.total_amount,
        },
      });

      try {
        const rooms = ['admin', `order_${updatedOrder.id}`];
        if (updatedOrder.table_id) rooms.push(`table_${updatedOrder.table_id}`);
        emitEvent('order:updated', updatedOrder, rooms);
        emitEvent('bill:created', bill, rooms);
      } catch (socketErr) {
        console.error('⚠️ [Socket Emit Failed]:', socketErr.message);
      }
    } else {
      console.log('ℹ️ [Duplicate Payment Webhook Ignored]: Transaction already recorded.');
    }

    return res.redirect(`${FRONTEND_URL}/payment-success?status=success&orderId=${order.id}`);
  } catch (error) {
    console.error('🔥 [Esewa Verification Exception]:', error);
    return redirectFailure(res, 'server_error', error.message);
  }
};

exports.esewaFailure = async (req, res) => {
  try {
    const detail = req.query.message || req.query.error || req.query.reason || 'gateway_rejected';
    return redirectFailure(res, 'gateway_failed', detail);
  } catch (error) {
    return redirectFailure(res, 'gateway_failed', 'failure_callback_exception');
  }
};

/* =========================================================================
   KHALTI — customer order payments (mirrors the eSewa flow above)
   ========================================================================= */

exports.initiateKhalti = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and OrderId are required.' });
    }

    const { order, merchant } = await getOrderAndMerchant(orderId, 'khalti');

    // Khalti ePayment v2: initiate via their API using the merchant's secret key.
    const payload = {
      return_url: `${BACKEND_URL}/api/payment/khalti-success`,
      website_url: FRONTEND_URL,
      amount: Math.round(Number(amount) * 100), // paisa
      purchase_order_id: order.id,
      purchase_order_name: `Order-${order.order_number}`,
    };

    const response = await fetch('https://khalti.com/api/v2/epayment/initiate/', {
      method: 'POST',
      headers: {
        Authorization: `Key ${merchant.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('🔥 [Khalti Initiate Failed]:', data);
      return res.status(502).json({ success: false, message: 'Khalti initiation failed.', detail: data });
    }

    return res.status(200).json({ success: true, payment_data: data });
  } catch (error) {
    console.error('🔥 [Initiate Khalti Exception]:', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Server error.' });
  }
};

exports.khaltiPayment = async (req, res) => {
  try {
    const { pidx, purchase_order_id: orderId } = req.query.pidx ? req.query : req.body;
    if (!pidx || !orderId) return redirectFailure(res, 'missing_data', 'pidx_or_order_missing');

    const { order, merchant } = await getOrderAndMerchant(orderId, 'khalti');

    // Server-side lookup (never trust client-provided status) using the same merchant secret.
    const verifyRes = await fetch('https://khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: {
        Authorization: `Key ${merchant.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });
    const verified = await verifyRes.json();

    if (!verifyRes.ok || verified.status !== 'Completed') {
      return redirectFailure(res, 'incomplete_status', verified.status || 'unknown');
    }

    let payment = await prisma.payment.findFirst({ where: { transactionId: verified.transaction_id } });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          order_id: order.id,
          transactionId: verified.transaction_id,
          amount: Number(verified.total_amount) / 100,
          paymentMethod: 'khalti',
          status: 'completed',
          paymentDetails: verified,
          merchant_account_id: merchant.id,
        },
      });

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'preparing', payment_choice: 'pay_now' },
        include: { table: true },
      });

      const bill = await prisma.bill.upsert({
        where: { order_id: order.id },
        update: {
          is_paid: true,
          payment_method: 'digital_wallet',
          sub_total: updatedOrder.total_amount,
          grand_total: updatedOrder.total_amount,
        },
        create: {
          bill_number: `BILL-${Date.now()}`,
          order_id: order.id,
          branch_id: order.branch_id,
          is_paid: true,
          payment_method: 'digital_wallet',
          sub_total: updatedOrder.total_amount,
          grand_total: updatedOrder.total_amount,
        },
      });

      const rooms = ['admin', `order_${updatedOrder.id}`];
      if (updatedOrder.table_id) rooms.push(`table_${updatedOrder.table_id}`);
      emitEvent('order:updated', updatedOrder, rooms);
      emitEvent('bill:created', bill, rooms);
    }

    return res.redirect(`${FRONTEND_URL}/payment-success?status=success&orderId=${order.id}`);
  } catch (error) {
    console.error('🔥 [Khalti Verification Exception]:', error);
    return redirectFailure(res, 'server_error', error.message);
  }
};

/* =========================================================================
   Generic bill-number generator (unchanged from your original helper,
   kept here so billController's usage of `billController.generateBillNumber`
   continues to work if you had it colocated).
   ========================================================================= */
exports.generateBillNumber = () => `BILL-${Date.now()}`;