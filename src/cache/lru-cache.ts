/**
 * Simple LRU (Least Recently Used) Cache implementation
 * Optimized for performance with O(1) get/set operations
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>
  private readonly maxSize: number

  constructor(maxSize: number = 2000) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    // Delete if exists to re-add at end
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // Remove oldest if at capacity
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  get hitRate(): number {
    return 0 // This will be tracked separately
  }
}

/**
 * Create a simple hash for string content
 * Using a fast non-cryptographic hash for performance
 */
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

/**
 * Cache with hit/miss tracking for performance metrics
 */
export class TrackedLRUCache<K, V> extends LRUCache<K, V> {
  private hits = 0
  private misses = 0

  get(key: K): V | undefined {
    const value = super.get(key)
    if (value !== undefined) {
      this.hits++
    } else {
      this.misses++
    }
    return value
  }

  get hitRate(): number {
    const total = this.hits + this.misses
    return total === 0 ? 0 : this.hits / total
  }

  get stats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hitRate,
      size: this.size
    }
  }

  resetStats(): void {
    this.hits = 0
    this.misses = 0
  }
}
