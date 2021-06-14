# Migration Guide
## Version 0.2.58 -> 0.3.0
- Removed optional `returnDTOs` property in `Session`.
- Separate Parameter implementations are merged into `Parameter`, only exception `FileParameter`.
- Getters and Setters in ALL parts of the API are replaced with readonly properties for getters, and update-functions for setters. 
Example: 

    Before: 
    ```
    public get example(): string;
    public set example(value: string);
    ```
    After: 
    ```
    readonly example: string;
    public updateExample(value: string);
    ```
- Removed `getViewers` and `getSessions` from `api`. Accessible via properties `viewers` and `sessions`.
- Removed `getParameters`, `getExports` and `getOutputs` from `Session`. Accessible via properties `parameters`, `exports` and `outputs`.
- Removed `updateParameter` from `Session`. Accessible via `updateValue` on each parameter object.
- Removed `updateParameterDisplayName` from `Session`. Accessible via `updateDisplayName` on each parameter object.
- Removed `updateParameterOrder` from `Session`. Accessible via `updateOrder` on each parameter object.
- Removed `updateParameterHidden` from `Session`. Accessible via `updateHidden` on each parameter object.
- Removed `updateExportDisplayName` from `Session`. Accessible via `updateDisplayName` on each export object.
- Removed `updateExportOrder` from `Session`. Accessible via `updateOrder` on each export object.
- Removed `updateExportHidden` from `Session`. Accessible via `updateHidden` on each export object.