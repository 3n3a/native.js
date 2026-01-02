import { NativeJsComponentAlreadyExistsError, NativeJsComponentNotExistsError } from "./error";
import type { NativeJsComponentClass, NativeRoute, NativeRouteInput, NativeRouteList, NativeRouteListInput } from "./interfaces";
import { createRouter, type NativeRouter } from "./router";

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
     * Route pattern result (set by router before insertion)
     */
    protected urlPatternResult: URLPatternResult | null = null;

    /**
     * Route state (set by router before insertion)
     */
    protected routeState: object = {};

    /**
     * Whether the template has been rendered
     */
    private _templateRendered: boolean = false;

    constructor() {
        super();
    }

    /**
     * Native Web Component lifecycle - called when element is added to DOM.
     * Renders the template and calls onInit.
     */
    connectedCallback() {
        this.renderTemplate();
        this.onInit(this.urlPatternResult, this.routeState);
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

/**
 * Main Native.js application class
 */
export class NativeJs {
    host: HTMLElement;
    registry: NativeJsComponentRegistry;
    router: NativeRouter;

    constructor(host: HTMLElement, router: NativeRouter, registry: NativeJsComponentRegistry) {
        this.host = host;
        this.registry = registry;
        this.router = router;
    }

    /**
     * Start the framework
     */
    public run() {
        this.router.start();
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
export function createNativeJs<T extends NativeJsComponent>(
    host: HTMLElement, 
    routes: NativeRouteListInput<T>
) {
    const registry = createNativeJsComponentRegistry();
    const nativeRoutes = getNativeRoutesFromInput(registry, routes);
    const router = createRouter(registry, nativeRoutes, host);
    return new NativeJs(host, router, registry);
}

// Legacy exports for backwards compatibility
export { NativeJsComponent as NativeJsElement };
