export const css = `
.sdv-error-message-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.sdv-error-message {
    font-family: "CircularXXWeb-Book", sans-serif;
    font-size: x-large;
    filter: invert(100);
}

.sdv-anchor-container {
    user-select: none;
    cursor: default;
    pointer-events: none;
    overflow: hidden;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0%;
    top: 0%;
}

.sdv-anchor-inner-container {
    position: absolute;
    white-space: nowrap;
    text-overflow: clip;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.sdv-anchor-text {
    user-select: none;
    cursor: default;
    pointer-events: none;
    display: block;
    text-overflow: clip;
    overflow: hidden;
}

.sdv-anchor-image {
    user-select: none;
    cursor: default;
    pointer-events: none;
}

.sdv-logo-container {
    position: relative;
    height: 100%;
    width: 100%;
}

.sdv-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    max-width: calc(100% - 0.5);
    max-height: calc(100% - 0.5);
    transform: translate(-50%, -50%);
}

.sdv-spinner-container {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    user-select: none;
    cursor: default;
    pointer-events: none;
}

.sdv-spinner {
    position: absolute;
    max-width: calc(100% * 0.15);
    max-height: calc(100% * 0.15);
    mix-blend-mode: difference;
    filter: invert(1) grayscale(100%);
}

.sdv-spinner-top-left {
    left: calc(100% * 0.01);
    top: calc(100% * 0.01);
    float: left;
}

.sdv-spinner-top-right {
    right: calc(100% * 0.01);
    top: calc(100% * 0.01);
    float: right;
}

.sdv-spinner-bottom-left {
    left: calc(100% * 0.01);
    bottom: calc(100% * 0.01);
    float: left;
}

.sdv-spinner-bottom-right {
    right: calc(100% * 0.01);
    bottom: calc(100% * 0.01);
    float: right;
}

.sdv-spinner-center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
    `;