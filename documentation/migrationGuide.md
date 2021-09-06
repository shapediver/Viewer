# Migration Guide
## Version 1.0.5 -> 1.1.0
- `viewer.getCamera()` was removed, `viewer.camera` is accessible now
- `viewer.getCameras()` was removed, `viewer.cameras` is accessible now
- `viewer.hasCamera()` was removed, check for existence of `viewer.camera` instead
- `viewer.lightScene` was renamed to `viewer.lightSceneId`
- `viewer.getLightScene()` was removed, `viewer.lightScene` is accessible now
- `viewer.getLightScenes()` was removed, `viewer.lightScenes` is accessible now
- `viewer.getLight()` was removed, `viewer.lightScene.lights` is accessible now
- `viewer.getLights()` was removed, `viewer.lightScene.lights` is accessible now
- `api.getViewer()` was removed, `api.viewers` is accessible now
- `api.getSession()` was removed, `api.sessions` is accessible now