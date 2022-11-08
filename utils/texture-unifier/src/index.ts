import { IMapData, MapData } from "@shapediver/viewer";
import * as THREE from "three"

let mergeShader: THREE.ShaderMaterial;
let quadCamera: THREE.OrthographicCamera;
let quadScene: THREE.Scene;
let quad: THREE.Mesh;
let renderer: THREE.WebGLRenderer;

const createThreeJsUtils = () => {
    mergeShader = new THREE.ShaderMaterial({
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
    
    quadCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    quadScene = new THREE.Scene();
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mergeShader);
    quadScene.add(quad);
    
    renderer = new THREE.WebGLRenderer();
}

export const combineTextures = async (red?: HTMLImageElement, green?: HTMLImageElement, blue?: HTMLImageElement): Promise<HTMLImageElement> => {
    if (!red && !green && !blue)
        throw new Error('No maps supplied.')

    if(!renderer)
        createThreeJsUtils()

    let width = 0, height = 0;
    const textures = [red, green, blue];
    for (let t of textures) {
        if (t) {
            if (width === 0 && height === 0) {
                width = t.width;
                height = t.height;
            } else if (t.width !== width && t.height !== height) {
                throw new Error('Maps have different sizes. Combining not supported.')
            }
        }
    }

    if (red) {
        const redTexture = new THREE.Texture(red);
        redTexture.needsUpdate = true;
        mergeShader.uniforms.tRed.value = redTexture;
        mergeShader.uniforms.activeRed.value = true;
    } else {
        mergeShader.uniforms.activeRed.value = false;
    }

    if (green) {
        const greenTexture = new THREE.Texture(green);
        greenTexture.needsUpdate = true;
        mergeShader.uniforms.tGreen.value = greenTexture;
        mergeShader.uniforms.activeGreen.value = true;
    } else {
        mergeShader.uniforms.activeGreen.value = false;
    }

    if (blue) {
        const blueTexture = new THREE.Texture(blue);
        blueTexture.needsUpdate = true;
        mergeShader.uniforms.tBlue.value = blueTexture;
        mergeShader.uniforms.activeBlue.value = true;
    } else {
        mergeShader.uniforms.activeBlue.value = false;
    }

    // The different render targets that are used by the passes
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
    });
    renderTarget.texture.name = 'target.rt';
    renderer.setRenderTarget(renderTarget)

    renderer.render(quadScene, quadCamera);

    const buffer = new Uint8ClampedArray(4 * width * height);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer)

    let imageData = new ImageData(buffer, width, height);
    var canvas = document.createElement('canvas');
    var ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);

    const imageOut = new Image();
    const promise = new Promise<void>(resolve => {
        imageOut.onload = () => resolve();
    })
    imageOut.crossOrigin = "anonymous";
    imageOut.src = canvas.toDataURL("image/jpeg", 1.0);

    await promise;

    return imageOut;
}