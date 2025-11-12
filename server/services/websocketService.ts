import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from './logger';

interface LogMessage {
  id: number;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  module: string;
  message: string;
  userId: number | null;
  requestId: string | null;
  metadata: any;
  stackTrace: string | null;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/logs' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] New client connected to log stream');
      this.clients.add(ws);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to log stream',
        timestamp: new Date().toISOString(),
      }));

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected from log stream');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
        this.clients.delete(ws);
      });

      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      ws.on('close', () => {
        clearInterval(pingInterval);
      });
    });

    this.wss.on('error', (error) => {
      console.error('[WebSocket] Server error:', error);
    });

    logger.info('websocket', 'WebSocket server initialized on /ws/logs', {});
  }

  /**
   * Broadcast a new log entry to all connected clients
   */
  broadcastLog(log: LogMessage) {
    if (!this.wss || this.clients.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'new_log',
      data: log,
      timestamp: new Date().toISOString(),
    });

    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          successCount++;
        } catch (error) {
          console.error('[WebSocket] Error sending to client:', error);
          failCount++;
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });

    if (successCount > 0) {
      console.log(`[WebSocket] Broadcasted log to ${successCount} client(s)`);
    }
    if (failCount > 0) {
      console.log(`[WebSocket] Failed to send to ${failCount} client(s)`);
    }
  }

  /**
   * Broadcast statistics update to all connected clients
   */
  broadcastStats(stats: any) {
    if (!this.wss || this.clients.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'stats_update',
      data: stats,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[WebSocket] Error sending stats:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  /**
   * Get count of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Close all connections and shutdown server
   */
  shutdown() {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.close(1000, 'Server shutting down');
      });
      this.clients.clear();
      this.wss.close();
      this.wss = null;
      logger.info('websocket', 'WebSocket server shut down', {});
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
