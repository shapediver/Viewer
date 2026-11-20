# Texture downloads

`HttpClient.loadTexture` calls the session's `downloadTexture` callback. That callback uses `UtilsApi.downloadImage`.

- ShapeDiver texture assets (`/session/{id}/texture/…`, `/cdn-asset-textures/…`, and `viewer|textures|downloads.shapediver.com`) are fetched from their URL. Backend texture URLs still need the session authorization header, so they must stay on `downloadImage`.
- Every other texture URL is proxied through `GET /api/v2/session/{sessionId}/image` so the viewer can read hosts that do not send CORS headers.
- `directTextureDownload` on `createSession` (also settable on the session) fetches those other URLs with `fetch` and skips the image proxy. The texture host must allow cross-origin reads. ShapeDiver texture URLs stay on `downloadImage`.
- Direct-download failures throw SDK `ResponseError` or `RequestError` and go through `UtilsManager.handleError`.
- A failed `downloadTexture` still falls back to `fetch` inside `HttpClient`. That fallback stays in the client for every session.
- For non-ShapeDiver URLs, a proxy `SdTextureUrlError` is not reported as a session error (no SESSION_ERROR event, no error log), because `HttpClient` falls back to `fetch`. If the fallback fails too, the error names the URL and both reasons.
- Image parameter uploads (`UtilsManager.processImageInput`) are not texture loads and keep using `downloadImage`.
