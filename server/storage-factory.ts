import { DatabaseStorage } from "./storage";
import { MemoryStorage } from "./memory-storage";
import type { IStorage } from "./storage";

class StorageFactory {
  private static instance: IStorage | null = null;

  static async getInstance(): Promise<IStorage> {
    if (this.instance) {
      return this.instance;
    }

    try {
      // Attempt to use DatabaseStorage (PostgreSQL)
      const dbStorage = new DatabaseStorage();
      
      // Test database connection by attempting a simple operation with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      );
      
      await Promise.race([
        dbStorage.getSystemConfig(),
        timeoutPromise
      ]);
      
      console.log("✅ PostgreSQL database connection successful - using DatabaseStorage");
      this.instance = dbStorage;
      return dbStorage;
    } catch (error) {
      console.warn("⚠️ PostgreSQL connection failed, falling back to MemoryStorage:", error.message);
      
      // Fall back to MemoryStorage
      const memStorage = new MemoryStorage();
      this.instance = memStorage;
      return memStorage;
    }
  }

  static reset() {
    this.instance = null;
  }
}

export { StorageFactory };