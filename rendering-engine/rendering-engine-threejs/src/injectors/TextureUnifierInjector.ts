import * as THREE from 'three';

export class TextureUnifierInjector {
    // #region Properties (5)

    private _mergeShader?: THREE.ShaderMaterial;
    private _quad?: THREE.Mesh;
    private _quadCamera?: THREE.OrthographicCamera;
    private _quadScene?: THREE.Scene;
    private _renderer?: THREE.WebGLRenderer;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor() { }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public async combineTextures(red?: HTMLImageElement | ArrayBuffer, green?: HTMLImageElement | ArrayBuffer, blue?: HTMLImageElement | ArrayBuffer): Promise<{ image: HTMLImageElement | ArrayBuffer, blob: Blob }> {
        if (!red && !green && !blue)
            throw new Error('No maps supplied.');

        if (red && red instanceof ArrayBuffer)
            return { image: red, blob: new Blob([new Uint8Array(red)], { type: 'image/jpeg' }) };

        if (green && green instanceof ArrayBuffer)
            return { image: green, blob: new Blob([new Uint8Array(green)], { type: 'image/jpeg' }) };

        if (blue && blue instanceof ArrayBuffer)
            return { image: blue, blob: new Blob([new Uint8Array(blue)], { type: 'image/jpeg' }) };

        if (!this._renderer)
            this.createThreeJsUtils();

        let width = 0, height = 0;
        const textures = [red, green, blue];
        for (const t of textures) {
            if (t) {
                if (width === 0 && height === 0) {
                    width = t.width;
                    height = t.height;
                } else if (t.width !== width && t.height !== height) {
                    throw new Error('Maps have different sizes. Combining not supported.');
                }
            }
        }

        if (red) {
            const redTexture = new THREE.Texture(red);
            redTexture.needsUpdate = true;
            this._mergeShader!.uniforms.tRed.value = redTexture;
            this._mergeShader!.uniforms.activeRed.value = true;
        } else {
            this._mergeShader!.uniforms.activeRed.value = false;
        }

        if (green) {
            const greenTexture = new THREE.Texture(green);
            greenTexture.needsUpdate = true;
            this._mergeShader!.uniforms.tGreen.value = greenTexture;
            this._mergeShader!.uniforms.activeGreen.value = true;
        } else {
            this._mergeShader!.uniforms.activeGreen.value = false;
        }

        if (blue) {
            const blueTexture = new THREE.Texture(blue);
            blueTexture.needsUpdate = true;
            this._mergeShader!.uniforms.tBlue.value = blueTexture;
            this._mergeShader!.uniforms.activeBlue.value = true;
        } else {
            this._mergeShader!.uniforms.activeBlue.value = false;
        }

        // The different render targets that are used by the passes
        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
        renderTarget.texture.name = 'target.rt';
        this._renderer!.setRenderTarget(renderTarget);

        this._renderer!.render(this._quadScene!, this._quadCamera!);

        const buffer = new Uint8ClampedArray(4 * width * height);
        this._renderer!.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);

        const imageData = new ImageData(buffer, width, height);
        const canvas = document.createElement('canvas');
        const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);

        const imageOut = new Image();
        const promises = [];
        promises.push(new Promise<void>((resolve, reject) => {
            imageOut.onload = () => resolve();
            imageOut.onerror = reject;
        }));

        imageOut.crossOrigin = 'anonymous';
        const mimeType = 'image/jpeg';
        imageOut.src = canvas.toDataURL(mimeType, 1.0);

        let blob!: Blob;
        promises.push(new Promise<void>((resolve, reject) => {
            canvas.toBlob((b) => {
                if (!b) {
                    reject('Could not create blob.');
                } else {
                    blob = b;
                }
                resolve();
            }, mimeType, 1.0);
        }));

        await Promise.all(promises);

        return { image: imageOut, blob };
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private createThreeJsUtils() {
        this._mergeShader = new THREE.ShaderMaterial({
            uniforms: {
                tRed: { value: null },
                activeRed: { value: false },
                defaultRed: { value: 1.0 },
                tGreen: { value: null },
                activeGreen: { value: false },
                defaultGreen: { value: 1.0 },
                tBlue: { value: null },
                activeBlue: { value: false },
                defaultBlue: { value: 1.0 },
            },
            vertexShader: `// @author Michael Oppitz 
        
            uniform sampler2D tRed;
            uniform bool activeRed;
            uniform float defaultRed;
            
            uniform sampler2D tGreen;		
            uniform bool activeGreen;
            uniform float defaultGreen;
            
            uniform sampler2D tBlue;		
            uniform bool activeBlue;
            uniform float defaultBlue;
        
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,
            fragmentShader: `// @author Michael Oppitz 
        
            uniform sampler2D tRed;
            uniform bool activeRed;
            uniform float defaultRed;
            
            uniform sampler2D tGreen;		
            uniform bool activeGreen;
            uniform float defaultGreen;
            
            uniform sampler2D tBlue;		
            uniform bool activeBlue;
            uniform float defaultBlue;
            
            varying vec2 vUv;
            
            void main() {
                vec4 outColor = vec4(0.0, 0.0, 0.0, 1.0);
        
                if(activeRed == true) {
                    outColor.r = texture2D(tRed, vUv).r;
                } else {
                    outColor.r = defaultRed;
                }
            
                if(activeGreen == true) {
                    outColor.g = texture2D(tGreen, vUv).g;
                } else {
                    outColor.g = defaultGreen;
                }
            
                if(activeBlue == true) {
                    outColor.b = texture2D(tBlue, vUv).b;
                } else {
                    outColor.b = defaultBlue;
                }
            
                gl_FragColor = outColor;
            }`
        });

        this._quadCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
        this._quadScene = new THREE.Scene();
        this._quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._mergeShader);
        this._quadScene.add(this._quad);

        this._renderer = new THREE.WebGLRenderer();
    }

    // #endregion Private Methods (1)
}