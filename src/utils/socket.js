const { Server } = require('socket.io');

let io = null;

/**
 * Rooms used across the app:
 *  - 'admin'          -> kitchen/admin dashboards, joined via socket.emit('join_admin')
 *  - `table_<number>` -> a specific dine-in table, joined via socket.emit('join_table', tableNumber)
 *  - `order_<id>`     -> a specific order, joined via socket.emit('join_order', orderId)
 *
 * Every resource in the app (orders, bills, tables, menu, categories,
 * notices, gallery, team, organization, sliders, overview, contact
 * submissions, job applications) broadcasts create/update/delete events
 * over these sockets so any connected client (admin dashboard, kitchen
 * display, customer QR page) stays in sync live, without polling.
 */
const initSocket = (server, allowedOrigins = []) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on('join_admin', () => {
      socket.join('admin');
      socket.emit('joined', { room: 'admin' });
    });

    socket.on('join_table', (tableNumber) => {
      if (!tableNumber) return;
      socket.join(`table_${tableNumber}`);
      socket.emit('joined', { room: `table_${tableNumber}` });
    });

    socket.on('join_order', (orderId) => {
      if (!orderId) return;
      socket.join(`order_${orderId}`);
      socket.emit('joined', { room: `order_${orderId}` });
    });

    socket.on('leave_order', (orderId) => {
      if (!orderId) return;
      socket.leave(`order_${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io has not been initialized yet. Call initSocket(server) first.');
  return io;
};

/**
 * Broadcasts an event + payload.
 *   emitEvent('menu:created', item)                      -> everyone
 *   emitEvent('order:accepted', order, 'admin')           -> just the admin room
 *   emitEvent('order:accepted', order, `order_${orderId}`) -> just that order's room
 *   emitEvent('order:accepted', order, ['admin', `order_${id}`]) -> multiple rooms
 * Safe no-op if sockets haven't been initialized (e.g. running scripts/tests).
 */
const emitEvent = (event, payload, rooms) => {
  if (!io) return;

  if (!rooms) {
    io.emit(event, payload); // 👈 'rooms' नदिँदा Global (सबैलाई) emit हुन्छ
    return;
  }

  const roomList = Array.isArray(rooms) ? rooms : [rooms];
  roomList.forEach((room) => io.to(room).emit(event, payload));
};

module.exports = { initSocket, getIO, emitEvent };
