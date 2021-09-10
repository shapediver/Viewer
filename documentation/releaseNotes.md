# Release Notes
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