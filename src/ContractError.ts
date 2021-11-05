export class ContractError extends Error {
    constructor(msg: string) {
        super(`ContractError: ${msg}`);
        // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, ContractError.prototype);
    }
}
