# Release Notes

## Version 1.4.1 - `E.T.`
- bugfix: always display viewer versions
- bugfix: AO makes grid re-appear
- bugfix: environment change, scene update
- bugfix: clear color, gamma correction
- bugfix: sentry error catching
- custom visibility for objects (SS-2513)
- zoomTo with paths (SS-2951)
- refactored node path naming
- implemented animations (SS-2508)

## Version 1.4.0 - `Eternal Sunshine of the Spotless Mind`
- attribute visualization feature (SS-2519)
- separation of StandardViewer and AttributeViewer

## Version 1.3.1 - `Die Hard`
- patching of tooltip SS-3438

## Version 1.3.0 - `Dirty Dancing`
- bugfix: setting to depth to true, for firefox
- bugfix: transparency, implementation of manual renderOrder (SS-2360)
- bugfix: environment map started with upper case (SS-3501)
- bugfix: wrong content-type for file upload (SS-3504)
- bugfix: storing of output if version stays the same (SS-1423)
- improved anti-aliasing on lines (SS-805)
- adjusted light bias (SS-938)
- implemented ambient occlusion intensity setting (SS-564)
- adapted logic for BB computation for gltfV1 (SS-3451)
- logic for automatic node assignment and parameter update (SS-931)
- evaluation of texture unit count (SS-1127)

## Version 1.2.4 - `City Of God`
- bugfix: rendering on resizing
- bugfix: storing of new session properties on new backend

## Version 1.2.3 - `Con Air`
- bugfix: camera assignment 

## Version 1.2.2 - `Casino`
- implemented and exported all interfaces for the api
- AR api completion (SS-3461, SS-3462)

## Version 1.2.1 - `Cabaret`
deployment error, superseded by 1.2.2

## Version 1.2.0 - `Casablanca`
- adding and removing of lights was moved from `Viewer` to `LightScene`
- setter and getters reconstruction compared to update/read-only approach
- merged creation and initialization of `Session` and `Viewer`

## Version 1.1.1 - `Back To The Future 2`
- method to add settings, or sections of the settings (SS-3460)

## Version 1.1.0 - `Back To The Future`
- bugfix: zoomTo (SS-3450)
- implementation of settings 3.0
- parameter history feature (SS-2506)
- sentry logging refinements
- glTFv1 transformations (SS-2734)
- math geometry implementations (SS-2960)
- improved performance of BB computation (SS-3177)
- API adaptions, camera options now optional
- simplified camera API
- simplified light API
- capturing of three.js errors (SS-285)
- added new tests
- added color conversion functionality to color parameters (SS-2885)
- adapted API doc (SS-2861)

## Version 1.0.5 - `Austin Powers: International Man of Mystery`
- bugfix: GLTFConverter, added mimeType
- bugfix: endless loop when session was closed
- added AR implementation via API
- adapted glTF loading
- added new tests
- glTF loading and versioning is now combined

## Version 1.0.4 - `Annie Hall`
deployment error, superseded by 1.0.5

## Version 1.0.3 - `Apocalypse Now`
- bugfix: default camera position
- bugfix: anchors were not removed on scene update
- AR api implementation
- changed default logging level
- changed examples

## Version 1.0.2 - `American Beauty`
- bugfix: hidden parameters

## Version 1.0.1 - `Amelie`
- bugfix: preset material transparency
- bugfix: multiple sessions at once

## Version 1.0.0 - `Ace Ventura: Pet Detective`
- updated browserstack tests
- implemented new sd-dtos

## Before Version 1.0.0 -> private development