import { useEffect, useRef, useCallback, useState } from 'react';

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

interface WebSocketMessage {
  type: 'connected' | 'new_log' | 'stats_update';
  data?: any;
  message?: string;
  timestamp: string;
}

interface UseLogStreamOptions {
  onNewLog?: (log: LogMessage) => void;
  onStatsUpdate?: (stats: any) => void;
  autoReconnect?: boolean;
}

export function useLogStream(options: UseLogStreamOptions = {}) {
  const {
    onNewLog,
    onStatsUpdate,
    autoReconnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      // Determine WebSocket protocol based on current page protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/logs`;

      console.log('[WebSocket] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to log stream');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('[WebSocket]', message.message);
              break;
            
            case 'new_log':
              if (onNewLog && message.data) {
                onNewLog(message.data as LogMessage);
              }
              break;
            
            case 'stats_update':
              if (onStatsUpdate && message.data) {
                onStatsUpdate(message.data);
              }
              break;
            
            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        setConnectionError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (autoReconnect && reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= 10) {
          setConnectionError('Failed to connect after multiple attempts');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [onNewLog, onStatsUpdate, autoReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    reconnect: connect,
    disconnect,
  };
}
