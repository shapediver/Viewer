import { toMatchImageSnapshot } from 'jest-image-snapshot';

import { jest } from "@jest/globals";
jest.setTimeout(10000); // 10 seconds
expect.extend({ toMatchImageSnapshot });


export const screenshotCompare = async (image: any, name: string) => {
    expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: name,
        failureThreshold: 0.01,
        failureThresholdType: 'percent'
    });
}