import { NativeURLChangeEvent } from "./event";
import type { NativeRoute, NativeRouteList } from "./interfaces";
import type { NativeJsComponent, NativeJsComponentRegistry } from "./n";

export interface NativeRouterOptions {
    host?: HTMLElement;
    /** Base path for all routes (auto-detected from current directory if not set) */
    basePath?: string;
}

export function createRouter(
    registry: NativeJsComponentRegistry, 
    routes: NativeRouteList, 
    hostOrOptions?: HTMLElement | NativeRouterOptions
) {
    // Handle legacy signature (host as third param)
    if (hostOrOptions instanceof HTMLElement) {
        return new NativeRouter(registry, routes, { host: hostOrOptions });
    }
    return new NativeRouter(registry, routes, hostOrOptions);
}

export class NativeRouter {
    private registry: NativeJsComponentRegistry;
    private patternToRoute: Map<URLPattern, NativeRoute>;
    private host: HTMLElement;
    private basePath: string;

    constructor(registry: NativeJsComponentRegistry, routes: NativeRouteList, options?: NativeRouterOptions) {
        this.registry = registry;
        this.patternToRoute = new Map();
        this.host = options?.host || document.body;
        this.basePath = options?.basePath ?? this.detectBasePath();
        this.compileRoutes(routes);
    }

    /**
     * Auto-detect base path from the current HTML file location
     * e.g., /general/index.html -> /general
     */
    private detectBasePath(): string {
        const pathname = window.location.pathname;
        
        // If we're at a file like /general/index.html or /general/
        // Extract the directory part
        if (pathname.endsWith('/') || pathname.endsWith('/index.html')) {
            const path = pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
            return path || '';
        }
        
        // For paths like /general/something, get the directory
        const lastSlash = pathname.lastIndexOf('/');
        if (lastSlash > 0) {
            return pathname.substring(0, lastSlash);
        }
        
        return '';
    }

    /**
     * Get the base path
     */
    getBasePath(): string {
        return this.basePath;
    }

    /**
     * Set the host element for rendering components
     */
    setHost(host: HTMLElement) {
        this.host = host;
    }

    start() {
        // Handle initial load
        this.handleRouteChange({});

        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            this.signalURLChange(event.state || {});
        });
        
        // Handle internal navigation
        window.addEventListener('n-url-change', (event) => {
            const urlChangeEvent = event as NativeURLChangeEvent;
            const currentState = urlChangeEvent.state || {};
            this.handleRouteChange(currentState);
            this.overrideLinkClicks();
        });

        this.overrideLinkClicks();
    }

    private compileRoutes(routes: NativeRouteList) {
        for (const route of routes) {
            // Prepend basePath to each route pattern
            const fullPath = this.basePath + route.pathname;
            const pattern = new URLPattern({ pathname: fullPath });
            this.patternToRoute.set(pattern, route);
        }
    }

    private findMatchingRoute(currentPathName: string): [NativeRoute, URLPatternResult] | null {
        for (const pattern of this.patternToRoute.keys()) {
            const result = pattern.exec({ pathname: currentPathName });
            if (result) {
                const route = this.patternToRoute.get(pattern);
                if (!route) {
                    throw new Error('Missing NativeRoute for matched path');
                }
                return [route, result];
            }
        }
        return null;
    }

    private handleRouteChange(currentState: object) {
        const currentURL = document.location;
        const matchingRouteResult = this.findMatchingRoute(currentURL.pathname);
        
        if (matchingRouteResult) {
            const [currentRoute, urlPatternResult] = matchingRouteResult;
            
            // Create a new instance of the component
            const component = document.createElement(currentRoute.componentName) as NativeJsComponent;
            
            // Set route data before insertion (before connectedCallback fires)
            component.setRouteData(urlPatternResult, currentState);
            
            // Insert into host - this triggers connectedCallback which renders template and calls onInit
            this.host.replaceChildren(component);
        } else {
            throw new Error(`Failed to find matching route for: ${currentURL.pathname}`);
        }
    }

    private overrideLinkClicks() {
        const links: HTMLAnchorElement[] = Array.from(document.querySelectorAll('a[n-href]'));
        
        for (const link of links) {
            // Skip if already processed
            if (link.hasAttribute('n-href-processed')) continue;
            link.setAttribute('n-href-processed', 'true');
            
            link.addEventListener('click', (ev: MouseEvent) => {
                ev.preventDefault();
                const target = ev.currentTarget as HTMLAnchorElement;
                const href = target.getAttribute('n-href');
                
                if (!href) {
                    throw new Error('No href on "a" element with n-href attribute');
                }
                this.navigateToURL(href);
            });
        }
    }

    /**
     * Navigate to a URL programmatically
     * @param url - The URL to navigate to (relative paths will have basePath prepended)
     * @param state - Optional state object to pass to the route
     */
    navigateTo(url: string, state: object = {}): void {
        // Prepend basePath if the URL is relative (starts with /)
        const fullUrl = url.startsWith('/') ? this.basePath + url : url;
        window.history.pushState(state, '', fullUrl);
        this.signalURLChange(state);
    }

    private navigateToURL(url: string) {
        this.navigateTo(url);
    }

    private signalURLChange(state: object) {
        const urlChangeEvent = new NativeURLChangeEvent(state);
        window.dispatchEvent(urlChangeEvent);
    }
}
