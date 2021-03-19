import * as THREE from 'three';
import { MaterialData, TEXTURE_WRAPPING, TEXTURE_FILTERING, MapData } from '@shapediver/viewer.shared.types';
import { vec4 } from 'gl-matrix';
import { UuidGenerator } from '@shapediver/viewer.shared.utils';
import { container } from 'tsyringe';
import { RenderingEngine } from '../RenderingEngine';

export class MaterialLoader {
    // #region Properties (5)

    private readonly _defaultColor: vec4 = vec4.fromValues(0, 1, 0.9686, 1);
    private readonly _materialLibrary: THREE.MeshStandardMaterial[] = [];
    private readonly _uuidGenerator: UuidGenerator = container.resolve(UuidGenerator);

    private _blending: number = 0.0;
    private _lightSizeUV: number = 0.025;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Methods (4)

    public assignEnvironmentMap(e: THREE.CubeTexture | null) {
        for(let i = 0; i < this._materialLibrary.length; i++) {
            this._materialLibrary[i].envMap = e;
            this._materialLibrary[i].needsUpdate = true;
        }
    }

    /**
     * Create a material object with the provided material data.
     * 
     * @param material the material data
     * @returns the material object
     */
    public load(materialProperties?: MaterialData): THREE.Material {
        let material: THREE.MeshStandardMaterial;
        if (materialProperties) {
            material = new THREE.MeshStandardMaterial();

            material.alphaTest = materialProperties.alphaCutoff;

            // blendDst

            // blendDstAlpha

            // blendEquation

            // blendEquationAlpha

            // blending

            // blendSrc

            // blendSrcAlpha

            // clipIntersection

            // clippingPlanes

            // clipShadows

            // colorWrite

            // depthFunc

            // depthWrite

            // stencilWrite

            // stencilWriteMask

            // stencilFunc

            // stencilFail

            // stencilZFail

            // stencilZPass

            // flatShading
            if(materialProperties.shading !== undefined)
                material.flatShading = materialProperties.shading !== 'smooth';

            // fog

            // opacity

            // polygonOffset

            // polygonOffsetFactor

            // polygonOffsetUnits

            // precision

            // premultipliedAlpha

            // dithering

            // shadowSide

            // side

            // toneMapped

            // transparent

            // vertexColors

            // visible

            if (materialProperties.alphaMap !== undefined) {
                material.alphaMap = this.createTexture(materialProperties.alphaMap);
                material.transparent = true;
            }

            // aoMap

            // aoMapIntensity

            if (materialProperties.bumpMap !== undefined)
                material.bumpMap = this.createTexture(materialProperties.bumpMap);

            material.bumpScale = materialProperties.bumpScale;

            let color = this._defaultColor;
            if(materialProperties.color)
                color = materialProperties.color;
            material.color = new THREE.Color(color[0] > 1 ? color[0] / 255 : color[0],
                color[1] > 1 ? color[1] / 255 : color[1],
                color[2] > 1 ? color[2] / 255 : color[2]);

            // displacementMap

            // displacementScale

            // displacementBias

            material.emissive = new THREE.Color(materialProperties.emissiveness[0], materialProperties.emissiveness[1], materialProperties.emissiveness[2]);

            if (materialProperties.emissiveMap !== undefined)
                material.emissiveMap = this.createTexture(materialProperties.emissiveMap);

            // emissiveIntensity

            // envMap

            // envMapIntensity

            // lightMap

            // lightMapIntensity

            if (materialProperties.map !== undefined)
                material.map = this.createTexture(materialProperties.map);

            material.metalness = materialProperties.metalness;

            material.roughness = materialProperties.roughness;

            if (materialProperties.metalnessRoughnessMap !== undefined) {
                material.metalnessMap = this.createTexture(materialProperties.metalnessRoughnessMap);
                material.roughnessMap = material.metalnessMap;
            } else {
                if (materialProperties.metalnessMap !== undefined)
                    material.metalnessMap = this.createTexture(materialProperties.metalnessMap);
                if (materialProperties.roughnessMap !== undefined)
                    material.roughnessMap = this.createTexture(materialProperties.roughnessMap);
            }

            // morphNormals

            // morphTargets

            if (materialProperties.normalMap !== undefined)
                material.normalMap = this.createTexture(materialProperties.normalMap);

            // normalMapType

            material.normalScale = new THREE.Vector2(materialProperties.normalScale, materialProperties.normalScale);

            // refractionRatio

            // skinning

            // vertexTangents

            // wireframe

            // wireframeLinecap

            // wireframeLinejoin

            // wireframeLinewidth

            material.side = THREE.DoubleSide;
        } else {
            material = new THREE.MeshStandardMaterial({color: new THREE.Color(this._defaultColor[0], this._defaultColor[1], this._defaultColor[2])});
            material.side = THREE.DoubleSide;
        }

        material.onBeforeCompile = (shader: THREE.Shader) => {
            shader.uniforms.lightSizeUV = { value: this._lightSizeUV };
            shader.uniforms.blending = { value: this._blending };
            material.userData.shader = shader;
        };

        material.needsUpdate = true;
        this._materialLibrary.push(material);
        return material;
    }

    public updateMaterials(): void {
        for(let i = 0; i < this._materialLibrary.length; i++)
            this._materialLibrary[i].needsUpdate = true;
    }

    public updateSoftShadow(lightSizeUV: number, blending: number) {
        this._lightSizeUV = lightSizeUV;
        this._blending = blending;
        for(let i = 0; i < this._materialLibrary.length; i++) {
            if(this._materialLibrary[i].userData.shader) {
                this._materialLibrary[i].userData.shader.uniforms.lightSizeUV.value = lightSizeUV;
                this._materialLibrary[i].userData.shader.uniforms.blending.value = blending;
            }
        }
    }

    // #endregion Public Methods (4)

    // #region Private Methods (1)

    private createTexture(map: MapData): THREE.Texture {
        const texture = new THREE.Texture(map.image);
        texture.format = THREE.RGBAFormat;
        texture.minFilter = (() => {
            switch (map.minFilter) {
                case TEXTURE_FILTERING.NEAREST:
                    return THREE.NearestFilter;
                case TEXTURE_FILTERING.NEAREST_MIPMAP_NEAREST:
                    return THREE.NearestMipMapNearestFilter;
                case TEXTURE_FILTERING.LINEAR_MIPMAP_NEAREST:
                    return THREE.LinearMipMapNearestFilter;
                case TEXTURE_FILTERING.NEAREST_MIPMAP_LINEAR:
                    return THREE.NearestMipMapLinearFilter;
                case TEXTURE_FILTERING.LINEAR:
                    return THREE.LinearFilter
                case TEXTURE_FILTERING.LINEAR_MIPMAP_LINEAR:
                default:
                    return THREE.LinearMipMapLinearFilter;
            }
        })();
        texture.magFilter = (() => {
            switch (map.magFilter) {
                case TEXTURE_FILTERING.NEAREST:
                    return THREE.NearestFilter;
                case TEXTURE_FILTERING.LINEAR:
                default:
                    return THREE.LinearFilter
            }
        })();
        texture.wrapS = (() => {
            switch (map.wrapS) {
                case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
                    return THREE.ClampToEdgeWrapping;
                case TEXTURE_WRAPPING.MIRRORED_REPEAT:
                    return THREE.MirroredRepeatWrapping;
                case TEXTURE_WRAPPING.REPEAT:
                default:
                    return THREE.RepeatWrapping
            }
        })();
        texture.wrapT = (() => {
            switch (map.wrapT) {
                case TEXTURE_WRAPPING.CLAMP_TO_EDGE:
                    return THREE.ClampToEdgeWrapping;
                case TEXTURE_WRAPPING.MIRRORED_REPEAT:
                    return THREE.MirroredRepeatWrapping;
                case TEXTURE_WRAPPING.REPEAT:
                default:
                    return THREE.RepeatWrapping
            }
        })();

        texture.center = new THREE.Vector2(map.center[0], map.center[1]);
        // TODO color
        // texture.color = new THREE.Color(map.color[0], map.color[1], map.color[2]);
        texture.offset = new THREE.Vector2(map.offset[0], map.offset[1]);
        texture.repeat = new THREE.Vector2(map.repeat[0], map.repeat[1]);
        texture.rotation = map.rotation;

        texture.flipY = map.flipY;
        texture.needsUpdate = true;
        return texture;
    }

    // #endregion Private Methods (1)
}