import { createRouter } from "./router";
import { renderTemplate, renderFragment } from "./render";
import { createNativeJs, NativeJsComponent, NativeJsComponentRegistry, createNativeJsComponentRegistry } from "./n";

// Main exports
export { 
    createRouter, 
    renderTemplate, 
    renderFragment,
    createNativeJs, 
    NativeJsComponent,
    NativeJsComponentRegistry,
    createNativeJsComponentRegistry
};

// Legacy alias for backwards compatibility
export { NativeJsComponent as NativeJsElement };
