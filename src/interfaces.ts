import type { NativeJsElement } from "./n";

// Basic constructor type
export type ClassType = new (...args: any[]) => any;

// Constructor type that returns a specific type
export type Constructor<T> = new (...args: any[]) => T;

// Constructor type for classes extending a base class
export type NativeJsElementConstructor<T extends NativeJsElement> = new (...args: any[]) => T;

export interface NativeRouteInput<T extends NativeJsElement> {
    pathname: string;
    element: NativeJsElementConstructor<T>;
}
export interface NativeRoute {
    pathname: string,
    elementName: string
    //callbackFn(urlPatternResult: URLPatternResult, state: object): void,
}

export type NativeRouteListInput<T extends NativeJsElement> = NativeRouteInput<T>[];
export type NativeRouteList = NativeRoute[];

export interface NativeJsElementOptions {
    name: string;
    templateId: string;
    host: HTMLElement;
    htmlElement?: HTMLElement;
}
