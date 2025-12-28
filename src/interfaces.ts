export interface NativeRoute {
    pathname: string,
    callbackFn(urlPatternResult: URLPatternResult, state: object): never,
}
