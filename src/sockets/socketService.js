const { Server } = require('socket.io');
const { registerSocketHandlers } = require('./socketController');

let io = null;

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

    // Join Rooms
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

    // 🟢 Register Data Handlers (Network Tab Bypass Logic)
    registerSocketHandlers(io, socket);

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

const emitEvent = (event, payload, rooms) => {
  if (!io) return;

  if (!rooms) {
    io.emit(event, payload);
    return;
  }

  const roomList = Array.isArray(rooms) ? rooms : [rooms];
  roomList.forEach((room) => io.to(room).emit(event, payload));
};

module.exports = { initSocket, getIO, emitEvent };