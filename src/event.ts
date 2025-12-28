export class NativeURLChangeEvent extends Event {
    #state: object;
    constructor(state: object) {
        super("n-url-change");
        this.#state = state;
    }

    get state() {
        return this.#state;
    }
}
