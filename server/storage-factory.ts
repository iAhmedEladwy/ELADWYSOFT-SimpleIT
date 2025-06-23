import { IStorage } from "./storage";
import { DatabaseStorage } from "./storage";
import { MemoryStorage } from "./memory-storage";

/**
 * Factory function to create the appropriate storage implementation
 * Based on environment configuration
 */
export function createStorage(): IStorage {
  // Use database storage if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    try {
      console.log('Initializing database storage...');
      return new DatabaseStorage();
    } catch (error) {
      console.error('Failed to initialize database storage, falling back to memory storage:', error);
      return new MemoryStorage();
    }
  }
  
  console.log('Using memory storage (development mode)');
  return new MemoryStorage();
}

// Singleton instance
let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

// Reset storage instance (useful for testing)
export function resetStorage(): void {
  storageInstance = null;
}