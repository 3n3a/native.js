import { NativeURLChangeEvent } from "./event";
import type { NativeRoute, NativeRouteList } from "./interfaces";
import type { NativeJsElementRegistry } from "./n";

export function createRouter(registry: NativeJsElementRegistry, routes: NativeRouteList) {
    return new NativeRouter(registry, routes);
}

export class NativeRouter {
    private registry: NativeJsElementRegistry;
    private patternToRoute: Map<URLPattern, NativeRoute>;

    constructor(registry: NativeJsElementRegistry, routes: NativeRouteList) {
        this.registry = registry;
        this.patternToRoute = new Map();
        this.compileRoutes(routes);
    }

    start() {
        const context = this;
        // hanlde initial load
        this.handleRouteChange({});

        // forwarding
        window.addEventListener('popstate', (event) => {
            context.signalURLChange(event.state || {});
        })
        
        window.addEventListener('n-url-change', (event) => {
            const event2 = event as NativeURLChangeEvent;
            const currentState = event2.state || {};
            context.handleRouteChange(currentState);
            context.overrideLinkClicks();
        });

        this.overrideLinkClicks();

    }

    private compileRoutes(routes: NativeRouteList) {
        for (const route of routes) {
            const currentPattern = new URLPattern({ pathname: route.pathname });
            this.patternToRoute.set(currentPattern, route);
        }
    }

    private findMatchingRoute(currentPathName: string): [NativeRoute, URLPatternResult]|null {
        for (const currentPattern of this.patternToRoute.keys()) {
            const result = currentPattern.exec({ pathname: currentPathName});
            if (result) {
                const currentRoute = this.patternToRoute.get(currentPattern);
                if (!currentRoute) {
                    throw new Error('missing NativeRoute for matched path');
                }
                return [currentRoute, result];
            }
        }
        return null;
    }

    private handleRouteChange(currentState: object) {
        const currentURL = document.location;
        const matchingRouteResult = this.findMatchingRoute(currentURL.pathname);
        if (matchingRouteResult) {
            const [currentRoute, urlPatternResult] = matchingRouteResult;
            const element = this.registry.getElement(currentRoute.elementName);
            element.render(urlPatternResult, currentState);
        } else {
            throw new Error('failed to find matching route');
        }
    }

    private overrideLinkClicks() {
        const context = this;
        const links: HTMLAnchorElement[] = Array.from(document.querySelectorAll('a[n-href]'));
        for (const link of links) {
            link.addEventListener('click', (ev: PointerEvent) => {
                ev.preventDefault();
                const target = ev.target as HTMLElement;
                const href = target.getAttribute('n-href');
                console.log('link clicked', href);
                
                if (!href) {
                    throw new Error('no href on "a" element');
                }
                context.navigateToURL(href);
            })
        }
    }

    private navigateToURL(url: string) {
        const state = {};
        window.history.pushState(state, '', url);
        this.signalURLChange(state);
    }

    private signalURLChange(state: object) {
        const urlChangeEv = new NativeURLChangeEvent(state);
        window.dispatchEvent(urlChangeEv);
    }
}
