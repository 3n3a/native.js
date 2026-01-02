/**
 * Native.js Default Components Library
 * 
 * Pre-built, ready-to-use components for common UI patterns.
 */

import { NativeJsComponentRegistry } from "../n";
import { NativeJsFetchForm } from "./fetch-form";
import { NativeJsSubmitForm } from "./submit-form";
import { NativeJsModal } from "./modal";
import { NativeJsList } from "./list";

// Export individual components
export { NativeJsFetchForm } from "./fetch-form";
export { NativeJsSubmitForm } from "./submit-form";
export { NativeJsModal } from "./modal";
export { NativeJsList } from "./list";

/**
 * All default components
 */
export const NativeJsDefaultComponents = [
    NativeJsFetchForm,
    NativeJsSubmitForm,
    NativeJsModal,
    NativeJsList
];

// Track which default components have been registered
const registeredDefaults = new Set<string>();

/**
 * Register all default components.
 * Can optionally pass a registry, or components will be registered directly.
 */
export function registerDefaultComponents(registry?: NativeJsComponentRegistry): void {
    for (const component of NativeJsDefaultComponents) {
        const tagName = component.tagName;
        
        if (registry) {
            registry.registerComponentClass(component);
        } else {
            // Register directly with customElements if not already registered
            if (!registeredDefaults.has(tagName) && !customElements.get(tagName)) {
                customElements.define(tagName, component);
                registeredDefaults.add(tagName);
            }
        }
    }
}
