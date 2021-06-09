import { toMatchImageSnapshot } from 'jest-image-snapshot';

import { jest } from "@jest/globals";
jest.setTimeout(3000000); // 3000 seconds
expect.extend({ toMatchImageSnapshot });

export const screenshotCompare = async (image: any, name: string) => {
    expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: name,
        failureThreshold: 0.1,
        failureThresholdType: 'percent'
    });
}