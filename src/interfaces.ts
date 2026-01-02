import type { NativeJsComponent } from "./n";

// Basic constructor type
export type ClassType = new (...args: any[]) => any;

// Constructor type that returns a specific type
export type Constructor<T> = new (...args: any[]) => T;

// Concrete (non-abstract) component class type
export type NativeJsComponentClass = (new () => NativeJsComponent) & {
    tagName: string;
    templateId: string;
};

// Constructor type for component classes extending NativeJsComponent
export type NativeJsComponentConstructor<T extends NativeJsComponent> = (new () => T) & {
    tagName: string;
    templateId: string;
};

export interface NativeRouteInput<T extends NativeJsComponent> {
    pathname: string;
    element: NativeJsComponentConstructor<T>;
}

export interface NativeRoute {
    pathname: string;
    componentName: string;
}

export type NativeRouteListInput<T extends NativeJsComponent> = NativeRouteInput<T>[];
export type NativeRouteList = NativeRoute[];
