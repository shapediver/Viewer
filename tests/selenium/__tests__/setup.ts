import { toMatchImageSnapshot } from 'jest-image-snapshot';

import { jest } from "@jest/globals";
jest.setTimeout(30000); // 30 seconds
expect.extend({ toMatchImageSnapshot });

export const screenshotCompare = async (image: any, name: string) => {
    expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: name,
        failureThreshold: 0.01,
        failureThresholdType: 'percent'
    });
}