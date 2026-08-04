export class HashCreator {
	// Seed derived from the Golden Ratio
	// commonly used in hash functions to achieve good distribution
	private readonly _seed = 0x9e3779b9;

	// mixing constants from MurmurHash3 (https://en.wikipedia.org/wiki/MurmurHash)
	private readonly _c1 = 0xcc9e2d51;
	private readonly _c2 = 0x1b873593;
	private readonly _c3 = 0xe6546b64;
	private readonly _c4 = 0x85ebca6b;
	private readonly _c5 = 0xc2b2ae35;

	private static _instance: HashCreator;

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	/**
	 * A non-linear bitwise mixer that incorporates a 32-bit value into the rolling hash.
	 * Based on the MurmurHash3 "C1/C2" mixing step.
	 *
	 * This function uses a combination of:
	 * 1. Odd-prime multiplication (c1, c2) to spread bits across the 32-bit range.
	 * 2. Bitwise Rotation (RotL) to ensure that bits shifted off the left side
	 *    influence the lower bits, preventing data loss.
	 * 3. An additive constant (c3) to ensure that sequences of zeros
	 *    or small integers still result in a changing, chaotic state.
	 *
	 * @param hash The current accumulated hash state.
	 * @param value The new data chunk (GetHashCode) to incorporate.
	 * @returns An updated hash state with high avalanche characteristics.
	 */
	private mixIn(hash: number, value: number): number {
		let k1 = value;
		k1 *= this._c1;
		k1 = (k1 << 15) | (k1 >> 17); // RotL 15
		k1 *= this._c2;

		hash ^= k1;
		hash = (hash << 13) | (hash >> 19); // RotL 13
		hash = hash * 5 + this._c3;

		return hash;
	}

	/**
	 * Performs a final bit-smearing (Avalanche) step to ensure uniform distribution.
	 * Based on the MurmurHash3 32-bit finalizer.
	 *
	 * This "smears" the bits via three XOR-shift and multiplication steps:
	 * 1. The XOR-shifts (h >> 16, etc.) force the high-entropy bits to mix with lower bits.
	 * 2. The magic constants (c4, c5) are specific "Mixer Primes"
	 *   chosen for their ability to flip bits with roughly 50% probability.
	 * This prevents collisions in structured data where the final fields (like translation
	 * components) might otherwise have a disproportionate effect on only a few bits.
	 *
	 * @param h The raw accumulated hash after all data blocks have been mixed.
	 * @returns A finalized hash where every input bit has had the opportunity to influence every output bit.
	 */
	private finalize(h: number): number {
		h ^= h >> 16;
		h *= this._c4;
		h ^= h >> 13;
		h *= this._c5;
		h ^= h >> 16;
		return h;
	}

	/**
	 * Creates a 32-bit integer hash using a MurmurHash3-inspired algorithm.
	 * This method is designed to produce a well-distributed hash for arbitrary string content,
	 * making it suitable for use as a key in hash tables or for quick comparisons.
	 *
	 * @param content The input string to hash.
	 * @returns A 32-bit integer hash of the input string.
	 */
	public createMurmurHash(content: string): number {
		let h1 = this._seed;

		for (let i = 0; i < content.length; i++) {
			const charCode = content.charCodeAt(i);
			h1 = this.mixIn(h1, charCode);
		}

		return this.finalize(h1);
	}
}
