// const prisma = require('../config/dbConnect').prisma || require('../config/dbConnect');
// const { emitEvent } = require('../utils/socket');

// // Rounding Helper (2 Decimal places)
// const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// // Bill Totals Calculation Helper Function
// const calculateTotals = (orderTotalAmount, discountPct = 0, vatPct = 13) => {
//   const subTotal = Number(orderTotalAmount);
//   const discountAmount = discountPct > 0 ? round2(subTotal * (discountPct / 100)) : 0.0;
//   const amountAfterDiscount = subTotal - discountAmount;
//   const vatAmount = vatPct > 0 ? round2(amountAfterDiscount * (vatPct / 100)) : 0.0;
//   const grandTotal = round2(amountAfterDiscount + vatAmount);

//   return {
//     sub_total: subTotal,
//     discount_amount: discountAmount,
//     vat_amount: vatAmount,
//     grand_total: grandTotal,
//   };
// };

// // Unique Bill Number Generator
// const generateBillNumber = () => {
//   const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
//   const timeStr = new Date().toTimeString().slice(0, 5).replace(':', ''); // HHMM
//   const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 Random Alpha-numeric
//   return `BILL-${dateStr}-${timeStr}-${randomStr}`;
// };

// // Invoice Data JSON Structure Ready for Frontend
// // const buildInvoiceView = async (bill) => {
// //   const orderId = bill.order_id || bill.order?.id;
// //   const order = orderId
// //     ? await prisma.order.findUnique({
// //         where: { id: orderId },
// //         include: {
// //           table: true,
// //           items: true,
// //         },
// //       })
// //     : null;

// //   const orderItems = (order?.items || []).map((i) => ({
// //     item_name: i.menu_item_name,
// //     portion_name: i.portion_name,
// //     quantity: i.quantity,
// //     unit_price: Number(i.portion_price),
// //     total_price: i.quantity * Number(i.portion_price),
// //   }));

// //   const resolvedBranchId = bill.branch_id || order?.branch_id || null;

// //   return {
// //     id: bill.id,
// //     bill_number: bill.bill_number || `BILL-${bill.id.slice(-6).toUpperCase()}`,
// //     order_id: orderId,
// //     order_number: order?.order_number || (orderId ? `#${orderId.slice(-6).toUpperCase()}` : '—'),
// //     table_number: order?.table?.table_number || null,
// //     order_items: orderItems,
// //     sub_total: Number(bill.sub_total),
// //     discount_percentage: Number(bill.discount_percentage),
// //     discount_amount: Number(bill.discount_amount),
// //     vat_percentage: Number(bill.vat_percentage),
// //     vat_amount: Number(bill.vat_amount),
// //     grand_total: Number(bill.grand_total),
// //     payment_method: bill.payment_method,
// //     is_paid: bill.is_paid,
// //     branch_id: resolvedBranchId,
// //     branch: { id: resolvedBranchId },
// //     created_at: bill.created_at,
// //   };
// // };

// // Invoice Data JSON Structure Ready for Frontend
// // const buildInvoiceView = async (bill) => {
// //   const orderId = bill.order_id || bill.order?.id;
// //   const order = orderId
// //     ? await prisma.order.findUnique({
// //         where: { id: orderId },
// //         include: {
// //           table: true,
// //           items: true,
// //         },
// //       })
// //     : null;

// //   const orderItems = (order?.items || []).map((i) => ({
// //     item_name: i.menu_item_name,
// //     portion_name: i.portion_name,
// //     quantity: i.quantity,
// //     unit_price: Number(i.portion_price),
// //     total_price: i.quantity * Number(i.portion_price),
// //   }));

// //   const resolvedBranchId = bill.branch_id || order?.branch_id || null;

// //   return {
// //     id: bill.id,
// //     bill_number: bill.bill_number || `BILL-${bill.id.slice(-6).toUpperCase()}`,
// //     order_id: orderId,
// //     order_number: order?.order_number || (orderId ? `#${orderId.slice(-6).toUpperCase()}` : '—'),
// //     table_number: order?.table?.table_number || null,
    
// //     // 👈 VAT/PAN & Lucky Draw Fields
// //     seller_pan: bill.seller_pan || null,
// //     buyer_pan: bill.buyer_pan || null,
// //     buyer_name: bill.buyer_name || null,
// //     ird_synced: bill.ird_synced || false,
// //     ird_qr_code: bill.ird_qr_code || null,

// //     order_items: orderItems,
// //     sub_total: Number(bill.sub_total),
// //     discount_percentage: Number(bill.discount_percentage),
// //     discount_amount: Number(bill.discount_amount),
// //     vat_percentage: Number(bill.vat_percentage),
// //     vat_amount: Number(bill.vat_amount),
// //     grand_total: Number(bill.grand_total),
// //     payment_method: bill.payment_method,
// //     is_paid: bill.is_paid,
// //     branch_id: resolvedBranchId,
// //     branch: { id: resolvedBranchId },
// //     created_at: bill.created_at,
// //   };
// // };


// // Invoice Data JSON Structure Ready for Frontend

// const buildInvoiceView = async (bill) => {
//   const orderId = bill.order_id || bill.order?.id;
//   const order = orderId
//     ? await prisma.order.findUnique({
//         where: { id: orderId },
//         include: {
//           table: true,
//           items: true,
//         },
//       })
//     : null;

//   const orderItems = (order?.items || []).map((i) => ({
//     item_name: i.menu_item_name,
//     portion_name: i.portion_name,
//     quantity: i.quantity,
//     unit_price: Number(i.portion_price),
//     total_price: i.quantity * Number(i.portion_price),
//   }));

//   const resolvedBranchId = bill.branch_id || order?.branch_id || null;

//   return {
//     id: bill.id,
//     bill_number: bill.bill_number || `BILL-${bill.id.slice(-6).toUpperCase()}`,
//     order_id: orderId,
//     order_number: order?.order_number || (orderId ? `#${orderId.slice(-6).toUpperCase()}` : '—'),
//     table_number: order?.table?.table_number || null,
//     seller_pan: bill.seller_pan || null,
//     ird_synced: bill.ird_synced || false,
//     ird_qr_code: bill.ird_qr_code || null,
//     order_items: orderItems,
//     sub_total: Number(bill.sub_total),
//     discount_percentage: Number(bill.discount_percentage),
//     discount_amount: Number(bill.discount_amount),
//     vat_percentage: Number(bill.vat_percentage),
//     vat_amount: Number(bill.vat_amount),
//     grand_total: Number(bill.grand_total),
//     payment_method: bill.payment_method,
//     is_paid: bill.is_paid,
//     branch_id: resolvedBranchId,
//     branch: { id: resolvedBranchId },
//     created_at: bill.created_at,
//   };
// };

// // GET /bills/
// const getAll = async (req, res, next) => {
//   try {
//     const userBranchId = req.user?.branch_id || req.user?.branch;
//     // req.user बाट restaurant_id वा organization_id तानेर String मा कन्भर्ट गर्ने
//     const userRestaurantId = req.user?.restaurant_id || req.user?.organization_id;

//     let whereClause = {};

//     if (userBranchId) {
//       // १. यदि Branch User/Staff हो भने
//       whereClause.branch_id = String(userBranchId);
//     } else if (userRestaurantId) {
//       // २. यदि Admin हो भने restaurant_id अनुसार Branches खोज्ने
//       const orgBranches = await prisma.branch.findMany({
//         where: { 
//           restaurant_id: String(userRestaurantId) // 👈 organization_id को ठाउँमा restaurant_id
//         },
//         select: { id: true },
//       });
      
//       const branchIds = orgBranches.map((b) => String(b.id));

//       whereClause.branch_id = { in: branchIds };
//     }

//     const bills = await prisma.bill.findMany({
//       where: whereClause,
//       orderBy: { created_at: 'desc' },
//     });

//     const views = await Promise.all(bills.map(buildInvoiceView));
//     res.status(200).json(views);
//   } catch (err) {
//     next(err);
//   }
// };

// // GET /bills/:id
// const getOne = async (req, res, next) => {
//   try {
//     const branchId = req.user?.branch_id || req.user?.branch;

//     const whereClause = { id: req.params.id };
//     if (branchId) {
//       whereClause.branch_id = String(branchId);
//     }

//     const bill = await prisma.bill.findFirst({
//       where: whereClause,
//     });

//     if (!bill) {
//       return res.status(404).json({ error: 'Bill not found or Access denied.' });
//     }

//     res.status(200).json(await buildInvoiceView(bill));
//   } catch (err) {
//     next(err);
//   }
// };

// // POST /bills/
// // const createOne = async (req, res, next) => {
// //   try {
// //     const {
// //       order_id: orderId,
// //       discount_percentage: discountPct = 0.0,
// //       vat_percentage: vatPct = 13.0,
// //       payment_method: paymentMethod = 'cash',
// //     } = req.body;

// //     const userBranchId = req.user?.branch_id || req.user?.branch;

// //     // Verify order exists
// //     const orderWhere = { id: orderId };
// //     if (userBranchId) {
// //       orderWhere.branch_id = String(userBranchId);
// //     }

// //     const order = await prisma.order.findFirst({
// //       where: orderWhere,
// //     });

// //     if (!order) {
// //       return res.status(404).json({ error: 'Order not found or Access denied.' });
// //     }

// //     // Bill का लागि branch_id निर्धारण गर्ने (Order को वा User को)
// //     const targetBranchId = order.branch_id || userBranchId;

// //     // Totals calculation
// //     const calculated = calculateTotals(order.total_amount, discountPct, vatPct);

// //     // Atomic find-or-create using Prisma Upsert
// //     const bill = await prisma.bill.upsert({
// //       where: { order_id: order.id },
// //       update: {
// //         discount_percentage: discountPct,
// //         vat_percentage: vatPct,
// //         payment_method: paymentMethod,
// //         ...calculated,
// //       },
// //       create: {
// //         bill_number: generateBillNumber(),
// //         order_id: order.id,
// //         branch_id: targetBranchId,
// //         discount_percentage: discountPct,
// //         vat_percentage: vatPct,
// //         payment_method: paymentMethod,
// //         ...calculated,
// //       },
// //     });

// //     // Order state settle गर्ने
// //     const updatedOrder = await prisma.order.update({
// //       where: { id: order.id },
// //       data: {
// //         status: 'completed_settled',
// //         payment_choice: 'pay_now',
// //       },
// //     });

// //     const invoiceData = await buildInvoiceView(bill);
// //     emitEvent('bill:created', invoiceData, ['admin', `order_${order.id}`]);
// //     emitEvent('order:updated', updatedOrder, ['admin', `order_${order.id}`]);

// //     res.status(201).json(invoiceData);
// //   } catch (err) {
// //     next(err);
// //   }
// // };



// // POST /bills/

// const createOne = async (req, res, next) => {
//   try {
//     const {
//       order_id: orderId,
//       discount_percentage: discountPct = 0.0,
//       vat_percentage: vatPct = 13.0,
//       payment_method: paymentMethod = 'cash',
//     } = req.body;

//     const userBranchId = req.user?.branch_id || req.user?.branch;

//     const orderWhere = { id: orderId };
//     if (userBranchId) {
//       orderWhere.branch_id = String(userBranchId);
//     }

//     const order = await prisma.order.findFirst({
//       where: orderWhere,
//     });

//     if (!order) {
//       return res.status(404).json({ error: 'Order not found or Access denied.' });
//     }

//     const targetBranchId = order.branch_id || userBranchId;

//     // Fetch PAN/VAT number from OrganizationalDetail
//     const orgDetail = await prisma.organizationalDetail.findFirst({
//       where: targetBranchId ? { branch_id: String(targetBranchId) } : {},
//     });

//     const sellerPan = orgDetail?.pan_vat_number || null;

//     // Totals calculation
//     const calculated = calculateTotals(order.total_amount, discountPct, vatPct);

//     // बिल नम्बर नयाँ बनाउने वा पुरानै छ भने राख्ने
//     const generatedBillNum = generateBillNumber();

//     const billPayload = {
//       seller_pan: sellerPan,
//       discount_percentage: discountPct,
//       vat_percentage: vatPct,
//       payment_method: paymentMethod,
//       ...calculated,
//     };

//     const bill = await prisma.bill.upsert({
//       where: { order_id: order.id },
//       update: billPayload,
//       create: {
//         bill_number: generatedBillNum,
//         order_id: order.id,
//         branch_id: targetBranchId,
//         ...billPayload,
//       },
//     });

//     // 👈 यहाँ Order मा bill_number पनि auto-save/update गरिन्छ:
//     const updatedOrder = await prisma.order.update({
//       where: { id: order.id },
//       data: {
//         status: 'completed_settled',
//         payment_choice: 'pay_now',
//         bill_number: bill.bill_number, // 👈 Auto save bill number into Order
//       },
//     });

//     const invoiceData = await buildInvoiceView(bill);
//     emitEvent('bill:created', invoiceData, ['admin', `order_${order.id}`]);
//     emitEvent('order:updated', updatedOrder, ['admin', `order_${order.id}`]);

//     res.status(201).json(invoiceData);
//   } catch (err) {
//     next(err);
//   }
// };

// // PUT /bills/:id
// const updateOne = async (req, res, next) => {
//   try {
//     const branchId = req.user?.branch_id || req.user?.branch;

//     const whereClause = { id: req.params.id };
//     if (branchId) {
//       whereClause.branch_id = String(branchId);
//     }

//     const bill = await prisma.bill.findFirst({
//       where: whereClause,
//     });

//     if (!bill) {
//       return res.status(404).json({ error: 'Bill not found or Access denied.' });
//     }

//     const order = await prisma.order.findUnique({
//       where: { id: bill.order_id },
//     });

//     const discountPct = req.body.discount_percentage !== undefined ? req.body.discount_percentage : Number(bill.discount_percentage);
//     const vatPct = req.body.vat_percentage !== undefined ? req.body.vat_percentage : Number(bill.vat_percentage);

//     let updateData = {};
//     if (req.body.discount_percentage !== undefined) updateData.discount_percentage = discountPct;
//     if (req.body.vat_percentage !== undefined) updateData.vat_percentage = vatPct;
//     if (req.body.payment_method !== undefined) updateData.payment_method = req.body.payment_method;
//     if (req.body.is_paid !== undefined) updateData.is_paid = req.body.is_paid;
//     if (req.body.ird_synced !== undefined) updateData.ird_synced = req.body.ird_synced;
//     if (req.body.ird_qr_code !== undefined) updateData.ird_qr_code = req.body.ird_qr_code;

//     if (order) {
//       const calculated = calculateTotals(order.total_amount, discountPct, vatPct);
//       updateData = { ...updateData, ...calculated };
//     }

//     const updatedBill = await prisma.bill.update({
//       where: { id: bill.id },
//       data: updateData,
//     });

//     const invoiceData = await buildInvoiceView(updatedBill);
//     emitEvent('bill:updated', invoiceData, ['admin', `order_${bill.order_id}`]);

//     res.status(200).json(invoiceData);
//   } catch (err) {
//     next(err);
//   }
// };

// // PUT /bills/:id
// // const updateOne = async (req, res, next) => {
// //   try {
// //     const branchId = req.user?.branch_id || req.user?.branch;

// //     const whereClause = { id: req.params.id };
// //     if (branchId) {
// //       whereClause.branch_id = String(branchId);
// //     }

// //     const bill = await prisma.bill.findFirst({
// //       where: whereClause,
// //     });

// //     if (!bill) {
// //       return res.status(404).json({ error: 'Bill not found or Access denied.' });
// //     }

// //     const order = await prisma.order.findUnique({
// //       where: { id: bill.order_id },
// //     });

// //     const discountPct = req.body.discount_percentage !== undefined ? req.body.discount_percentage : Number(bill.discount_percentage);
// //     const vatPct = req.body.vat_percentage !== undefined ? req.body.vat_percentage : Number(bill.vat_percentage);

// //     let updateData = {};
// //     if (req.body.discount_percentage !== undefined) updateData.discount_percentage = discountPct;
// //     if (req.body.vat_percentage !== undefined) updateData.vat_percentage = vatPct;
// //     if (req.body.payment_method !== undefined) updateData.payment_method = req.body.payment_method;
// //     if (req.body.is_paid !== undefined) updateData.is_paid = req.body.is_paid;

// //     if (order) {
// //       const calculated = calculateTotals(order.total_amount, discountPct, vatPct);
// //       updateData = { ...updateData, ...calculated };
// //     }

// //     const updatedBill = await prisma.bill.update({
// //       where: { id: bill.id },
// //       data: updateData,
// //     });

// //     const invoiceData = await buildInvoiceView(updatedBill);
// //     emitEvent('bill:updated', invoiceData, ['admin', `order_${bill.order_id}`]);

// //     res.status(200).json(invoiceData);
// //   } catch (err) {
// //     next(err);
// //   }
// // };



// // DELETE /bills/:id

// const deleteOne = async (req, res, next) => {
//   try {
//     const branchId = req.user?.branch_id || req.user?.branch;

//     const whereClause = { id: req.params.id };
//     if (branchId) {
//       whereClause.branch_id = String(branchId);
//     }

//     const bill = await prisma.bill.findFirst({
//       where: whereClause,
//     });

//     if (!bill) {
//       return res.status(404).json({ error: 'Bill not found or Access denied.' });
//     }

//     await prisma.bill.delete({
//       where: { id: req.params.id },
//     });

//     emitEvent('bill:deleted', { id: req.params.id }, 'admin');
//     res.status(204).send();
//   } catch (err) {
//     next(err);
//   }
// };

// module.exports = {
//   getAll,
//   getOne,
//   createOne,
//   updateOne,
//   deleteOne,
//   buildInvoiceView,
//   generateBillNumber
// };

const prisma = require('../config/dbConnect').prisma || require('../config/dbConnect');
const { emitEvent } = require('../utils/socket');

// Rounding Helper (2 Decimal places)
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Bill Totals Calculation Helper Function
const calculateTotals = (orderTotalAmount, discountPct = 0, vatPct = 13) => {
  const subTotal = Number(orderTotalAmount);
  const discountAmount = discountPct > 0 ? round2(subTotal * (discountPct / 100)) : 0.0;
  const amountAfterDiscount = subTotal - discountAmount;
  const vatAmount = vatPct > 0 ? round2(amountAfterDiscount * (vatPct / 100)) : 0.0;
  const grandTotal = round2(amountAfterDiscount + vatAmount);

  return {
    sub_total: subTotal,
    discount_amount: discountAmount,
    vat_amount: vatAmount,
    grand_total: grandTotal,
  };
};

// Unique Bill Number Generator
const generateBillNumber = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', ''); // HHMM
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 Random Alpha-numeric
  return `BILL-${dateStr}-${timeStr}-${randomStr}`;
};

// Invoice Data JSON Structure Ready for Frontend
const buildInvoiceView = async (bill) => {
  const orderId = bill.order_id || bill.order?.id;
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          items: true,
        },
      })
    : null;

  const orderItems = (order?.items || []).map((i) => ({
    item_name: i.menu_item_name,
    portion_name: i.portion_name,
    quantity: i.quantity,
    unit_price: Number(i.portion_price),
    total_price: i.quantity * Number(i.portion_price),
  }));

  const resolvedBranchId = bill.branch_id || order?.branch_id || null;

  return {
    id: bill.id,
    bill_number: bill.bill_number || `BILL-${bill.id.slice(-6).toUpperCase()}`,
    order_id: orderId,
    order_number: order?.order_number || (orderId ? `#${orderId.slice(-6).toUpperCase()}` : '—'),
    table_number: order?.table?.table_number || null,
    seller_pan: bill.seller_pan || null,
    ird_synced: bill.ird_synced || false,
    ird_qr_code: bill.ird_qr_code || null,
    order_items: orderItems,
    sub_total: Number(bill.sub_total),
    discount_percentage: Number(bill.discount_percentage),
    discount_amount: Number(bill.discount_amount),
    vat_percentage: Number(bill.vat_percentage),
    vat_amount: Number(bill.vat_amount),
    grand_total: Number(bill.grand_total),
    payment_method: bill.payment_method,
    is_paid: bill.is_paid,
    branch_id: resolvedBranchId,
    branch: { id: resolvedBranchId },
    created_at: bill.created_at,
  };
};

// GET /bills/
const getAll = async (req, res, next) => {
  try {
    const userBranchId = req.user?.branch_id || req.user?.branch;
    const userRestaurantId = req.user?.restaurant_id || req.user?.organization_id;

    let whereClause = {};

    if (userBranchId) {
      whereClause.branch_id = String(userBranchId);
    } else if (userRestaurantId) {
      const orgBranches = await prisma.branch.findMany({
        where: { 
          restaurant_id: String(userRestaurantId)
        },
        select: { id: true },
      });
      
      const branchIds = orgBranches.map((b) => String(b.id));
      whereClause.branch_id = { in: branchIds };
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    const views = await Promise.all(bills.map(buildInvoiceView));
    res.status(200).json(views);
  } catch (err) {
    next(err);
  }
};

// GET /bills/:id
const getOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;

    const whereClause = { id: req.params.id };
    if (branchId) {
      whereClause.branch_id = String(branchId);
    }

    const bill = await prisma.bill.findFirst({
      where: whereClause,
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found or Access denied.' });
    }

    res.status(200).json(await buildInvoiceView(bill));
  } catch (err) {
    next(err);
  }
};

// POST /bills/
const createOne = async (req, res, next) => {
  try {
    const {
      order_id: orderId,
      discount_percentage: discountPct = 0.0,
      vat_percentage: vatPct = 13.0,
      payment_method: paymentMethod = 'cash',
    } = req.body;

    const userBranchId = req.user?.branch_id || req.user?.branch;

    const orderWhere = { id: orderId };
    if (userBranchId) {
      orderWhere.branch_id = String(userBranchId);
    }

    const order = await prisma.order.findFirst({
      where: orderWhere,
      include: { table: true, items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or Access denied.' });
    }

    const targetBranchId = order.branch_id || userBranchId;

    // Fetch PAN/VAT number from OrganizationalDetail
    const orgDetail = await prisma.organizationalDetail.findFirst({
      where: targetBranchId ? { branch_id: String(targetBranchId) } : {},
    });

    const sellerPan = orgDetail?.pan_vat_number || null;

    // Subtotal math calculation: items base sum OR current total_amount
    const baseSubTotal = Number(order.sub_total || order.total_amount);

    // Totals calculation (Grand total includes discount & VAT)
    const calculated = calculateTotals(baseSubTotal, discountPct, vatPct);

    const generatedBillNum = generateBillNumber();

    const billPayload = {
      seller_pan: sellerPan,
      discount_percentage: discountPct,
      vat_percentage: vatPct,
      payment_method: paymentMethod,
      ...calculated,
    };

    const bill = await prisma.bill.upsert({
      where: { order_id: order.id },
      update: billPayload,
      create: {
        bill_number: generatedBillNum,
        order_id: order.id,
        branch_id: targetBranchId,
        ...billPayload,
      },
    });

    // 👈 HERE: Order ko `total_amount` ma Final calculated Grand Total Update hunxa
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'completed_settled',
        payment_choice: 'pay_now',
        bill_number: bill.bill_number,
        total_amount: calculated.grand_total, // 👈 Syncs exact bill total back to Order table
      },
      include: { table: true, items: true },
    });

    const invoiceData = await buildInvoiceView(bill);
    emitEvent('bill:created', invoiceData, ['admin', `order_${order.id}`]);
    emitEvent('order:updated', updatedOrder, ['admin', `order_${order.id}`]);

    res.status(201).json(invoiceData);
  } catch (err) {
    next(err);
  }
};

// PUT /bills/:id
const updateOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;

    const whereClause = { id: req.params.id };
    if (branchId) {
      whereClause.branch_id = String(branchId);
    }

    const bill = await prisma.bill.findFirst({
      where: whereClause,
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found or Access denied.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: bill.order_id },
      include: { table: true, items: true },
    });

    const discountPct = req.body.discount_percentage !== undefined ? req.body.discount_percentage : Number(bill.discount_percentage);
    const vatPct = req.body.vat_percentage !== undefined ? req.body.vat_percentage : Number(bill.vat_percentage);

    let updateData = {};
    if (req.body.discount_percentage !== undefined) updateData.discount_percentage = discountPct;
    if (req.body.vat_percentage !== undefined) updateData.vat_percentage = vatPct;
    if (req.body.payment_method !== undefined) updateData.payment_method = req.body.payment_method;
    if (req.body.is_paid !== undefined) updateData.is_paid = req.body.is_paid;
    if (req.body.ird_synced !== undefined) updateData.ird_synced = req.body.ird_synced;
    if (req.body.ird_qr_code !== undefined) updateData.ird_qr_code = req.body.ird_qr_code;

    let calculated = null;
    if (order) {
      const baseSubTotal = Number(bill.sub_total || order.total_amount);
      calculated = calculateTotals(baseSubTotal, discountPct, vatPct);
      updateData = { ...updateData, ...calculated };
    }

    const updatedBill = await prisma.bill.update({
      where: { id: bill.id },
      data: updateData,
    });

    // 👈 Update order's total_amount as well if order was recalculated
    let updatedOrder = null;
    if (order && calculated) {
      updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          total_amount: calculated.grand_total, // 👈 Update order amount to match edited bill
        },
        include: { table: true, items: true },
      });
    }

    const invoiceData = await buildInvoiceView(updatedBill);
    emitEvent('bill:updated', invoiceData, ['admin', `order_${bill.order_id}`]);
    if (updatedOrder) {
      emitEvent('order:updated', updatedOrder, ['admin', `order_${bill.order_id}`]);
    }

    res.status(200).json(invoiceData);
  } catch (err) {
    next(err);
  }
};

// DELETE /bills/:id
const deleteOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;

    const whereClause = { id: req.params.id };
    if (branchId) {
      whereClause.branch_id = String(branchId);
    }

    const bill = await prisma.bill.findFirst({
      where: whereClause,
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found or Access denied.' });
    }

    await prisma.bill.delete({
      where: { id: req.params.id },
    });

    emitEvent('bill:deleted', { id: req.params.id }, 'admin');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
  buildInvoiceView,
  generateBillNumber,
  calculateTotals,
};