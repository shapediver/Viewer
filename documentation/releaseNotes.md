# Release Notes

<!--- VERSION_START -->
## Version
* __Version:__ 1.6.6
* __Build date:__ 2021-11-08T16:36:46.025Z
* __Branch:__ development
* __Commit:__ a39ef39e4f9b25da5d3a9793687c0c3013f8aee0
<!--- VERSION_END -->

## Version 1.6.4 - `Fight Club`
- separation between session init and output loading

## Version 1.6.3 - `The Fifth Element`
- bugfix: closing sessions/viewers before they are open

## Version 1.6.2 - `Fargo`
- bugfix: v3 settings conversion

## Version 1.6.1 - `Fahrenheit 9/11`
- doc improvements

## Version 1.6.0 - `The Fellowship of the Ring`
- doc improvements
- deployment scripts

## Version 1.5.* was used for internal deployment changes

## Version 1.4.10 - `El Dorado`
- bugfix: AR on iPad > 13.0
- deployment process

## Version 1.4.9 - `Eagle Eye`
- bugfix: gltf conversion for AR
- api doc

## Version 1.4.8 - `Eat Pray Love`
- Sentry improvements

## Version 1.4.7 - `Easy A`
- Sentry improvements

## Version 1.4.6 - `Elephant`
- AR improvements
- Sentry improvements

## Version 1.4.5 - `8 Mile`
- bugfix: gltf conversion
- CDN adaptions

## Version 1.4.4 - `Edward Scissorhands`
- bugfix: applySettings

## Version 1.4.3 - `Elf`
- bugfix: AR on some iOS devices
- bugfix: applySettings
- bugfix: stopped event propagation
- attribute visualization in AR
- AR animations
- recreated 'none' environment (SS-3563)

## Version 1.4.2 - `Edge of Tomorrow`
- bugfix: doc

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