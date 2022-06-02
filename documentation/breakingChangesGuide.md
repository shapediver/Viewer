# Breaking Changes Guide

## Version 1.14.16 -> 1.15.0
- removed `busy` and `blurSceneWhenBusy`, you can now use the branding options when creating a viewer

## Version 1.12.5 -> 1.13.0
- `viewableInAR` only returns a boolean now, no more errors

## Version 1.12.1 -> 1.12.2
- import of `reflect-metadata` not necessary any more
- branding options changed, `logo` was moved into object
- the `HTMLElementAnchorData` was reworked, there are now `HTMLElementAnchorTextData`, `HTMLElementAnchorImageData` and `HTMLElementAnchorCustomData` to better fit your needs

## Version 1.11.10 -> 1.11.11
- `updateOutputContent` function signature, `session.updateOutputs()` now included, can be disabled via flag

## Version 1.11.1 -> 1.11.2
- renamed `ENVIRONMENTMAP` to `ENVIRONMENT_MAP`
- renamed `ENVIRONMENTMAP_CUBE` to `ENVIRONMENT_MAP_CUBE`

## Version 1.7.1 -> 1.8.0
- the CDN naming was changed from lowercase `sdv` to uppercase `SDV`
- the viewer types were restructured, there is no `IStandardViewer` or `IAttributeViewer` anymore, both are the same `IViewer` where the type can be set later on