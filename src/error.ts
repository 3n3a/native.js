export class NativeJsComponentAlreadyExistsError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'NativeJsComponentAlreadyExistsError';
    }
}

export class NativeJsComponentNotExistsError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'NativeJsComponentNotExistsError';
    }
}

// Legacy aliases for backwards compatibility
export { NativeJsComponentAlreadyExistsError as NativeJsElementAlreadyExistsError };
export { NativeJsComponentNotExistsError as NativeJsElementNotExistsError };
