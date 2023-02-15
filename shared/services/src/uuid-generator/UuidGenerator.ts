import { parse as parseUUID, stringify as stringifyUUID, v4, validate as validateUUID } from 'uuid'

export class UuidGenerator {
    // #region Properties (1)

    private static _instance: UuidGenerator;

    // #endregion Properties (1)

    // #region Public Static Accessors (1)

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // #endregion Public Static Accessors (1)

    // #region Public Methods (4)

    /**
     * Creates a new uuid v4.
     */
    public create(): string {
        return v4();
    }

    /**
     * Parse the uuid to array of bytes
     * 
     * @param uuid the uuid to convert
     * @returns ArrayLike collection of 16 values
     */
    public parse(uuid: string): ArrayLike<number> {
        return parseUUID(uuid);
    }

    /**
     * Stringify an array of bytes to an uuid
     * 
     * @param uuid the array of bytes
     * @returns the converted uuid
     */
    public stringify(uuid: ArrayLike<number>): string {
        return stringifyUUID(uuid);
    }

    /**
     * Checks if the provided string is a valid uuid.
     * 
     * @param uuid the uuid to check
     */
    public validate(uuid: string): boolean {
        return validateUUID(uuid);
    }

    // #endregion Public Methods (4)
}