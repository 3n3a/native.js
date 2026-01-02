import type { NativeJsState } from "./state";

/**
 * HTTP methods supported for data operations
 */
export type NativeJsHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Credentials mode for requests
 */
export type NativeJsCredentials = 'omit' | 'same-origin' | 'include';

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
    /** Credentials mode (default: 'same-origin') */
    credentials?: NativeJsCredentials;
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
    /** Credentials mode (default: 'same-origin') */
    credentials?: NativeJsCredentials;
}

/**
 * Options for delete operations
 */
export interface NativeJsDeleteOptions {
    /** HTTP headers */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Credentials mode (default: 'same-origin') */
    credentials?: NativeJsCredentials;
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
    private defaultCredentials: NativeJsCredentials;

    constructor(options?: {
        state?: NativeJsState;
        baseUrl?: string;
        headers?: Record<string, string>;
        credentials?: NativeJsCredentials;
    }) {
        this.state = options?.state || null;
        this.baseUrl = options?.baseUrl || '';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...options?.headers
        };
        this.defaultCredentials = options?.credentials || 'same-origin';
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
     * Parse response data and error message
     */
    private async parseResponse<T>(response: Response): Promise<{ data: T | null; error: string | null }> {
        const contentType = response.headers.get('content-type');
        
        if (!contentType?.includes('application/json')) {
            return {
                data: null,
                error: response.ok ? null : `HTTP ${response.status}`
            };
        }

        try {
            const json = await response.json();
            
            if (response.ok) {
                return { data: json as T, error: null };
            }
            
            // Try to extract error message from response
            const errorMessage = json.error || json.message || `HTTP ${response.status}`;
            return { data: json as T, error: errorMessage };
        } catch {
            return {
                data: null,
                error: response.ok ? null : `HTTP ${response.status}`
            };
        }
    }

    /**
     * Fetch data from a URL (GET request)
     * If stateKey is provided and state is available, result is stored in state
     */
    async fetch<T = unknown>(
        url: string, 
        options?: NativeJsFetchOptions
    ): Promise<NativeJsDataResponse<T>> {
        const fullUrl = this.buildUrl(url);
        const headers = { ...this.defaultHeaders, ...options?.headers };
        const credentials = options?.credentials || this.defaultCredentials;

        try {
            const response = await this.fetchWithTimeout(
                fullUrl,
                { method: 'GET', headers, credentials },
                options?.timeout
            );

            const { data, error } = await this.parseResponse<T>(response);

            // Store in state if stateKey provided and state available
            if (options?.stateKey && this.state && response.ok) {
                this.state.set(options.stateKey, data);
            }

            return {
                ok: response.ok,
                status: response.status,
                data: response.ok ? data : null,
                error
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
     * Submit data to a URL (POST/PUT/PATCH)
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
        const credentials = options?.credentials || this.defaultCredentials;

        try {
            const response = await this.fetchWithTimeout(
                fullUrl,
                {
                    method,
                    headers,
                    credentials,
                    body: JSON.stringify(data)
                },
                options?.timeout
            );

            const { data: responseData, error } = await this.parseResponse<TResponse>(response);

            return {
                ok: response.ok,
                status: response.status,
                data: response.ok ? responseData : null,
                error
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
     * Delete a resource (DELETE request without body)
     */
    async delete<TResponse = unknown>(
        url: string,
        options?: NativeJsDeleteOptions
    ): Promise<NativeJsDataResponse<TResponse>> {
        const fullUrl = this.buildUrl(url);
        const headers = { ...this.defaultHeaders, ...options?.headers };
        const credentials = options?.credentials || this.defaultCredentials;

        try {
            const response = await this.fetchWithTimeout(
                fullUrl,
                { method: 'DELETE', headers, credentials },
                options?.timeout
            );

            const { data, error } = await this.parseResponse<TResponse>(response);

            return {
                ok: response.ok,
                status: response.status,
                data: response.ok ? data : null,
                error
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
     * Shorthand for POST request
     */
    async post<TResponse = unknown, TData = unknown>(
        url: string,
        data: TData,
        options?: Omit<NativeJsSubmitOptions, 'method'>
    ): Promise<NativeJsDataResponse<TResponse>> {
        return this.submit<TResponse, TData>(url, data, { ...options, method: 'POST' });
    }

    /**
     * Shorthand for PUT request
     */
    async put<TResponse = unknown, TData = unknown>(
        url: string,
        data: TData,
        options?: Omit<NativeJsSubmitOptions, 'method'>
    ): Promise<NativeJsDataResponse<TResponse>> {
        return this.submit<TResponse, TData>(url, data, { ...options, method: 'PUT' });
    }

    /**
     * Shorthand for PATCH request
     */
    async patch<TResponse = unknown, TData = unknown>(
        url: string,
        data: TData,
        options?: Omit<NativeJsSubmitOptions, 'method'>
    ): Promise<NativeJsDataResponse<TResponse>> {
        return this.submit<TResponse, TData>(url, data, { ...options, method: 'PATCH' });
    }
}

/**
 * Create a data service instance
 */
export function createNativeJsDataService(options?: {
    state?: NativeJsState;
    baseUrl?: string;
    headers?: Record<string, string>;
    credentials?: NativeJsCredentials;
}): NativeJsDataService {
    return new NativeJsDataService(options);
}
