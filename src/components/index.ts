/**
 * Native.js Default Components Library
 * 
 * Pre-built, ready-to-use components for common UI patterns.
 */

import { NativeJsComponentRegistry } from "../n";
import { NativeJsFetchForm } from "./fetch-form";
import { NativeJsSubmitForm } from "./submit-form";

// Export individual components
export { NativeJsFetchForm } from "./fetch-form";
export { NativeJsSubmitForm } from "./submit-form";

/**
 * All default components
 */
export const NativeJsDefaultComponents = [
    NativeJsFetchForm,
    NativeJsSubmitForm
];

/**
 * Register all default components with a registry
 */
export function registerDefaultComponents(registry: NativeJsComponentRegistry): void {
    for (const component of NativeJsDefaultComponents) {
        registry.registerComponentClass(component);
    }
}

