/**
 * WoWSQL Realtime Client SDK
 * 
 * Provides WebSocket-based realtime subscriptions for database changes.
 * Similar to wowsql realtime API.
 */

export interface RealtimeConfig {
  url: string;
  token: string;
}

export interface RealtimeFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
  value: any;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface PostgresChangeEvent {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  new?: Record<string, any>;
  old?: Record<string, any>;
  timestamp: string;
}

export class WoWSQLRealtime {
  private ws: WebSocket | null = null;
  private channels: Map<string, Channel> = new Map();
  private url: string;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config: RealtimeConfig) {
    this.url = config.url;
    this.token = config.token;
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = `${this.url}?token=${this.token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Realtime connected');
        this.reconnectAttempts = 0;
        // Rejoin all channels
        this.channels.forEach((channel) => {
          channel.rejoin();
        });
      };

      this.ws.onerror = (error) => {
        console.error('Realtime error:', error);
      };

      this.ws.onclose = () => {
        console.log('Realtime disconnected');
        this.ws = null;
        this.attemptReconnect();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
    } catch (error) {
      console.error('Failed to connect to realtime:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: any) {
    // Route message to appropriate channel
    if (message.topic && this.channels.has(message.topic)) {
      const channel = this.channels.get(message.topic)!;
      channel.handleMessage(message);
    }
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  channel(schema: string, table: string): Channel {
    const topic = `realtime:${schema}:${table}`;
    
    if (!this.channels.has(topic)) {
      const ch = new Channel(topic, this);
      this.channels.set(topic, ch);
    }
    
    return this.channels.get(topic)!;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.channels.clear();
  }
}

export class Channel {
  private topic: string;
  private realtime: WoWSQLRealtime;
  private subscriptions: Map<string, (event: PostgresChangeEvent) => void> = new Map();

  constructor(topic: string, realtime: WoWSQLRealtime) {
    this.topic = topic;
    this.realtime = realtime;
    this.join();
  }

  private join() {
    this.realtime['send']({
      topic: this.topic,
      event: 'phx_join',
      payload: {}
    });
  }

  rejoin() {
    this.join();
    // Re-send subscription requests for all existing subscriptions
    this.subscriptions.forEach((_callback, subscriptionId) => {
      this.realtime['send']({
        topic: this.topic,
        event: 'subscribe',
        payload: { subscription_id: subscriptionId }
      });
    });
  }

  on(
    event: 'postgres_changes',
    config: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      table: string;
      schema?: string;
      filter?: RealtimeFilter;
    },
    callback: (event: PostgresChangeEvent) => void
  ): RealtimeSubscription {
    const subscriptionId = `${event}_${Date.now()}`;
    
    // Store subscription
    this.subscriptions.set(subscriptionId, callback);

    // Send subscription request
    this.realtime['send']({
      topic: this.topic,
      event: 'subscribe',
      payload: {
        event: config.event || '*',
        table: config.table,
        schema: config.schema,
        filter: config.filter
      }
    });

    return {
      unsubscribe: () => {
        this.subscriptions.delete(subscriptionId);
        this.realtime['send']({
          topic: this.topic,
          event: 'unsubscribe',
          payload: { subscription_id: subscriptionId }
        });
      }
    };
  }

  handleMessage(message: any) {
    if (message.event === 'postgres_changes') {
      this.subscriptions.forEach((callback) => {
        callback(message.payload);
      });
    }
  }
}

// Export convenience function
export function createRealtimeClient(config: RealtimeConfig): WoWSQLRealtime {
  return new WoWSQLRealtime(config);
}
