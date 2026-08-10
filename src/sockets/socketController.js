const jwt = require('jsonwebtoken');
const { prisma } = require('../config/dbConnect');

// User fields selection
const userSelectFields = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  email: true,
  role: true,
  is_admin: true,
  is_staff: true,
  super_user: true,
  restaurant_id: true,
  branch_id: true,
  createdAt: true,
  updatedAt: true,
};

// Helper: Authenticate socket user via token
const authenticateSocket = async (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectFields,
    });
    return user || null;
  } catch (err) {
    return null;
  }
};

// Register Socket Listeners for Data Operations
const registerSocketHandlers = (io, socket) => {
  
  // 🟢 1. GET ALL USERS (Fetch/XHR को सट्टा Socket Request)
  socket.on('get_all_users', async (data = {}, callback) => {
    try {
      const user = await authenticateSocket(socket.handshake.auth?.token || data.token);
      if (!user) {
        return callback ? callback({ success: false, error: 'Unauthorized' }) : socket.emit('error', 'Unauthorized');
      }

      const users = await prisma.user.findMany({
        select: userSelectFields,
        orderBy: { createdAt: 'desc' },
      });

      if (callback) callback({ success: true, data: users });
      else socket.emit('users_data', users);
    } catch (error) {
      console.error('[Socket Error] get_all_users:', error.message);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 🟢 2. GET ORDERS
  socket.on('get_branch_orders', async (data, callback) => {
    try {
      const { branchId } = data;
      const orders = await prisma.order.findMany({
        where: { branch_id: branchId },
        include: { items: true, table: true },
        orderBy: { created_at: 'desc' },
      });

      if (callback) callback({ success: true, data: orders });
      else socket.emit('orders_data', orders);
    } catch (error) {
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 🟢 3. UPDATE ORDER STATUS (Broadcast with Live Sync)
  socket.on('update_order_status', async (data, callback) => {
    try {
      const { orderId, status } = data;
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: { items: true },
      });

      // Broadcast to Admin & Specific Order Room without HTTP fetch
      io.to('admin').to(`order_${orderId}`).emit('order_updated', updatedOrder);

      if (callback) callback({ success: true, data: updatedOrder });
    } catch (error) {
      if (callback) callback({ success: false, error: error.message });
    }
  });
};

module.exports = { registerSocketHandlers, authenticateSocket };