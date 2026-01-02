import { NativeURLChangeEvent } from "./event";
import type { NativeRoute, NativeRouteList } from "./interfaces";
import type { NativeJsComponentRegistry } from "./n";

export function createRouter(registry: NativeJsComponentRegistry, routes: NativeRouteList, host?: HTMLElement) {
    return new NativeRouter(registry, routes, host);
}

export class NativeRouter {
    private registry: NativeJsComponentRegistry;
    private patternToRoute: Map<URLPattern, NativeRoute>;
    private host: HTMLElement;

    constructor(registry: NativeJsComponentRegistry, routes: NativeRouteList, host?: HTMLElement) {
        this.registry = registry;
        this.patternToRoute = new Map();
        this.host = host || document.body;
        this.compileRoutes(routes);
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
            const pattern = new URLPattern({ pathname: route.pathname });
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
            const component = this.registry.getComponent(currentRoute.componentName);
            component.render(urlPatternResult, currentState, this.host);
        } else {
            throw new Error('Failed to find matching route');
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

    private navigateToURL(url: string) {
        const state = {};
        window.history.pushState(state, '', url);
        this.signalURLChange(state);
    }

    private signalURLChange(state: object) {
        const urlChangeEvent = new NativeURLChangeEvent(state);
        window.dispatchEvent(urlChangeEvent);
    }
}
