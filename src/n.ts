import { NativeJsElementAlreadyExistsError, NativeJsElementNotExistsError } from "./error";
import type { NativeJsElementOptions, NativeRoute, NativeRouteInput, NativeRouteList, NativeRouteListInput } from "./interfaces";
import { renderFragment } from "./render";
import { createRouter, type NativeRouter } from "./router";

export class NativeJsElement {

    name: string;
    templateId: string;
    host: HTMLElement;
    htmlElInstance?: HTMLElement;

    constructor(options: NativeJsElementOptions) {
        this.name = options.name;
        this.templateId = options.templateId;
        this.host = options.host;

        if (options.htmlElement) {
            this.htmlElInstance = options.htmlElement;
        }
    }

    private createHighestRankingNativeJsElement(name: string): HTMLElement {
        const generalEl = document.createElement('div');
        generalEl.setAttribute('n-element', name);
        return generalEl;
    }

    public render(urlPatternResult: URLPatternResult, state: object) {
        if (!this.htmlElInstance) {
            this.htmlElInstance = this.createHighestRankingNativeJsElement(this.name);
        }
        const templateEl: HTMLTemplateElement | null = document.querySelector('#' + this.templateId);
        if (!templateEl) {
            throw new Error('template not found')
        }

        const clonedVersion = document.importNode(templateEl.content, true);
        renderFragment([clonedVersion], this.htmlElInstance, false);
        renderFragment([this.htmlElInstance], this.host, true);

        this.onInit(urlPatternResult, state);
    }

    public getChild(selector: string): HTMLElement | null {
        let foundElement = null;
        if (this.htmlElInstance) {
            foundElement = this.htmlElInstance.querySelector<HTMLElement>(selector);
        }
        return foundElement;
    }

    public getChildren(selector: string): HTMLElement[] | null {
        let foundElements: HTMLElement[] = [];
        if (this.htmlElInstance) {
            const result = this.htmlElInstance.querySelectorAll<HTMLElement>(selector);
            if (result.length > 0) {
                foundElements = Array.from(result);
            }
        }
        return foundElements;
    }

    public onInit(urlPatternResult: URLPatternResult, state: object) {

    }
}

export class NativeJsElementRegistry {
    private elementInstances: Map<string, NativeJsElement>;

    constructor() {
        this.elementInstances = new Map();
    }

    public registerElement(name: string, element: NativeJsElement) {
        if (!name || !element) {
            throw new Error('cannot add element to registry since either name or element is empty')
        }
        if (this.elementInstances.has(name)) {
            throw new NativeJsElementAlreadyExistsError(`cannot add element with name "${name}" to registry since it already exists`);
        }
        this.elementInstances.set(name, element);
        // TODO: remove
        console.log(this.elementInstances);

    }

    public getElement(name: string): NativeJsElement {
        if (!this.elementInstances.has(name)) {
            throw new NativeJsElementNotExistsError(`cannot get element with name "${name}" from registry since it does not exist`);
        }
        const nativeJsElement = this.elementInstances.get(name);
        if (!nativeJsElement) {
            throw new Error('element stored in registry is empty');
        }
        return nativeJsElement;
    }

    public disposeElement(name: string) {
        if (!this.elementInstances.has(name)) {
            throw new NativeJsElementNotExistsError(`cannot dispose element with name "${name}" from registry since it does not exist`);
        }
    }
}

export function createNativeJsElementRegistry() {
    return new NativeJsElementRegistry();
}

// when created will also be registered
export function createNativeJsElement(registry: NativeJsElementRegistry, elementOptions: NativeJsElementOptions) {
    const element = new NativeJsElement(elementOptions);
    registry.registerElement(elementOptions.name, element)
    return element;
}

export class NativeJs {

    host: HTMLElement;
    registry: NativeJsElementRegistry;
    router: NativeRouter;

    constructor(host: HTMLElement, router: NativeRouter, registry: NativeJsElementRegistry) {
        this.host = host;
        this.registry = registry;
        this.router = router;
    }

    /**
     * start framework
     */
    public run() {
        this.router.start();
    }
}

function getNativeRoutesFromInput<T extends NativeJsElement>(registry: NativeJsElementRegistry, routes: NativeRouteListInput<T>): NativeRouteList {
    let nativeRoutes: NativeRouteList = [];

    for (const routeInput of routes) {
        const nativeRoute = createRouteFromInput(registry, routeInput);
        nativeRoutes.push(nativeRoute);
    }

    return nativeRoutes;
}


function createRouteFromInput<T extends NativeJsElement>(registry: NativeJsElementRegistry, routeInput: NativeRouteInput<T>): NativeRoute {
    const elementInstance = instantiate(routeInput.element);
    registry.registerElement(elementInstance.name, elementInstance);

    return {
        pathname: routeInput.pathname,
        elementName: elementInstance.name
    }
}

// Generic factory function with type safety
function instantiate<T>(ClassToInstantiate: new (...args: any[]) => T, ...args: any[]): T {
    return new ClassToInstantiate(...args);
}

export function createNativeJs<T extends NativeJsElement>(host: HTMLElement, routes: NativeRouteListInput<T>) {
    const registry = createNativeJsElementRegistry();
    const nativeRoutes = getNativeRoutesFromInput(registry, routes);
    const router = createRouter(registry, nativeRoutes);
    return new NativeJs(host, router, registry);
}