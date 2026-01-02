import type { NativeJsState } from "./state";

/**
 * HTTP methods supported for data operations
 */
export type NativeJsHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Options for fetch operations
 */
export interface NativeJsFetchOptions {
    /** State key to store the result under (if state is provided) */
    stateKey?: string;
    /** HTTP headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
}

/**
 * Options for submit operations
 */
export interface NativeJsSubmitOptions {
    /** HTTP method (default: POST) */
    method?: NativeJsHttpMethod;
    /** HTTP headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
}

/**
 * Response wrapper for data operations
 */
export interface NativeJsDataResponse<T> {
    ok: boolean;
    status: number;
    data: T | null;
    error: string | null;
}

/**
 * Service for fetching and submitting data
 * Can be used standalone or with component state integration
 */
export class NativeJsDataService {
    private state: NativeJsState | null;
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor(options?: {
        state?: NativeJsState;
        baseUrl?: string;
        headers?: Record<string, string>;
    }) {
        this.state = options?.state || null;
        this.baseUrl = options?.baseUrl || '';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...options?.headers
        };
    }

    /**
     * Set the state instance for auto-storing fetch results
     */
    setState(state: NativeJsState): void {
        this.state = state;
    }

    /**
     * Build full URL from path
     */
    private buildUrl(path: string): string {
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return this.baseUrl + path;
    }

    /**
     * Create fetch with timeout
     */
    private async fetchWithTimeout(
        url: string, 
        options: RequestInit, 
        timeout?: number
    ): Promise<Response> {
        if (!timeout) {
            return fetch(url, options);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Fetch data from a URL
     * If stateKey is provided and state is available, result is stored in state
     */
    async fetch<T = unknown>(
        url: string, 
        options?: NativeJsFetchOptions
    ): Promise<NativeJsDataResponse<T>> {
        const fullUrl = this.buildUrl(url);
        const headers = { ...this.defaultHeaders, ...options?.headers };

        try {
            const response = await this.fetchWithTimeout(
                fullUrl,
                { method: 'GET', headers },
                options?.timeout
            );

            const data = await response.json() as T;

            // Store in state if stateKey provided and state available
            if (options?.stateKey && this.state) {
                this.state.set(options.stateKey, data);
            }

            return {
                ok: response.ok,
                status: response.status,
                data: response.ok ? data : null,
                error: response.ok ? null : `HTTP ${response.status}`
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ok: false,
                status: 0,
                data: null,
                error: errorMessage
            };
        }
    }

    /**
     * Submit data to a URL
     * Result is returned but NOT stored in state
     */
    async submit<TResponse = unknown, TData = unknown>(
        url: string,
        data: TData,
        options?: NativeJsSubmitOptions
    ): Promise<NativeJsDataResponse<TResponse>> {
        const fullUrl = this.buildUrl(url);
        const method = options?.method || 'POST';
        const headers = { ...this.defaultHeaders, ...options?.headers };

        try {
            const response = await this.fetchWithTimeout(
                fullUrl,
                {
                    method,
                    headers,
                    body: JSON.stringify(data)
                },
                options?.timeout
            );

            let responseData: TResponse | null = null;
            const contentType = response.headers.get('content-type');
            
            if (contentType?.includes('application/json')) {
                responseData = await response.json() as TResponse;
            }

            return {
                ok: response.ok,
                status: response.status,
                data: response.ok ? responseData : null,
                error: response.ok ? null : `HTTP ${response.status}`
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                ok: false,
                status: 0,
                data: null,
                error: errorMessage
            };
        }
    }
}

/**
 * Create a data service instance
 */
export function createNativeJsDataService(options?: {
    state?: NativeJsState;
    baseUrl?: string;
    headers?: Record<string, string>;
}): NativeJsDataService {
    return new NativeJsDataService(options);
}

