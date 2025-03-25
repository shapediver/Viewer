export const numberCleaner = (
	value: number,
	decimalPlaces: number = 2,
): number => {
	const roundedThreshold = Math.pow(10, decimalPlaces);
	return Math.round(value * roundedThreshold) / roundedThreshold;
};
