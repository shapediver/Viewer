import { Pass } from "postprocessing"
import {
	HalfFloatType,
	NoColorSpace,
	Matrix4,
	NearestFilter,
	NoBlending,
	RepeatWrapping,
	ShaderMaterial,
	TextureLoader,
	Vector2,
	WebGLRenderTarget,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	Camera
} from "three"
import { basic as vertexShader} from "../utils/shader/basic"
import {sampleBlueNoise} from "../utils/shader/sampleBlueNoise"

// a general AO pass that can be used for any AO algorithm
class AOPass extends Pass {
	private _camera: PerspectiveCamera
	private _scene: Scene
	renderTarget: WebGLRenderTarget
	constructor(camera: Camera, scene: Scene, fragmentShader: string) {
		super()
		this._camera = camera as PerspectiveCamera;
		this._scene = scene

		this.renderTarget = new WebGLRenderTarget(1, 1, {
			type: HalfFloatType,
			depthBuffer: false
		})

		const finalFragmentShader = fragmentShader.replace("#include <sampleBlueNoise>", sampleBlueNoise)

		this.fullscreenMaterial = new ShaderMaterial({
			fragmentShader: finalFragmentShader,
			vertexShader,

			uniforms: {
				depthTexture: { value: null },
				normalTexture: { value: null },
				cameraNear: { value: 0 },
				cameraFar: { value: 0 },
				viewMatrix: { value: this._camera.matrixWorldInverse },
				projectionViewMatrix: { value: new Matrix4() },
				projectionMatrixInverse: { value: this._camera.projectionMatrixInverse },
				cameraMatrixWorld: { value: this._camera.matrixWorld },
				texSize: { value: new Vector2() },
				blueNoiseTexture: { value: null },
				blueNoiseRepeat: { value: new Vector2() },
				aoDistance: { value: 0 },
				distancePower: { value: 0 },
				bias: { value: 0 },
				thickness: { value: 0 },
				power: { value: 0 },
				frame: { value: 0 }
			},

			blending: NoBlending,
			depthWrite: false,
			depthTest: false,
			toneMapped: false
		})

		new TextureLoader().load("https://viewer.shapediver.com/v3/graphics/LDR_RGBA_0.png", blueNoiseTexture => {
			blueNoiseTexture.minFilter = NearestFilter
			blueNoiseTexture.magFilter = NearestFilter
			blueNoiseTexture.wrapS = RepeatWrapping
			blueNoiseTexture.wrapT = RepeatWrapping
			blueNoiseTexture.colorSpace = NoColorSpace;

			(this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseTexture.value = blueNoiseTexture
		})
	}

	get texture() {
		return this.renderTarget.texture
	}

	setSize(width: number, height: number) {
		this.renderTarget.setSize(width, height);

		(this.fullscreenMaterial as ShaderMaterial).uniforms.texSize.value.set(this.renderTarget.width, this.renderTarget.height)
	}

	render(renderer: WebGLRenderer) {
		const spp = +(this.fullscreenMaterial as ShaderMaterial).defines.spp;

		(this.fullscreenMaterial as ShaderMaterial).uniforms.frame.value = ((this.fullscreenMaterial as ShaderMaterial).uniforms.frame.value + spp) % 65536;

		(this.fullscreenMaterial as ShaderMaterial).uniforms.cameraNear.value = this._camera.near;
		(this.fullscreenMaterial as ShaderMaterial).uniforms.cameraFar.value = this._camera.far;

		(this.fullscreenMaterial as ShaderMaterial).uniforms.projectionViewMatrix.value.multiplyMatrices(
			this._camera.projectionMatrix,
			this._camera.matrixWorldInverse
		);

		const noiseTexture = (this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseTexture.value;
		if (noiseTexture) {
			const { width, height } = noiseTexture.source.data;

			(this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseRepeat.value.set(
				this.renderTarget.width / width,
				this.renderTarget.height / height
			)
		}

		renderer.setRenderTarget(this.renderTarget)
		renderer.render(this.scene, this.camera)
	}
}

export { AOPass }
