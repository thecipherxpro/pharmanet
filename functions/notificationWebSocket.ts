import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// In-memory store for connected clients (per Deno instance)
// In production, you'd use Redis or similar for multi-instance support
const connectedClients = new Map();

Deno.serve(async (req) => {
  // Handle WebSocket upgrade
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let userEmail = null;
    let userId = null;
    
    socket.onopen = () => {
      console.log("🔌 WebSocket client connected");
    };
    
    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle authentication
        if (message.type === 'auth') {
          const base44 = createClientFromRequest(req);
          // Set the token from the message
          if (message.token) {
            base44.setToken(message.token);
          }
          
          try {
            const user = await base44.auth.me();
            if (user) {
              userEmail = user.email;
              userId = user.id;
              
              // Store connection
              connectedClients.set(userEmail, socket);
              
              socket.send(JSON.stringify({
                type: 'auth_success',
                message: 'Connected to notification service',
                email: userEmail
              }));
              
              console.log(`✅ User authenticated: ${userEmail}`);
            } else {
              socket.send(JSON.stringify({
                type: 'auth_error',
                message: 'Authentication failed'
              }));
            }
          } catch (authError) {
            socket.send(JSON.stringify({
              type: 'auth_error',
              message: 'Authentication failed'
            }));
          }
        }
        
        // Handle ping to keep connection alive
        if (message.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    socket.onclose = () => {
      if (userEmail) {
        connectedClients.delete(userEmail);
        console.log(`👋 User disconnected: ${userEmail}`);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return response;
  }
  
  // Handle HTTP POST to send notification to connected clients
  if (req.method === 'POST') {
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { target_email, notification } = await req.json();
      
      if (!target_email || !notification) {
        return Response.json({ error: 'Missing target_email or notification' }, { status: 400 });
      }
      
      // Check if target user is connected
      const clientSocket = connectedClients.get(target_email);
      
      if (clientSocket && clientSocket.readyState === 1) { // 1 = OPEN
        clientSocket.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
        
        return Response.json({
          success: true,
          delivered: true,
          message: 'Notification sent via WebSocket'
        });
      }
      
      return Response.json({
        success: true,
        delivered: false,
        message: 'User not connected, notification stored only'
      });
      
    } catch (error) {
      console.error('Push notification error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
  
  // Handle GET to check connection status
  if (req.method === 'GET') {
    return Response.json({
      status: 'ok',
      connected_clients: connectedClients.size
    });
  }
  
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});