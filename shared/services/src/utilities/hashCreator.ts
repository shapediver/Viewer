/**
 * Creates a FNV-1a hash for a sampled Uint8Array.
 *
 * @param array
 * @returns
 */
export const hashForArraySampled = (array: Uint8Array) => {
	// Hash sample of bytes for speed, include length for uniqueness
	let hash = 2166136261;
	const len = array.length;

	// Hash first 2KB
	const sampleSize = Math.min(2048, len);
	for (let i = 0; i < sampleSize; i++) {
		hash ^= array[i];
		hash = Math.imul(hash, 16777619);
	}

	// Hash last 2KB if array is large enough
	if (len > sampleSize) {
		for (let i = len - sampleSize; i < len; i++) {
			hash ^= array[i];
			hash = Math.imul(hash, 16777619);
		}
	}

	return hash.toString(16);
};
