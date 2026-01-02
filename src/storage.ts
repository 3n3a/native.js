/**
 * Storage type options
 */
export type NativeJsStorageType = 'session' | 'local';

/**
 * Interface for storage backends - allows future extension
 */
export interface NativeJsStorageBackend {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}

/**
 * Wrapper for browser storage (sessionStorage/localStorage)
 * Provides a unified interface that can be extended in the future
 */
export class NativeJsStorage {
    private backend: NativeJsStorageBackend;
    private type: NativeJsStorageType;

    constructor(type: NativeJsStorageType = 'session') {
        this.type = type;
        this.backend = this.getBackend(type);
    }

    private getBackend(type: NativeJsStorageType): NativeJsStorageBackend {
        switch (type) {
            case 'local':
                return window.localStorage;
            case 'session':
            default:
                return window.sessionStorage;
        }
    }

    /**
     * Get raw string value from storage
     */
    getRaw(key: string): string | null {
        return this.backend.getItem(key);
    }

    /**
     * Set raw string value in storage
     */
    setRaw(key: string, value: string): void {
        this.backend.setItem(key, value);
    }

    /**
     * Get parsed JSON value from storage
     */
    get<T = unknown>(key: string): T | null {
        const raw = this.backend.getItem(key);
        if (raw === null) {
            return null;
        }
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }

    /**
     * Set JSON-serialized value in storage
     */
    set<T = unknown>(key: string, value: T): void {
        this.backend.setItem(key, JSON.stringify(value));
    }

    /**
     * Remove a key from storage
     */
    remove(key: string): void {
        this.backend.removeItem(key);
    }

    /**
     * Clear all storage
     */
    clear(): void {
        this.backend.clear();
    }

    /**
     * Get the storage type
     */
    getType(): NativeJsStorageType {
        return this.type;
    }
}

/**
 * Create a storage instance
 */
export function createNativeJsStorage(type: NativeJsStorageType = 'session'): NativeJsStorage {
    return new NativeJsStorage(type);
}

