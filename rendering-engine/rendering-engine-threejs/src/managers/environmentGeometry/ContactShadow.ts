import { vec3 } from 'gl-matrix';
import { SDData } from '../../objects/SDData';
import { SDObject } from '../../objects/SDObject';
import { RenderingEngine } from '../../RenderingEngine';
import { IEnvironmentGeometry } from './IEnvironmentGeometry';
import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

export class ContactShadow implements IEnvironmentGeometry {
    // #region Properties (17)

    private _blur = 1.5;
    private _blurPlane!: THREE.Mesh<THREE.PlaneGeometry, THREE.Material | THREE.Material[], THREE.Object3DEventMap>;
    private _color: string = '#ffffff';
    private _contactShadowObject: SDData;
    private _darkness: number = 2.5;
    private _depthMaterial!: THREE.MeshDepthMaterial;
    private _fillPlane!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>;
    private _height: number = 0.25;
    private _horizontalBlurMaterial!: THREE.ShaderMaterial;
    private _opacity: number = 1;
    private _plane!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>;
    private _renderTarget!: THREE.WebGLRenderTarget<THREE.Texture>;
    private _renderTargetBlur!: THREE.WebGLRenderTarget<THREE.Texture>;
    private _shadowCamera!: THREE.OrthographicCamera;
    private _shadowGroup!: THREE.Group<THREE.Object3DEventMap>;
    private _verticalBlurMaterial!: THREE.ShaderMaterial;
    private _currentGridExtents: number = 1;

    // #endregion Properties (17)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine, private readonly _parent: SDObject) {
        this._contactShadowObject = new SDData('contactShadow', '');
        this._contactShadowObject.visible = false;
        this._parent.add(this._contactShadowObject);
        this.createContactShadow();
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (10)

    public get blur(): number {
        return this._blur;
    }

    public set blur(value: number) {
        this._blur = value;
    }

    public get darkness(): number {
        return this._darkness;
    }

    public set darkness(value: number) {
        this._darkness = value;
        this._depthMaterial.userData.darkness.value = value;
    }

    public get height(): number {
        return this._height;
    }

    public set height(value: number) {
        this._height = value;
        this._shadowCamera.far = this._currentGridExtents * value;
        this._shadowCamera.updateProjectionMatrix();
        // const cameraHelper = new THREE.CameraHelper(this._shadowCamera);
        // this._parent.add(cameraHelper);
        this._renderingEngine.renderingManager.updateShadowMap();
    }

    public get opacity(): number {
        return this._opacity;
    }

    public set opacity(value: number) {
        this._opacity = value;
        (this._plane.material as THREE.MeshBasicMaterial).opacity = value;
    }

    public get visible(): boolean {
        return this._contactShadowObject.visible;
    }

    public set visible(value: boolean) {
        this._contactShadowObject.visible = value;
    }

    // #endregion Public Getters And Setters (10)

    // #region Public Methods (3)

    public changeSceneExtents(position: vec3, divisions: number, gridExtents: number): void {
        this._currentGridExtents = gridExtents;

        const widthAndHeight = 2 * gridExtents;
        const planeGeometry = new THREE.PlaneGeometry(widthAndHeight, widthAndHeight);
        this._plane.geometry.dispose();
        this._plane.geometry = planeGeometry;
        this._fillPlane.geometry.dispose();
        this._fillPlane.geometry = planeGeometry;
        this._blurPlane.geometry.dispose();
        this._blurPlane.geometry = planeGeometry;
        this._shadowCamera = new THREE.OrthographicCamera(- widthAndHeight / 2, widthAndHeight / 2, widthAndHeight / 2, - widthAndHeight / 2, 0, gridExtents * this._height);
        this._shadowCamera.up.set(0, 1, 0);
        this._shadowCamera.position.set(0, 0, -gridExtents / 50);
        this._shadowCamera.lookAt(0, 0, 1);
        this._shadowCamera.updateProjectionMatrix();
        this._shadowGroup.add(this._shadowCamera);

        // const cameraHelper = new THREE.CameraHelper(this._shadowCamera);
        // this._parent.add(cameraHelper);

        this._contactShadowObject.position.set(position[0], position[1], position[2]);

        this._renderingEngine.renderingManager.updateShadowMap();
    }

    public render() {
        const initialGridVisibility = this._renderingEngine.gridVisibility;
        this._renderingEngine.gridVisibility = false;
        const initialGroundPlaneVisibility = this._renderingEngine.groundPlaneVisibility;
        this._renderingEngine.groundPlaneVisibility = false;
        const initialGroundPlaneShadowVisibility = this._renderingEngine.groundPlaneShadowVisibility;
        this._renderingEngine.groundPlaneShadowVisibility = false;

        this._blurPlane.visible = false;
        this._fillPlane.visible = false;
        this._plane.visible = false;

        // remove the background
        const initialBackground = this._renderingEngine.scene.background;
        this._renderingEngine.scene.background = null;

        // force the depthMaterial to everything
        this._renderingEngine.scene.overrideMaterial = this._depthMaterial;

        // set renderer clear alpha
        const initialClearAlpha = this._renderingEngine.renderer.getClearAlpha();
        this._renderingEngine.renderer.setClearAlpha(0);

        // render to the render target to get the depths
        this._renderingEngine.renderer.setRenderTarget(this._renderTarget);
        this._renderingEngine.renderer.render(this._renderingEngine.scene, this._shadowCamera);

        // and reset the override material
        this._renderingEngine.scene.overrideMaterial = null;

        this.blurShadow(this._blur);

        // // a second pass to reduce the artifacts
        // // (0.4 is the minimum blur amount so that the artifacts are gone)
        this.blurShadow(this._blur * 0.4);

        // reset and render the normal scene
        this._renderingEngine.renderer.setRenderTarget(null);
        this._renderingEngine.renderer.setClearAlpha(initialClearAlpha);
        this._renderingEngine.scene.background = initialBackground;

        this._plane.visible = true;

        this._renderingEngine.gridVisibility = initialGridVisibility;
        this._renderingEngine.groundPlaneVisibility = initialGroundPlaneVisibility;
        this._renderingEngine.groundPlaneShadowVisibility = initialGroundPlaneShadowVisibility;
    }

    public updatePosition(position: vec3): void {
        this._contactShadowObject.position.set(position[0], position[1], position[2]);
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    private blurShadow(amount: number): void {
        this._blurPlane.visible = true;

        // blur horizontally and draw in the renderTargetBlur
        this._blurPlane.material = this._horizontalBlurMaterial;
        (this._blurPlane.material as THREE.ShaderMaterial).uniforms.tDiffuse.value = this._renderTarget.texture;
        this._horizontalBlurMaterial.uniforms.h.value = amount * 1 / 256;

        this._renderingEngine.renderer.setRenderTarget(this._renderTargetBlur);
        this._renderingEngine.renderer.render(this._blurPlane, this._shadowCamera);

        // blur vertically and draw in the main renderTarget
        this._blurPlane.material = this._verticalBlurMaterial;
        (this._blurPlane.material as THREE.ShaderMaterial).uniforms.tDiffuse.value = this._renderTargetBlur.texture;
        this._verticalBlurMaterial.uniforms.v.value = amount * 1 / 256;

        this._renderingEngine.renderer.setRenderTarget(this._renderTarget);
        this._renderingEngine.renderer.render(this._blurPlane, this._shadowCamera);

        this._blurPlane.visible = false;
    }

    private createContactShadow() {
        const widthAndHeight = 1;

        // the container, if you need to move the plane just move this
        this._shadowGroup = new THREE.Group();
        this._contactShadowObject.add(this._shadowGroup);

        // the render target that will show the shadows in the plane texture
        this._renderTarget = new THREE.WebGLRenderTarget(512, 512);
        this._renderTarget.texture.generateMipmaps = false;

        // the render target that we will use to blur the first render target
        this._renderTargetBlur = new THREE.WebGLRenderTarget(512, 512);
        this._renderTargetBlur.texture.generateMipmaps = false;

        // make a plane and make it face up
        const planeGeometry = new THREE.PlaneGeometry(widthAndHeight, widthAndHeight);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: this._renderTarget.texture,
            opacity: this._opacity,
            transparent: true,
            depthWrite: false,
        });
        this._plane = new THREE.Mesh(planeGeometry, planeMaterial);
        // make sure it's rendered after the fillPlane
        this._plane.renderOrder = 1;
        this._shadowGroup.add(this._plane);

        // // the y from the texture is flipped!
        // this._plane.rotateZ(-Math.PI/2);
        this._plane.scale.x = -1;
        // this._plane.scale.y = -1;

        // the plane onto which to blur the texture
        this._blurPlane = new THREE.Mesh(planeGeometry);
        this._blurPlane.rotateX(Math.PI);
        this._blurPlane.visible = false;
        this._shadowGroup.add(this._blurPlane);

        // the plane with the color of the ground
        const fillPlaneMaterial = new THREE.MeshBasicMaterial({
            color: this._color,
            opacity: 0,
            transparent: true,
            depthWrite: false,
        });
        this._fillPlane = new THREE.Mesh(planeGeometry, fillPlaneMaterial);
        this._shadowGroup.add(this._fillPlane);

        // the camera to render the depth material from
        this._shadowCamera = new THREE.OrthographicCamera(- widthAndHeight / 2, widthAndHeight / 2, widthAndHeight / 2, - widthAndHeight / 2, 0, 1);
        this._shadowGroup.add(this._shadowCamera);

        // like MeshDepthMaterial, but goes from black to transparent
        this._depthMaterial = new THREE.MeshDepthMaterial();
        this._depthMaterial.side = THREE.DoubleSide;
        this._depthMaterial.userData.darkness = { value: this._darkness };
        this._depthMaterial.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
            shader.uniforms.darkness = this._depthMaterial.userData.darkness;
            shader.fragmentShader = /* glsl */`
						uniform float darkness;
						${shader.fragmentShader.replace(
                'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
                'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
            )}
					`;

        };

        this._depthMaterial.depthTest = false;
        this._depthMaterial.depthWrite = false;

        this._horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader);
        this._horizontalBlurMaterial.depthTest = false;

        this._verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader);
        this._verticalBlurMaterial.depthTest = false;
    }

    // #endregion Private Methods (2)
}