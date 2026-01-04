import { createRouter } from "./router";
import { renderTemplate, renderFragment } from "./render";
import { 
    createNativeJs, 
    NativeJsComponent, 
    NativeJsComponentRegistry, 
    createNativeJsComponentRegistry, 
    navigateTo,
    getContainer,
    tryGetContainer,
    inject
} from "./n";
import { NativeJsState } from "./state";
import { NativeJsStorage, createNativeJsStorage } from "./storage";
import { NativeJsDataService, createNativeJsDataService } from "./service";

// Dependency Injection
import { 
    NativeJsDIContainer, 
    createNativeJsDIContainer,
    NativeJsService
} from "./di";

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
    // Dependency Injection
    NativeJsDIContainer,
    createNativeJsDIContainer,
    NativeJsService,
    getContainer,
    tryGetContainer,
    inject,
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
export type {
    NativeJsServiceFactory,
    NativeJsServiceClass,
    NativeJsServiceProvider,
    NativeJsServiceLifecycle,
    NativeJsInjectable
} from "./di";
export type { NativeJsOptions, NativeJsServicesConfig } from "./n";

// Legacy alias for backwards compatibility
export { NativeJsComponent as NativeJsElement };
