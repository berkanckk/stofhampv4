interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Özel TTL süresi (ms)
}

type FilterValue = string | number | boolean | null;

interface CompositeKey {
  page: number;
  sortBy: string;
  filters: Record<string, FilterValue>;
}

interface BatchKey {
  userId: string;
  items: string[];
}

interface MessageCacheKey {
  conversationId: string;
  page: number;
  limit: number;
}

class Cache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private readonly DEFAULT_TTL: number = 5 * 60 * 1000; // 5 dakika
  private readonly COMPOSITE_TTL: number = 2 * 60 * 1000; // 2 dakika
  private readonly BATCH_TTL: number = 30 * 1000; // 30 saniye
  private readonly MESSAGE_TTL: number = 30 * 1000; // 30 saniye

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = item.ttl || this.DEFAULT_TTL;

    // TTL kontrolü
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Composite cache metodları
  setComposite<T>(prefix: string, key: CompositeKey, data: T): void {
    const compositeKey = this.generateCompositeKey(prefix, key);
    this.set(compositeKey, data, this.COMPOSITE_TTL);
  }

  getComposite<T>(prefix: string, key: CompositeKey): T | null {
    const compositeKey = this.generateCompositeKey(prefix, key);
    return this.get<T>(compositeKey);
  }

  // Batch işlem metodları
  setBatch<T>(prefix: string, key: BatchKey, data: T): void {
    const batchKey = this.generateBatchKey(prefix, key);
    this.set(batchKey, data, this.BATCH_TTL);
  }

  getBatch<T>(prefix: string, key: BatchKey): T | null {
    const batchKey = this.generateBatchKey(prefix, key);
    return this.get<T>(batchKey);
  }

  setMessages<T>(key: MessageCacheKey, data: T): void {
    const cacheKey = this.generateMessageCacheKey(key);
    this.set(cacheKey, data, this.MESSAGE_TTL);
  }

  getMessages<T>(key: MessageCacheKey): T | null {
    const cacheKey = this.generateMessageCacheKey(key);
    return this.get<T>(cacheKey);
  }

  private generateCompositeKey(prefix: string, key: CompositeKey): string {
    const { page, sortBy, filters } = key;
    const filterString = Object.entries(filters)
      .filter(([_, value]) => value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('_');
    
    return `${prefix}_${page}_${sortBy}_${filterString}`;
  }

  private generateBatchKey(prefix: string, key: BatchKey): string {
    const { userId, items } = key;
    return `${prefix}_${userId}_${items.sort().join('_')}`;
  }

  private generateMessageCacheKey(key: MessageCacheKey): string {
    const { conversationId, page, limit } = key;
    return `messages_${conversationId}_${page}_${limit}`;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    const keys = this.keys();
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        this.invalidate(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const globalCache = new Cache(); 