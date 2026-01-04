import { NativeJsComponentAlreadyExistsError, NativeJsComponentNotExistsError } from "./error";
import { createNativeJsDIContainer, NativeJsDIContainer } from "./di";
import type { NativeJsComponentClass, NativeRoute, NativeRouteInput, NativeRouteList, NativeRouteListInput } from "./interfaces";
import { createRouter, type NativeRouter } from "./router";
import { NativeJsDataService } from "./service";
import { NativeJsState } from "./state";

// Global DI container reference (set by NativeJs instance)
let _globalContainer: NativeJsDIContainer | null = null;

/**
 * Get the global DI container
 * @throws Error if no container is set
 */
export function getContainer(): NativeJsDIContainer {
    if (!_globalContainer) {
        throw new Error('[NativeJs] No DI container available. Initialize NativeJs first.');
    }
    return _globalContainer;
}

/**
 * Try to get the global DI container (returns undefined if not set)
 */
export function tryGetContainer(): NativeJsDIContainer | undefined {
    return _globalContainer || undefined;
}

/**
 * Resolve a service from the global container
 * Convenience function for quick access
 */
export function inject<T>(token: string): T {
    return getContainer().resolve<T>(token);
}

/**
 * Base class for all Native.js components.
 * Extends HTMLElement to create Web Components (Custom Elements v1).
 * Does not use Shadow DOM by default - renders to light DOM.
 */
export abstract class NativeJsComponent extends HTMLElement {
    /**
     * The custom element tag name (must start with "n-")
     */
    static tagName: string;

    /**
     * The ID of the template element to clone for this component
     */
    static templateId: string;

    /**
     * Dependencies to inject from the container
     * Override in subclass to specify dependencies
     * @example
     * static dependencies = ['authService', 'apiService'];
     */
    static dependencies: string[] = [];

    /**
     * Route pattern result (set by router before insertion)
     */
    protected urlPatternResult: URLPatternResult | null = null;

    /**
     * Route state (set by router before insertion)
     */
    protected routeState: object = {};

    /**
     * Component state manager
     */
    private _state: NativeJsState | null = null;

    /**
     * Data service for fetch/submit operations
     */
    private _data: NativeJsDataService | null = null;

    /**
     * DI container reference
     */
    private _container: NativeJsDIContainer | null = null;

    /**
     * Whether the template has been rendered
     */
    private _templateRendered: boolean = false;

    /**
     * Whether auto-fetch has been initiated
     */
    private _autoFetchInitiated: boolean = false;

    constructor() {
        super();
    }

    /**
     * Get the DI container
     */
    get container(): NativeJsDIContainer {
        if (!this._container) {
            // Fallback to global container
            this._container = _globalContainer;
        }
        if (!this._container) {
            throw new Error('[NativeJs] No DI container available');
        }
        return this._container;
    }

    /**
     * Get the component state manager
     * Available after the component is connected to the DOM
     */
    get state(): NativeJsState {
        if (!this._state) {
            throw new Error('State is not available until component is connected to DOM');
        }
        return this._state;
    }

    /**
     * Get the data service for fetch/submit operations
     * Automatically bound to component state for easy data storage
     */
    get data(): NativeJsDataService {
        if (!this._data) {
            throw new Error('Data service is not available until component is connected to DOM');
        }
        return this._data;
    }

    /**
     * Resolve a service from the DI container
     * Convenience method for component use
     */
    protected inject<T>(token: string): T {
        return this.container.resolve<T>(token);
    }

    /**
     * Try to resolve a service from the DI container
     */
    protected tryInject<T>(token: string): T | undefined {
        return this.container.tryResolve<T>(token);
    }

    /**
     * Native Web Component lifecycle - called when element is added to DOM.
     * Renders the template and calls onInit.
     */
    connectedCallback() {
        // Get container reference
        this._container = _globalContainer;
        
        // Initialize state manager
        this._state = new NativeJsState(this);
        
        // Initialize data service with state binding
        this._data = new NativeJsDataService({ state: this._state });
        
        // Inject declared dependencies
        this.injectDependencies();
        
        this.renderTemplate();
        
        // Handle auto-fetch if n-fetch attribute is present
        this.handleAutoFetch();
        
        this.onInit(this.urlPatternResult, this.routeState);
    }

    /**
     * Inject dependencies declared in static dependencies array
     */
    private injectDependencies(): void {
        const constructor = this.constructor as typeof NativeJsComponent;
        const deps = constructor.dependencies || [];
        
        if (!this._container || deps.length === 0) return;
        
        for (const token of deps) {
            if (this._container.has(token)) {
                // Set as property on the component
                (this as Record<string, unknown>)[token] = this._container.resolve(token);
            }
        }
    }

    /**
     * Native Web Component lifecycle - called when element is removed from DOM
     */
    disconnectedCallback() {
        // Can be overridden by subclasses
    }

    /**
     * Set route data before the component is inserted into the DOM.
     * Called by the router.
     */
    setRouteData(urlPatternResult: URLPatternResult, state: object) {
        this.urlPatternResult = urlPatternResult;
        this.routeState = state;
    }

    /**
     * Handle auto-fetch from n-fetch attribute
     * Fetches data and stores in state under n-fetch-key (defaults to 'data')
     */
    private async handleAutoFetch(): Promise<void> {
        if (this._autoFetchInitiated) return;
        
        const fetchUrl = this.getAttribute('n-fetch');
        if (!fetchUrl || !this._data) return;
        
        this._autoFetchInitiated = true;
        const stateKey = this.getAttribute('n-fetch-key') || 'data';
        
        // Set loading state
        this._state?.set(`${stateKey}Loading`, true);
        this._state?.set(`${stateKey}Error`, null);
        
        const response = await this._data.fetch(fetchUrl, { stateKey });
        
        // Update loading/error state
        this._state?.set(`${stateKey}Loading`, false);
        if (!response.ok) {
            this._state?.set(`${stateKey}Error`, response.error);
        }
        
        // Call onDataFetched hook
        this.onDataFetched(stateKey, response.data, response.error);
    }

    /**
     * Lifecycle hook called after auto-fetch completes
     * Override to handle fetched data
     */
    public onDataFetched(stateKey: string, data: unknown, error: string | null) {
        // Override in subclass
    }

    /**
     * Renders the template content into the component (light DOM)
     */
    private renderTemplate() {
        const constructor = this.constructor as typeof NativeJsComponent;
        
        // Skip if no template defined or already rendered
        if (!constructor.templateId || this._templateRendered) {
            return;
        }

        const templateEl = document.querySelector<HTMLTemplateElement>('#' + constructor.templateId);
        
        if (!templateEl) {
            throw new Error(`Template with id "${constructor.templateId}" not found`);
        }

        // Clear any existing content
        this.innerHTML = '';

        const clonedContent = document.importNode(templateEl.content, true);
        this.appendChild(clonedContent);
        
        this._templateRendered = true;
    }

    /**
     * Query a single child element within this component
     */
    public getChild<T extends HTMLElement = HTMLElement>(selector: string): T | null {
        return this.querySelector<T>(selector);
    }

    /**
     * Query multiple child elements within this component
     */
    public getChildren<T extends HTMLElement = HTMLElement>(selector: string): T[] {
        return Array.from(this.querySelectorAll<T>(selector));
    }

    /**
     * Lifecycle hook called after the component is connected to the DOM.
     * Override this in subclasses to initialize component logic.
     */
    public onInit(urlPatternResult: URLPatternResult | null, state: object) {
        // Override in subclass
    }
}

/**
 * Registry for managing NativeJsComponent classes
 */
export class NativeJsComponentRegistry {
    private registeredTags: Set<string>;

    constructor() {
        this.registeredTags = new Set();
    }

    /**
     * Register a component class as a custom element if not already registered
     */
    public registerComponentClass(componentClass: NativeJsComponentClass) {
        const tagName = componentClass.tagName;
        
        if (!tagName) {
            throw new Error('Component class must have a static tagName property');
        }

        if (!tagName.startsWith('n-')) {
            throw new Error(`Custom element tag name must start with "n-", got: "${tagName}"`);
        }

        if (!this.registeredTags.has(tagName)) {
            customElements.define(tagName, componentClass);
            this.registeredTags.add(tagName);
        }
    }

    /**
     * Check if a component class is registered
     */
    public isRegistered(tagName: string): boolean {
        return this.registeredTags.has(tagName);
    }
}

/**
 * Create a new component registry
 */
export function createNativeJsComponentRegistry() {
    return new NativeJsComponentRegistry();
}

// Global reference to the active NativeJs instance for navigation
let activeNativeJsInstance: NativeJs | null = null;

/**
 * Navigate to a URL programmatically (global function)
 * @param url - The URL to navigate to
 * @param state - Optional state object to pass to the route
 */
export function navigateTo(url: string, state: object = {}): void {
    if (!activeNativeJsInstance) {
        throw new Error('No active NativeJs instance. Call nativeJs.run() first.');
    }
    activeNativeJsInstance.navigateTo(url, state);
}

/**
 * Main Native.js application class
 */
export class NativeJs {
    readonly host: HTMLElement;
    readonly registry: NativeJsComponentRegistry;
    readonly router: NativeRouter;
    readonly container: NativeJsDIContainer;

    constructor(
        host: HTMLElement, 
        router: NativeRouter, 
        registry: NativeJsComponentRegistry,
        container: NativeJsDIContainer
    ) {
        this.host = host;
        this.registry = registry;
        this.router = router;
        this.container = container;
    }

    /**
     * Register a service with the DI container
     * Convenience method for fluent configuration
     */
    public register<T>(
        token: string, 
        provider: ((container: NativeJsDIContainer) => T) | (new (container: NativeJsDIContainer) => T),
        lifecycle: 'singleton' | 'transient' = 'singleton'
    ): this {
        this.container.register(token, provider, lifecycle);
        return this;
    }

    /**
     * Register a singleton service
     */
    public singleton<T>(
        token: string, 
        provider: ((container: NativeJsDIContainer) => T) | (new (container: NativeJsDIContainer) => T)
    ): this {
        this.container.singleton(token, provider);
        return this;
    }

    /**
     * Register a transient service (new instance each time)
     */
    public transient<T>(
        token: string, 
        provider: ((container: NativeJsDIContainer) => T) | (new (container: NativeJsDIContainer) => T)
    ): this {
        this.container.transient(token, provider);
        return this;
    }

    /**
     * Register an existing instance
     */
    public instance<T>(token: string, value: T): this {
        this.container.instance(token, value);
        return this;
    }

    /**
     * Resolve a service from the container
     */
    public resolve<T>(token: string): T {
        return this.container.resolve<T>(token);
    }

    /**
     * Start the framework
     */
    public run() {
        activeNativeJsInstance = this;
        _globalContainer = this.container;
        this.router.start();
    }

    /**
     * Navigate to a URL programmatically
     * @param url - The URL to navigate to (relative paths will have basePath prepended)
     * @param state - Optional state object to pass to the route
     */
    public navigateTo(url: string, state: object = {}): void {
        this.router.navigateTo(url, state);
    }
}

/**
 * Convert route inputs to native routes and register component classes
 */
function getNativeRoutesFromInput<T extends NativeJsComponent>(
    registry: NativeJsComponentRegistry, 
    routes: NativeRouteListInput<T>
): NativeRouteList {
    const nativeRoutes: NativeRouteList = [];

    for (const routeInput of routes) {
        const nativeRoute = createRouteFromInput(registry, routeInput);
        nativeRoutes.push(nativeRoute);
    }

    return nativeRoutes;
}

/**
 * Create a native route from input, registering the component class
 */
function createRouteFromInput<T extends NativeJsComponent>(
    registry: NativeJsComponentRegistry, 
    routeInput: NativeRouteInput<T>
): NativeRoute {
    // Register the component class as a custom element
    registry.registerComponentClass(routeInput.element);
    
    return {
        pathname: routeInput.pathname,
        componentName: routeInput.element.tagName
    };
}

/**
 * Create and initialize a Native.js application
 */
export interface NativeJsOptions {
    /** Base path for all routes (empty string for root, auto-detected if not set) */
    basePath?: string;
    /** Existing DI container to use (creates new one if not provided) */
    container?: NativeJsDIContainer;
}

/**
 * Service registration callback for configuring the DI container
 */
export type NativeJsServicesConfig = (container: NativeJsDIContainer) => void;

export function createNativeJs<T extends NativeJsComponent>(
    host: HTMLElement, 
    routes: NativeRouteListInput<T>,
    options?: NativeJsOptions
) {
    const registry = createNativeJsComponentRegistry();
    const container = options?.container || createNativeJsDIContainer();
    const nativeRoutes = getNativeRoutesFromInput(registry, routes);
    const router = createRouter(registry, nativeRoutes, { 
        host, 
        basePath: options?.basePath 
    });
    
    // Set global container early so it's available during service registration
    _globalContainer = container;
    
    return new NativeJs(host, router, registry, container);
}

// Legacy exports for backwards compatibility
export { NativeJsComponent as NativeJsElement };
