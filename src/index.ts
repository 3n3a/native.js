import { createRouter } from "./router";
import { renderTemplate, renderFragment } from "./render";
import { createNativeJs, NativeJsComponent, NativeJsComponentRegistry, createNativeJsComponentRegistry } from "./n";
import { NativeJsState } from "./state";
import { NativeJsStorage, createNativeJsStorage } from "./storage";

// Main exports
export { 
    createRouter, 
    renderTemplate, 
    renderFragment,
    createNativeJs, 
    NativeJsComponent,
    NativeJsComponentRegistry,
    createNativeJsComponentRegistry,
    NativeJsState,
    NativeJsStorage,
    createNativeJsStorage
};

// Type exports
export type { NativeJsStorageType, NativeJsStorageBackend } from "./storage";
export type { NativeJsStateData, NativeJsStateMode, NativeJsStateConfig } from "./state";

// Legacy alias for backwards compatibility
export { NativeJsComponent as NativeJsElement };
