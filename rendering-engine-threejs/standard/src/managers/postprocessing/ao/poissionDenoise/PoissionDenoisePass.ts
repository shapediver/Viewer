import { Pass } from "postprocessing"
import {
	HalfFloatType,
	NoColorSpace,
	Matrix4,
	NearestFilter,
	RepeatWrapping,
	ShaderMaterial,
	TextureLoader,
	Vector2,
	WebGLRenderTarget,
	Texture,
	WebGLRenderer,
	Camera
} from "three"
import { basic as vertexShader} from "../utils/shader/basic"
import {sampleBlueNoise} from "../utils/shader/sampleBlueNoise"
import { poissionDenoise as fragmentShader } from "./shader/poissionDenoise"
import { generateDenoiseSamples, generatePoissonDiskConstant } from "./utils/PoissonUtils"

const finalFragmentShader = fragmentShader.replace("#include <sampleBlueNoise>", sampleBlueNoise)

const defaultPoissonBlurOptions = {
	iterations: 1,
	radius: 8,
	rings: 5.625,
	lumaPhi: 10,
	depthPhi: 2,
	normalPhi: 3.25,
	samples: 16,
	normalTexture: null
}

export class PoissionDenoisePass extends Pass {

	static DefaultOptions = defaultPoissonBlurOptions;

	iterations = defaultPoissonBlurOptions.iterations
	index = 0
	inputTexture: Texture
	renderTargetA: WebGLRenderTarget
	renderTargetB: WebGLRenderTarget
	samples: number = 16;
	rings: number = 5.625;
	radius: number = 8;

	constructor(camera: Camera, inputTexture: Texture, depthTexture: Texture, options = defaultPoissonBlurOptions) {
		super("PoissionBlurPass")

		options = { ...defaultPoissonBlurOptions, ...options }

		this.inputTexture = inputTexture

		this.fullscreenMaterial = new ShaderMaterial({
			fragmentShader: finalFragmentShader,
			vertexShader,
			uniforms: {
				depthTexture: { value: null },
				inputTexture: { value: null },
				projectionMatrixInverse: { value: new Matrix4() },
				cameraMatrixWorld: { value: new Matrix4() },
				lumaPhi: { value: 5.0 },
				depthPhi: { value: 5.0 },
				normalPhi: { value: 5.0 },
				resolution: { value: new Vector2() },
				blueNoiseTexture: { value: null },
				index: { value: 0 },
				blueNoiseRepeat: { value: new Vector2() }
			}
		})

		const renderTargetOptions = {
			type: HalfFloatType,
			depthBuffer: false
		}

		this.renderTargetA = new WebGLRenderTarget(1, 1, renderTargetOptions)
		this.renderTargetB = new WebGLRenderTarget(1, 1, renderTargetOptions)

		const { uniforms } = (this.fullscreenMaterial as ShaderMaterial)

		uniforms["inputTexture"].value = this.inputTexture
		uniforms["depthTexture"].value = depthTexture
		uniforms["projectionMatrixInverse"].value = camera.projectionMatrixInverse
		uniforms["cameraMatrixWorld"].value = camera.matrixWorld
		uniforms["depthPhi"].value = options.depthPhi
		uniforms["normalPhi"].value = options.normalPhi

		if (options.normalTexture) {
			uniforms["normalTexture"] = { value : options.normalTexture }
		} else {
			(this.fullscreenMaterial as ShaderMaterial).defines.NORMAL_IN_RGB = "";
		}

		// these properties need the shader to be recompiled
		for (const prop of ["radius", "rings", "samples"]) {
			Object.defineProperty(this, prop, {
				get: () => (options as any)[prop],
				set: value => {
					(options as any)[prop] = value

					this.setSize(this.renderTargetA.width, this.renderTargetA.height)
				}
			})
		}

		new TextureLoader().load("https://viewer.shapediver.com/v3/graphics/LDR_RGBA_0.png", blueNoiseTexture => {
			blueNoiseTexture.minFilter = NearestFilter;
			blueNoiseTexture.magFilter = NearestFilter;
			blueNoiseTexture.wrapS = RepeatWrapping;
			blueNoiseTexture.wrapT = RepeatWrapping;
			blueNoiseTexture.colorSpace = NoColorSpace;

			(this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseTexture.value = blueNoiseTexture
		})
	}

	setSize(width: number, height: number) {
		this.renderTargetA.setSize(width, height);
		this.renderTargetB.setSize(width, height);

		(this.fullscreenMaterial as ShaderMaterial).uniforms.resolution.value.set(width, height)

		const poissonDisk = generateDenoiseSamples(
			this.samples,
			this.rings,
			this.radius,
			new Vector2(1 / width, 1 / height)
		)

		const sampleDefine = `const int samples = ${this.samples};\n`

		const poissonDiskConstant = generatePoissonDiskConstant(poissonDisk);

		(this.fullscreenMaterial as ShaderMaterial).fragmentShader = sampleDefine + poissonDiskConstant + "\n" + finalFragmentShader;
		(this.fullscreenMaterial as ShaderMaterial).needsUpdate = true;
	}

	get texture() {
		return this.renderTargetB.texture
	}

	render(renderer: WebGLRenderer) {
		(this.fullscreenMaterial as ShaderMaterial).uniforms.index.value = 0

		const noiseTexture = (this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseTexture.value
		if (noiseTexture) {
			const { width, height } = (noiseTexture as Texture).source.data;

			(this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseRepeat.value.set(
				this.renderTargetA.width / width,
				this.renderTargetA.height / height
			)
		}

		for (let i = 0; i < 2 * this.iterations; i++) {
			const horizontal = i % 2 === 0

			const inputRenderTarget = horizontal ? this.renderTargetB : this.renderTargetA;
			(this.fullscreenMaterial as ShaderMaterial).uniforms["inputTexture"].value = i === 0 ? this.inputTexture : inputRenderTarget.texture

			const renderTarget = horizontal ? this.renderTargetA : this.renderTargetB

			renderer.setRenderTarget(renderTarget);
			renderer.render(this.scene, this.camera);

			(this.fullscreenMaterial as ShaderMaterial).uniforms.index.value = ((this.fullscreenMaterial as ShaderMaterial).uniforms.index.value + 1) % 4
		}
	}
}
