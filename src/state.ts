import { NativeJsStorage, type NativeJsStorageType } from "./storage";

/**
 * State data type - JSON-serializable object
 */
export type NativeJsStateData = Record<string, unknown>;

/**
 * State mode determines how state is stored
 */
export type NativeJsStateMode = 'attribute' | 'storage';

/**
 * State configuration parsed from component attributes
 */
export interface NativeJsStateConfig {
    mode: NativeJsStateMode;
    storageKey?: string;
    storageType?: NativeJsStorageType;
}

/**
 * Unified state manager for NativeJsComponent
 * Provides the same API regardless of whether state is stored in attribute or storage
 */
export class NativeJsState {
    private element: HTMLElement;
    private config: NativeJsStateConfig;
    private storage: NativeJsStorage | null = null;
    private cache: NativeJsStateData = {};

    constructor(element: HTMLElement) {
        this.element = element;
        this.config = this.parseConfig();
        this.initialize();
    }

    /**
     * Parse state configuration from element attributes
     */
    private parseConfig(): NativeJsStateConfig {
        const stateKey = this.element.getAttribute('n-state-key');
        
        if (stateKey) {
            // Storage-backed state
            const storageType = (this.element.getAttribute('n-state-storage') || 'session') as NativeJsStorageType;
            return {
                mode: 'storage',
                storageKey: stateKey,
                storageType: storageType
            };
        }
        
        // Attribute-backed state (default)
        return {
            mode: 'attribute'
        };
    }

    /**
     * Initialize state from source
     */
    private initialize(): void {
        if (this.config.mode === 'storage' && this.config.storageKey) {
            this.storage = new NativeJsStorage(this.config.storageType);
            const stored = this.storage.get<NativeJsStateData>(this.config.storageKey);
            this.cache = stored || {};
        } else {
            // Parse from n-state attribute
            const attrValue = this.element.getAttribute('n-state');
            if (attrValue) {
                try {
                    this.cache = JSON.parse(attrValue);
                } catch {
                    this.cache = {};
                }
            }
        }
    }

    /**
     * Persist state to source (attribute or storage)
     */
    private persist(): void {
        if (this.config.mode === 'storage' && this.storage && this.config.storageKey) {
            this.storage.set(this.config.storageKey, this.cache);
        } else {
            this.element.setAttribute('n-state', JSON.stringify(this.cache));
        }
    }

    /**
     * Get a single value from state
     */
    get<T = unknown>(key: string): T | undefined {
        return this.cache[key] as T | undefined;
    }

    /**
     * Get all state data
     */
    getAll(): NativeJsStateData {
        return { ...this.cache };
    }

    /**
     * Set a single value in state
     */
    set<T = unknown>(key: string, value: T): void {
        this.cache[key] = value;
        this.persist();
    }

    /**
     * Set multiple values in state
     */
    setAll(data: NativeJsStateData): void {
        this.cache = { ...this.cache, ...data };
        this.persist();
    }

    /**
     * Replace entire state
     */
    replace(data: NativeJsStateData): void {
        this.cache = { ...data };
        this.persist();
    }

    /**
     * Remove a key from state
     */
    remove(key: string): void {
        delete this.cache[key];
        this.persist();
    }

    /**
     * Clear all state
     */
    clear(): void {
        this.cache = {};
        this.persist();
    }

    /**
     * Check if a key exists in state
     */
    has(key: string): boolean {
        return key in this.cache;
    }

    /**
     * Get the current state mode
     */
    getMode(): NativeJsStateMode {
        return this.config.mode;
    }

    /**
     * Get the storage key (if using storage mode)
     */
    getStorageKey(): string | undefined {
        return this.config.storageKey;
    }
}

