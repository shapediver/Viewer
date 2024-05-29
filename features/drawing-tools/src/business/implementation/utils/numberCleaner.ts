
export const numberCleaner = (value: number): number => {
    const roundedThreshold = 100;
    const rounded = Math.round(value * roundedThreshold) / roundedThreshold;

    // if the rounded number is within (1 / roundedThreshold) of the next integer, round to that integer
    if (rounded % 1 < 1 / roundedThreshold) {
        return Math.round(rounded);
    }

    return rounded;
};