import { NativeJsComponentAlreadyExistsError, NativeJsComponentNotExistsError } from "./error";
import type { NativeRoute, NativeRouteInput, NativeRouteList, NativeRouteListInput } from "./interfaces";
import { renderFragment } from "./render";
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
     * Reference to the host element where this component is mounted
     */
    protected host: HTMLElement | null = null;

    constructor() {
        super();
    }

    /**
     * Native Web Component lifecycle - called when element is added to DOM
     */
    connectedCallback() {
        // Can be overridden by subclasses
    }

    /**
     * Native Web Component lifecycle - called when element is removed from DOM
     */
    disconnectedCallback() {
        // Can be overridden by subclasses
    }

    /**
     * Renders the component using its template
     */
    public render(urlPatternResult: URLPatternResult, state: object, host: HTMLElement) {
        this.host = host;

        const constructor = this.constructor as typeof NativeJsComponent;
        const templateEl: HTMLTemplateElement | null = document.querySelector('#' + constructor.templateId);
        
        if (!templateEl) {
            throw new Error(`Template with id "${constructor.templateId}" not found`);
        }

        // Clear previous content
        this.innerHTML = '';

        const clonedContent = document.importNode(templateEl.content, true);
        
        // Append cloned content to this component (light DOM)
        this.appendChild(clonedContent);
        
        // Mount this component to the host
        renderFragment([this], host, true);

        this.onInit(urlPatternResult, state);
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
        const result = this.querySelectorAll<T>(selector);
        return Array.from(result);
    }

    /**
     * Lifecycle hook called after the component is rendered
     * Override this in subclasses to initialize component logic
     */
    public onInit(urlPatternResult: URLPatternResult, state: object) {
        // Override in subclass
    }
}

/**
 * Registry for managing NativeJsComponent instances
 */
export class NativeJsComponentRegistry {
    private componentInstances: Map<string, NativeJsComponent>;
    private registeredTags: Set<string>;

    constructor() {
        this.componentInstances = new Map();
        this.registeredTags = new Set();
    }

    /**
     * Register a component class as a custom element if not already registered
     */
    public registerComponentClass(componentClass: typeof NativeJsComponent) {
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
     * Register a component instance by name
     */
    public registerComponent(name: string, component: NativeJsComponent) {
        if (!name || !component) {
            throw new Error('Cannot add component to registry: name or component is empty');
        }
        if (this.componentInstances.has(name)) {
            throw new NativeJsComponentAlreadyExistsError(
                `Cannot add component with name "${name}" to registry: it already exists`
            );
        }
        this.componentInstances.set(name, component);
    }

    /**
     * Get a component instance by name
     */
    public getComponent(name: string): NativeJsComponent {
        if (!this.componentInstances.has(name)) {
            throw new NativeJsComponentNotExistsError(
                `Cannot get component with name "${name}" from registry: it does not exist`
            );
        }
        const component = this.componentInstances.get(name);
        if (!component) {
            throw new Error('Component stored in registry is empty');
        }
        return component;
    }

    /**
     * Remove a component instance from the registry
     */
    public disposeComponent(name: string) {
        if (!this.componentInstances.has(name)) {
            throw new NativeJsComponentNotExistsError(
                `Cannot dispose component with name "${name}" from registry: it does not exist`
            );
        }
        this.componentInstances.delete(name);
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
 * Convert route inputs to native routes and register components
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
 * Create a native route from input, registering the component class and instance
 */
function createRouteFromInput<T extends NativeJsComponent>(
    registry: NativeJsComponentRegistry, 
    routeInput: NativeRouteInput<T>
): NativeRoute {
    // Register the component class as a custom element
    registry.registerComponentClass(routeInput.element);
    
    // Create an instance of the component
    const tagName = routeInput.element.tagName;
    const componentInstance = document.createElement(tagName) as T;
    
    // Register the instance
    registry.registerComponent(tagName, componentInstance);

    return {
        pathname: routeInput.pathname,
        componentName: tagName
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
