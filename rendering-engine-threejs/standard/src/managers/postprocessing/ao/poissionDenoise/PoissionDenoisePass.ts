import { Pass } from 'postprocessing';
import {
	Camera,
	HalfFloatType,
	Matrix4,
	NearestFilter,
	NoColorSpace,
	RepeatWrapping,
	ShaderMaterial,
	Texture,
	TextureLoader,
	Vector2,
	WebGLRenderTarget,
	WebGLRenderer
} from 'three';
import { basic as vertexShader } from '../utils/shader/basic';
import { sampleBlueNoise } from '../utils/shader/sampleBlueNoise';
import { poissionDenoise as fragmentShader } from './shader/poissionDenoise';

const finalFragmentShader = fragmentShader.replace('#include <sampleBlueNoise>', sampleBlueNoise);

const defaultPoissonBlurOptions = {
	iterations: 1,
	radius: 8,
	rings: 5.625,
	lumaPhi: 10,
	depthPhi: 2,
	normalPhi: 3.25,
	samples: 16,
	distance: 1,
	normalTexture: null
};

export class PoissionDenoisePass extends Pass {
	// #region Properties (9)

	public static DefaultOptions = defaultPoissonBlurOptions;

	public index = 0;
	public inputTexture: Texture;
	public iterations = defaultPoissonBlurOptions.iterations;
	public radius = 8;
	public renderTargetA: WebGLRenderTarget;
	public renderTargetB: WebGLRenderTarget;
	public rings = 5.625;
	public samples = 16;

	// #endregion Properties (9)

	// #region Constructors (1)

	constructor(camera: Camera, inputTexture: Texture, depthTexture: Texture, options: { [key: string]: unknown } = defaultPoissonBlurOptions) {
		super('PoissionBlurPass');

		options = { ...defaultPoissonBlurOptions, ...options };

		this.inputTexture = inputTexture;

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
				distance: { value: 1.0 },
				resolution: { value: new Vector2() },
				blueNoiseTexture: { value: null },
				index: { value: 0 },
				blueNoiseRepeat: { value: new Vector2() }
			}
		});

		const renderTargetOptions = {
			type: HalfFloatType,
			depthBuffer: false
		};

		this.renderTargetA = new WebGLRenderTarget(1, 1, renderTargetOptions);
		this.renderTargetB = new WebGLRenderTarget(1, 1, renderTargetOptions);

		const { uniforms } = (this.fullscreenMaterial as ShaderMaterial);

		uniforms['inputTexture'].value = this.inputTexture;
		uniforms['depthTexture'].value = depthTexture;
		uniforms['projectionMatrixInverse'].value = camera.projectionMatrixInverse;
		uniforms['cameraMatrixWorld'].value = camera.matrixWorld;
		uniforms['depthPhi'].value = options.depthPhi;
		uniforms['normalPhi'].value = options.normalPhi;
		uniforms['distance'].value = options.distance;

		if (options.normalTexture) {
			uniforms['normalTexture'] = { value: options.normalTexture };
		} else {
			(this.fullscreenMaterial as ShaderMaterial).defines.NORMAL_IN_RGB = '';
		}

		// these properties need the shader to be recompiled
		for (const prop of ['radius', 'rings', 'samples']) {
			Object.defineProperty(this, prop, {
				get: () => options[prop],
				set: value => {
					options[prop] = value;

					this.setSize(this.renderTargetA.width, this.renderTargetA.height);
				}
			});
		}

		new TextureLoader().load('https://viewer.shapediver.com/v3/graphics/LDR_RGBA_0.png', blueNoiseTexture => {
			blueNoiseTexture.minFilter = NearestFilter;
			blueNoiseTexture.magFilter = NearestFilter;
			blueNoiseTexture.wrapS = RepeatWrapping;
			blueNoiseTexture.wrapT = RepeatWrapping;
			blueNoiseTexture.colorSpace = NoColorSpace;

			(this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseTexture.value = blueNoiseTexture;
		});
	}

	// #endregion Constructors (1)

	// #region Public Accessors (1)

	public get texture() {
		return this.renderTargetB.texture;
	}

	// #endregion Public Accessors (1)

	// #region Public Methods (4)

	public generateDenoiseSamples(numSamples: number, numRings: number, r: number, texelSize: Vector2) {

		const angleStep = (2 * Math.PI * numRings) / numSamples;
		const invNumSamples = 1.0 / numSamples;
		const radiusStep = invNumSamples;
		const samples = [];
		let radius = invNumSamples;
		let angle = 0;

		for (let i = 0; i < numSamples; i++) {
			const v = new Vector2(Math.cos(angle), Math.sin(angle))
				.multiplyScalar(Math.pow(radius, 0.75))
				.multiply(texelSize)
				.multiplyScalar(r);

			samples.push(v);
			radius += radiusStep;
			angle += angleStep;
		}
		console.log("DEBUG OUTPUT: Poission Disk", samples, numSamples, numRings, r, texelSize);

		return samples;
	}

	public generatePoissonDiskConstant(poissonDisk: Vector2[]) {
		const samples = poissonDisk.length;

		let glslCode = 'const vec2 poissonDisk[samples] = vec2[samples](\n';

		for (let i = 0; i < samples; i++) {
			const sample = poissonDisk[i];
			glslCode += `    vec2(${sample.x}, ${sample.y})`;

			if (i < samples - 1) {
				glslCode += ',';
			}

			glslCode += '\n';
		}

		glslCode += ');';

		return glslCode;
	}

	public render(renderer: WebGLRenderer) {
		(this.fullscreenMaterial as ShaderMaterial).uniforms.index.value = 0;

		const noiseTexture = (this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseTexture.value;
		if (noiseTexture) {
			const { width, height } = (noiseTexture as Texture).source.data;

			(this.fullscreenMaterial as ShaderMaterial).uniforms.blueNoiseRepeat.value.set(
				this.renderTargetA.width / width,
				this.renderTargetA.height / height
			);
		}

		for (let i = 0; i < 2 * this.iterations; i++) {
			const horizontal = i % 2 === 0;

			const inputRenderTarget = horizontal ? this.renderTargetB : this.renderTargetA;
			(this.fullscreenMaterial as ShaderMaterial).uniforms['inputTexture'].value = i === 0 ? this.inputTexture : inputRenderTarget.texture;

			const renderTarget = horizontal ? this.renderTargetA : this.renderTargetB;

			renderer.setRenderTarget(renderTarget);
			renderer.render(this.scene, this.camera);

			(this.fullscreenMaterial as ShaderMaterial).uniforms.index.value = ((this.fullscreenMaterial as ShaderMaterial).uniforms.index.value + 1) % 4;
		}
	}

	public setSize(width: number, height: number) {
		this.renderTargetA.setSize(width, height);
		this.renderTargetB.setSize(width, height);

		(this.fullscreenMaterial as ShaderMaterial).uniforms.resolution.value.set(width, height);

		const poissonDisk = this.generateDenoiseSamples(
			this.samples,
			this.rings,
			this.radius,
			new Vector2(1 / width, 1 / height)
		);

		const sampleDefine = `const int samples = ${this.samples};\n`;

		const poissonDiskConstant = this.generatePoissonDiskConstant(poissonDisk);

		(this.fullscreenMaterial as ShaderMaterial).fragmentShader = sampleDefine + poissonDiskConstant + '\n' + finalFragmentShader;
		(this.fullscreenMaterial as ShaderMaterial).needsUpdate = true;
	}

	// #endregion Public Methods (4)
}
