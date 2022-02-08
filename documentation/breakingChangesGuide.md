# Breaking Changes Guide

## Version 1.11.10 -> 1.11.11
- `updateOutputContent` function signature, `session.updateOutputs()` now included, can be disabled via flag

## Version 1.11.1 -> 1.11.2
- renamed `ENVIRONMENTMAP` to `ENVIRONMENT_MAP`
- renamed `ENVIRONMENTMAP_CUBE` to `ENVIRONMENT_MAP_CUBE`

## Version 1.7.1 -> 1.8.0
- the CDN naming was changed from lowercase `sdv` to uppercase `SDV`
- the viewer types were restructured, there is no `IStandardViewer` or `IAttributeViewer` anymore, both are the same `IViewer` where the type can be set later on