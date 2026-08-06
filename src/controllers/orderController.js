const prisma = require('../config/dbConnect').prisma || require('../config/dbConnect');
const { emitEvent } = require('../utils/socket');
const billController = require('./billController');

// Helper: Target rooms for Order notifications
const getOrderRooms = (order) => {
  const rooms = ['admin', `order_${order.id}`];
  if (order.table_id) {
    rooms.push(`table_${order.table_id}`);
  }
  return rooms;
};

// Helper: Generates unique Bill/Order Reference Number
const generateOrderNumber = () => {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  const timePart = `${yy}${mm}${dd}-${hh}${min}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 3; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORD-${timePart}-${randomStr}`;
};

// Helper: Prepare Order Item payload for Prisma
const buildOrderItem = async (raw) => {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: raw.menu_item },
    include: {
      category: true,
      portions: true,
    },
  });

  if (!menuItem) {
    const err = new Error(`Menu item ${raw.menu_item} does not exist.`);
    err.statusCode = 400;
    throw err;
  }

  const portionId = raw.selected_portion_id || raw.selected_portion;
  const portion = menuItem.portions.find((p) => p.id === portionId);

  if (!portion) {
    const err = new Error(`Portion ${portionId} does not exist on menu item ${menuItem.name}.`);
    err.statusCode = 400;
    throw err;
  }

  const quantity = parseInt(raw.quantity, 10) || 1;
  const categoryName = menuItem.category?.name || 'Uncategorized';
  const portionPrice = Number(portion.price);

  return {
    menu_item_id: menuItem.id,
    menu_item_name: menuItem.name,
    category_name: categoryName,
    menu_item_image: menuItem.image || null,
    selected_portion_id: portion.id,
    portion_name: portion.portion_name,
    portion_price: portionPrice,
    quantity,
    _price: portionPrice * quantity,
  };
};

// GET /orders/
const getAll = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const where = branchId ? { branch_id: branchId } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        items: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

// GET /orders/:id
const getOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(branchId && { branch_id: branchId }),
      },
      include: {
        table: true,
        items: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Not found or Access Denied.' });
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};

// POST /orders/
const createOne = async (req, res, next) => {
  try {
    const { table_id, items = [], payment_choice = 'uncommitted' } = req.body;

    if (!table_id) {
      return res.status(400).json({ error: 'table_id is required.' });
    }

    const tableDoc = await prisma.restaurantTable.findUnique({
      where: { id: table_id },
    });

    if (!tableDoc) {
      return res.status(404).json({ error: 'Invalid or missing table.' });
    }

    const branchId = tableDoc.branch_id || req.user?.branch_id || req.user?.branch;
    if (!branchId) {
      return res.status(400).json({ error: 'Branch could not be determined for this order.' });
    }

    const builtItems = [];
    let totalAmount = 0;
    for (const raw of items) {
      const item = await buildOrderItem(raw);
      totalAmount += item._price;
      delete item._price;
      builtItems.push(item);
    }

    const orderNumber = generateOrderNumber();
    const initialStatus = ['pay_now', 'pay_later'].includes(payment_choice) ? 'preparing' : 'pending';

    const order = await prisma.order.create({
      data: {
        order_number: orderNumber,
        table_id,
        branch_id: branchId,
        total_amount: totalAmount,
        payment_choice,
        status: initialStatus,
        items: {
          create: builtItems,
        },
      },
      include: {
        table: true,
        items: true,
      },
    });

    if (payment_choice === 'pay_now') {
      await prisma.bill.upsert({
        where: { order_id: order.id },
        update: {
          is_paid: true,
          payment_method: 'digital_wallet',
          total_amount: order.total_amount,
        },
        create: {
          order_id: order.id,
          is_paid: true,
          payment_method: 'digital_wallet',
          total_amount: order.total_amount,
        },
      });
    }

    const targetRooms = getOrderRooms(order);
    emitEvent('order:created', order, targetRooms);

    res.status(201).json(order);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

// PUT/PATCH /orders/:id/
const updateOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(branchId && { branch_id: branchId }),
      },
    });

    if (!order) return res.status(404).json({ error: 'Not found or Access Denied.' });

    const { table_id, items = [] } = req.body;
    let updateData = {};

    if (table_id) updateData.table_id = table_id;

    if (items.length > 0) {
      const builtItems = [];
      let totalAmount = 0;

      for (const raw of items) {
        const item = await buildOrderItem(raw);
        totalAmount += item._price;
        delete item._price;
        builtItems.push(item);
      }

      updateData.total_amount = totalAmount;

      // Purano items metayera naya items thapchha
      await prisma.orderItem.deleteMany({ where: { order_id: order.id } });
      updateData.items = { create: builtItems };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: { table: true, items: true },
    });

    const targetRooms = getOrderRooms(updatedOrder);
    emitEvent('order:updated', updatedOrder, targetRooms);

    res.status(200).json(updatedOrder);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

// DELETE /orders/:id/
const deleteOne = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(branchId && { branch_id: branchId }),
      },
    });

    if (!order) return res.status(404).json({ error: 'Not found or Access Denied.' });

    await prisma.order.delete({ where: { id: req.params.id } });

    const targetRooms = getOrderRooms(order);
    emitEvent('order:deleted', { id: req.params.id }, targetRooms);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/accept/
const acceptOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { table: true, items: true },
    });

    if (!order) return res.status(404).json({ error: 'Not found.' });

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be accepted.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'accepted' },
      include: { table: true, items: true },
    });

    const targetRooms = getOrderRooms(updatedOrder);
    emitEvent('order:accepted', updatedOrder, targetRooms);
    emitEvent('order:updated', updatedOrder, targetRooms);

    res.status(200).json({ message: 'Order accepted. Customer can now choose payment method.', status: updatedOrder.status });
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/reject/
const rejectOrder = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(branchId && { branch_id: branchId }),
      },
      include: { table: true, items: true },
    });

    if (!order) return res.status(404).json({ error: 'Not found or Access Denied.' });

    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ error: 'Only pending or accepted orders can be rejected.' });
    }

    const { reason } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'rejected',
        rejection_reason: reason || 'Rejected by admin',
      },
      include: { table: true, items: true },
    });

    const targetRooms = getOrderRooms(updatedOrder);
    emitEvent('order:rejected', updatedOrder, targetRooms);
    emitEvent('order:updated', updatedOrder, targetRooms);

    res.status(200).json({
      message: updatedOrder.rejection_reason,
      status: updatedOrder.status,
    });
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/payment-choice/
const selectPaymentChoice = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { table: true, items: true },
    });

    if (!order) return res.status(404).json({ error: 'Not found.' });

    const { payment_choice: choice } = req.body;

    if (order.status !== 'accepted') {
      return res.status(400).json({ error: 'Payment options are only available after order acceptance.' });
    }
    if (!['pay_now', 'pay_later'].includes(choice)) {
      return res.status(400).json({ error: "Invalid choice. Select 'pay_now' or 'pay_later'." });
    }

    const targetRooms = getOrderRooms(order);

    if (choice === 'pay_now') {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          payment_choice: choice,
          status: 'preparing',
        },
        include: { table: true, items: true },
      });

      const bill = await prisma.bill.upsert({
        where: { order_id: order.id },
        update: {
          is_paid: true,
          payment_method: 'digital_wallet',
          total_amount: order.total_amount,
        },
        create: {
          order_id: order.id,
          is_paid: true,
          payment_method: 'digital_wallet',
          total_amount: order.total_amount,
        },
      });

      const invoiceData = await billController.buildInvoiceView(bill);

      emitEvent('order:payment_choice', updatedOrder, targetRooms);
      emitEvent('order:updated', updatedOrder, targetRooms);
      emitEvent('bill:created', invoiceData, targetRooms);

      return res.status(200).json({
        message: 'Payment successful! Bill generated instantly.',
        order_status: updatedOrder.status,
        bill: invoiceData,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        payment_choice: choice,
        status: 'preparing',
      },
      include: { table: true, items: true },
    });

    emitEvent('order:payment_choice', updatedOrder, targetRooms);
    emitEvent('order:updated', updatedOrder, targetRooms);

    return res.status(200).json({
      message: 'Pay Later selected. Moving order to kitchen preparation.',
      order_status: updatedOrder.status,
    });
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/set-status/
const setStatus = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { table: true, items: true },
    });

    if (!order) return res.status(404).json({ error: 'Not found.' });

    const validStatuses = ['pending', 'accepted', 'preparing', 'served', 'completed_settled', 'cancelled', 'rejected'];
    const { status: newStatus } = req.body;

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses}` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
      include: { table: true, items: true },
    });

    const targetRooms = getOrderRooms(updatedOrder);
    emitEvent('order:status_changed', updatedOrder, targetRooms);
    emitEvent('order:updated', updatedOrder, targetRooms);

    res.status(200).json({ message: `Order status manually set to ${newStatus}.`, status: updatedOrder.status });
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/append-items/
const appendItems = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(branchId && { branch_id: branchId }),
      },
      include: { table: true, items: true },
    });

    if (!order) return res.status(404).json({ error: 'Not found.' });

    if (['served', 'completed_settled', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot add items. Order is already ${order.status}.` });
    }

    const itemsData = req.body.items || [];
    if (!itemsData.length) {
      return res.status(400).json({ error: 'No items provided to add.' });
    }

    let totalAmount = Number(order.total_amount);

    for (const raw of itemsData) {
      const built = await buildOrderItem(raw);
      const itemPrice = built._price;
      delete built._price;

      const existing = order.items.find(
        (i) =>
          i.menu_item_id === built.menu_item_id &&
          i.selected_portion_id === built.selected_portion_id
      );

      if (existing) {
        await prisma.orderItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + built.quantity },
        });
      } else {
        await prisma.orderItem.create({
          data: {
            ...built,
            order_id: order.id,
          },
        });
      }

      totalAmount += itemPrice;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        total_amount: totalAmount,
        status: 'pending',
      },
      include: { table: true, items: true },
    });

    const targetRooms = getOrderRooms(updatedOrder);
    emitEvent('order:items_appended', updatedOrder, targetRooms);
    emitEvent('order:updated', updatedOrder, targetRooms);

    res.status(200).json({ message: 'Items successfully added to your order!', order: updatedOrder });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    next(err);
  }
};

// GET /orders/unseen-count
const getUnseenCount = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const count = await prisma.order.count({
      where: {
        branch_id: branchId,
        seen: false,
      },
    });
    res.status(200).json({ count });
  } catch (err) {
    next(err);
  }
};

// POST /orders/mark-seen
const markAllSeen = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const result = await prisma.order.updateMany({
      where: { branch_id: branchId, seen: false },
      data: { seen: true },
    });
    res.status(200).json({
      message: 'Orders marked as seen.',
      modified: result.count,
    });
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/rating/
const submitRating = async (req, res, next) => {
  try {
    const branchId = req.user?.branch_id || req.user?.branch;
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(branchId && { branch_id: branchId }),
      },
      include: { table: true, items: true },
    });

    if (!order) return res.status(404).json({ error: 'Not found or Access Denied.' });

    if (order.status !== 'completed_settled') {
      return res.status(400).json({ error: 'You can only rate an order after it has been completed and settled.' });
    }

    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        rating: numericRating,
        rating_comment: comment || null,
        rated_at: new Date(),
      },
      include: { table: true, items: true },
    });

    const targetRooms = getOrderRooms(updatedOrder);
    emitEvent('order:updated', updatedOrder, targetRooms);
    emitEvent('order:rated', updatedOrder, targetRooms);

    res.status(200).json({
      message: 'Thanks for your feedback!',
      rating: updatedOrder.rating,
      rating_comment: updatedOrder.rating_comment,
    });
  } catch (err) {
    next(err);
  }
};

// POST /orders/:id/payment-success/
const handlePaymentSuccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transaction_id, payment_method = 'digital_wallet' } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true, items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order भेटिएन।' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        payment_choice: 'pay_now',
        status: 'preparing',
      },
      include: { table: true, items: true },
    });

    const bill = await prisma.bill.upsert({
      where: { order_id: order.id },
      update: {
        is_paid: true,
        payment_method,
        transaction_id: transaction_id || null,
        total_amount: updatedOrder.total_amount,
      },
      create: {
        order_id: order.id,
        is_paid: true,
        payment_method,
        transaction_id: transaction_id || null,
        total_amount: updatedOrder.total_amount,
      },
    });

    const invoiceData = await billController.buildInvoiceView(bill);

    const targetRooms = getOrderRooms(updatedOrder);
    emitEvent('order:payment_success', updatedOrder, targetRooms);
    emitEvent('order:updated', updatedOrder, targetRooms);
    emitEvent('bill:created', invoiceData, targetRooms);

    return res.status(200).json({
      message: 'Payment verified and successfully updated!',
      order_status: updatedOrder.status,
      order: updatedOrder,
      bill: invoiceData,
    });
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
  acceptOrder,
  rejectOrder,
  selectPaymentChoice,
  setStatus,
  appendItems,
  getUnseenCount,
  markAllSeen,
  submitRating,
  handlePaymentSuccess,
};