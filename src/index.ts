import { createRouter } from "./router";
import { renderTemplate, renderFragment } from "./render";
import { createNativeJs, NativeJsComponent, NativeJsComponentRegistry, createNativeJsComponentRegistry, navigateTo } from "./n";
import { NativeJsState } from "./state";
import { NativeJsStorage, createNativeJsStorage } from "./storage";
import { NativeJsDataService, createNativeJsDataService } from "./service";

// Components library
import { 
    NativeJsFetchForm, 
    NativeJsSubmitForm,
    NativeJsModal,
    NativeJsList,
    NativeJsDefaultComponents,
    registerDefaultComponents 
} from "./components";

// Utils
import { escapeHtml, unescapeHtml, uniqueId, debounce, throttle } from "./utils";

// Main exports
export { 
    createRouter, 
    renderTemplate, 
    renderFragment,
    createNativeJs,
    navigateTo,
    NativeJsComponent,
    NativeJsComponentRegistry,
    createNativeJsComponentRegistry,
    NativeJsState,
    NativeJsStorage,
    createNativeJsStorage,
    NativeJsDataService,
    createNativeJsDataService,
    // Components
    NativeJsFetchForm,
    NativeJsSubmitForm,
    NativeJsModal,
    NativeJsList,
    NativeJsDefaultComponents,
    registerDefaultComponents,
    // Utils
    escapeHtml,
    unescapeHtml,
    uniqueId,
    debounce,
    throttle
};

// Type exports
export type { NativeJsStorageType, NativeJsStorageBackend } from "./storage";
export type { NativeJsStateData, NativeJsStateMode, NativeJsStateConfig } from "./state";
export type { 
    NativeJsHttpMethod,
    NativeJsCredentials,
    NativeJsFetchOptions, 
    NativeJsSubmitOptions,
    NativeJsDeleteOptions,
    NativeJsDataResponse 
} from "./service";

// Legacy alias for backwards compatibility
export { NativeJsComponent as NativeJsElement };
