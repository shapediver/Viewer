## Session Settings
### commitParameters: boolean;
> (Platform specific) Option to enable commit-mode for parameters.
> This setting is used purely for UI purposes, it does not have any influence on the session itself.
### commitSettings: boolean;
> (Platform specific) Option to enable commit-mode for settings.
> This setting is used purely for UI purposes, it does not have any influence on the session itself.
### automaticSceneUpdate: boolean;
> Option to automatically update the session's scene tree node whenever a customization finishes. (default: true)
> 
> In case this is set to false, the session's scene tree {@link node} will not be automatically replaced by the node returned from {@link customize}. This can be used to plug the result of {@link customize} into other parts of the scene tree.
### customizeOnParameterChange: boolean;
> Option to trigger a call to {@link customize} whenever a parameter value is changed.
> 
> Use this with care as this might max out the rate limit for your model on the Geometry Backend.

### excludeViewports: string[];
> The ids of the viewports in which the session's scene tree {@link node} should not be shown.

### jwtToken: string | undefined;
> The JWT used for authorizing API calls to the Geometry Backend.

### refreshJwtToken
> Optional callback which can be specified for refreshing the JWT. 
> This will be called by the session once the JWT expires. 
> The callback is required to provide a fresh JWT.