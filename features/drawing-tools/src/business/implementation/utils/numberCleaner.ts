
export const numberCleaner = (value: number): number => {
    const roundedThreshold = 100;
    return Math.round(value * roundedThreshold) / roundedThreshold;
};