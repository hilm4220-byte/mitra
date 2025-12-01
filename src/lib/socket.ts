import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle chat messages
    socket.on('chat:message', (msg: { text: string; senderId: string; timestamp: string }) => {
      console.log('Chat message received:', msg);
      
      // Broadcast to all clients (including sender)
      io.emit('chat:message', {
        text: msg.text,
        senderId: msg.senderId,
        timestamp: msg.timestamp || new Date().toISOString(),
      });
    });

    // Handle typing indicator
    socket.on('chat:typing', (data: { isTyping: boolean; userId: string }) => {
      socket.broadcast.emit('chat:typing', {
        isTyping: data.isTyping,
        userId: data.userId,
      });
    });

    // Handle legacy message format
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('chat:message', {
      text: 'Selamat datang di chat PijatJogja! Ada yang bisa kami bantu?',
      senderId: 'admin',
      timestamp: new Date().toISOString(),
    });
  });
};