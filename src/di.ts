/**
 * Native.js Dependency Injection
 * 
 * A lightweight, performant DI container using the service locator pattern.
 * Supports singleton and transient lifecycles.
 */

/** Factory function that creates a service instance */
export type NativeJsServiceFactory<T> = (container: NativeJsDIContainer) => T;

/** Class constructor for a service */
export type NativeJsServiceClass<T> = new (container: NativeJsDIContainer) => T;

/** Provider can be either a factory function or a class */
export type NativeJsServiceProvider<T> = NativeJsServiceFactory<T> | NativeJsServiceClass<T>;

/** Service lifecycle - singleton (shared) or transient (new each time) */
export type NativeJsServiceLifecycle = 'singleton' | 'transient';

/** Internal service registration */
interface ServiceRegistration<T = unknown> {
    provider: NativeJsServiceProvider<T>;
    lifecycle: NativeJsServiceLifecycle;
    instance?: T;
}

/**
 * Dependency Injection Container
 * 
 * Manages service registration, resolution, and lifecycle.
 * 
 * @example
 * ```typescript
 * const container = new NativeJsDIContainer();
 * 
 * // Register services
 * container.singleton('auth', AuthService);
 * container.singleton('api', (c) => new ApiService(c.resolve('auth')));
 * 
 * // Resolve services
 * const auth = container.resolve<AuthService>('auth');
 * ```
 */
export class NativeJsDIContainer {
    private services: Map<string, ServiceRegistration> = new Map();
    private resolving: Set<string> = new Set(); // Circular dependency detection
    
    /**
     * Register a service with the container
     * 
     * @param token - Unique identifier for the service
     * @param provider - Factory function or class constructor
     * @param lifecycle - 'singleton' (default) or 'transient'
     */
    register<T>(
        token: string,
        provider: NativeJsServiceProvider<T>,
        lifecycle: NativeJsServiceLifecycle = 'singleton'
    ): this {
        this.services.set(token, { provider, lifecycle });
        return this;
    }
    
    /**
     * Register a singleton service (one shared instance)
     */
    singleton<T>(token: string, provider: NativeJsServiceProvider<T>): this {
        return this.register(token, provider, 'singleton');
    }
    
    /**
     * Register a transient service (new instance each resolution)
     */
    transient<T>(token: string, provider: NativeJsServiceProvider<T>): this {
        return this.register(token, provider, 'transient');
    }
    
    /**
     * Register an existing instance directly
     * Useful for pre-configured services or external objects
     */
    instance<T>(token: string, value: T): this {
        this.services.set(token, {
            provider: () => value,
            lifecycle: 'singleton',
            instance: value
        });
        return this;
    }
    
    /**
     * Resolve a service from the container
     * 
     * @param token - Service identifier
     * @returns The resolved service instance
     * @throws Error if service not registered or circular dependency detected
     */
    resolve<T>(token: string): T {
        const registration = this.services.get(token);
        
        if (!registration) {
            throw new Error(`[NativeJs DI] Service "${token}" is not registered`);
        }
        
        // Return cached singleton
        if (registration.lifecycle === 'singleton' && registration.instance !== undefined) {
            return registration.instance as T;
        }
        
        // Circular dependency check
        if (this.resolving.has(token)) {
            throw new Error(`[NativeJs DI] Circular dependency detected for "${token}"`);
        }
        
        this.resolving.add(token);
        
        try {
            const instance = this.createInstance(registration.provider) as T;
            
            // Cache singleton
            if (registration.lifecycle === 'singleton') {
                registration.instance = instance;
            }
            
            return instance;
        } finally {
            this.resolving.delete(token);
        }
    }
    
    /**
     * Try to resolve a service, returning undefined if not found
     */
    tryResolve<T>(token: string): T | undefined {
        if (!this.has(token)) {
            return undefined;
        }
        return this.resolve<T>(token);
    }
    
    /**
     * Check if a service is registered
     */
    has(token: string): boolean {
        return this.services.has(token);
    }
    
    /**
     * Get all registered service tokens
     */
    getTokens(): string[] {
        return Array.from(this.services.keys());
    }
    
    /**
     * Clear a specific service (removes registration and instance)
     */
    clear(token: string): boolean {
        return this.services.delete(token);
    }
    
    /**
     * Clear all services
     */
    clearAll(): void {
        this.services.clear();
    }
    
    /**
     * Create a child container that inherits parent registrations
     * Child can override parent services without affecting parent
     */
    createChild(): NativeJsDIContainer {
        const child = new NativeJsDIContainer();
        // Copy registrations (not instances) from parent
        this.services.forEach((registration, token) => {
            child.services.set(token, { 
                provider: registration.provider, 
                lifecycle: registration.lifecycle, 
                instance: undefined 
            });
        });
        return child;
    }
    
    /**
     * Create instance from provider
     */
    private createInstance<T>(provider: NativeJsServiceProvider<T>): T {
        // Check if it's a class constructor
        if (this.isClass(provider)) {
            return new (provider as NativeJsServiceClass<T>)(this);
        }
        // It's a factory function
        return (provider as NativeJsServiceFactory<T>)(this);
    }
    
    /**
     * Determine if provider is a class (has prototype with constructor)
     */
    private isClass(provider: unknown): boolean {
        if (typeof provider !== 'function') return false;
        
        // Check for class characteristics
        const str = provider.toString();
        // ES6 classes start with 'class'
        if (str.startsWith('class')) return true;
        
        // Check prototype chain for constructor functions
        const proto = (provider as { prototype?: object }).prototype;
        return proto !== undefined && 
               proto.constructor === provider &&
               Object.getOwnPropertyNames(proto).length > 1;
    }
}

/**
 * Create a new DI container
 */
export function createNativeJsDIContainer(): NativeJsDIContainer {
    return new NativeJsDIContainer();
}

/**
 * Interface for services that want container access
 */
export interface NativeJsInjectable {
    readonly container: NativeJsDIContainer;
}

/**
 * Base class for injectable services
 * Provides container access and convenient resolve method
 */
export abstract class NativeJsService implements NativeJsInjectable {
    constructor(public readonly container: NativeJsDIContainer) {}
    
    /**
     * Convenience method to resolve dependencies
     */
    protected resolve<T>(token: string): T {
        return this.container.resolve<T>(token);
    }
    
    /**
     * Try to resolve a dependency
     */
    protected tryResolve<T>(token: string): T | undefined {
        return this.container.tryResolve<T>(token);
    }
}

