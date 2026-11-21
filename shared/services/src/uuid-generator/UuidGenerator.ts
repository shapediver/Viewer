import {
	parse as parseUUID,
	stringify as stringifyUUID,
	v4,
	validate as validateUUID,
} from "uuid";

/** Ids per refill of the random pool. */
const POOL_IDS = 256;
const HEX: string[] = [];
for (let i = 0; i < 256; i++) HEX.push((i + 0x100).toString(16).slice(1));

export class UuidGenerator {
	// #region Properties (1)

	private static _instance: UuidGenerator;
	private _pool: Uint8Array<ArrayBuffer> | undefined;
	private _poolOffset = 0;

	// #endregion Properties (1)

	// #region Public Static Accessors (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Accessors (1)

	// #region Public Methods (4)

	/**
	 * Creates a new uuid v4. The random bytes come from a pool that is
	 * refilled with one `crypto.getRandomValues` call per 256 ids, because one
	 * native call per id is a large part of the load time of a big scene.
	 */
	public create(): string {
		const random = globalThis.crypto?.getRandomValues;
		if (typeof random !== "function") return v4();
		if (!this._pool || this._poolOffset + 16 > this._pool.length) {
			this._pool = this._pool ?? new Uint8Array(POOL_IDS * 16);
			globalThis.crypto.getRandomValues(this._pool);
			this._poolOffset = 0;
		}
		const b = this._pool;
		const o = this._poolOffset;
		this._poolOffset += 16;
		// version 4 and variant 10xx
		const b6 = (b[o + 6] & 0x0f) | 0x40;
		const b8 = (b[o + 8] & 0x3f) | 0x80;
		return (
			HEX[b[o]] +
			HEX[b[o + 1]] +
			HEX[b[o + 2]] +
			HEX[b[o + 3]] +
			"-" +
			HEX[b[o + 4]] +
			HEX[b[o + 5]] +
			"-" +
			HEX[b6] +
			HEX[b[o + 7]] +
			"-" +
			HEX[b8] +
			HEX[b[o + 9]] +
			"-" +
			HEX[b[o + 10]] +
			HEX[b[o + 11]] +
			HEX[b[o + 12]] +
			HEX[b[o + 13]] +
			HEX[b[o + 14]] +
			HEX[b[o + 15]]
		);
	}

	/**
	 * Parse the uuid to array of bytes
	 *
	 * @param uuid the uuid to convert
	 * @returns ArrayLike collection of 16 values
	 */
	public parse(uuid: string): Uint8Array {
		return parseUUID(uuid);
	}

	/**
	 * Stringify an array of bytes to an uuid
	 *
	 * @param uuid the array of bytes
	 * @returns the converted uuid
	 */
	public stringify(uuid: Uint8Array): string {
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
