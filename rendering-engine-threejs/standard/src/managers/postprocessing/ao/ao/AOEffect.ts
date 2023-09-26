import { Effect, EffectComposer, NormalPass } from 'postprocessing';
import { Camera, Color, Scene, ShaderMaterial, Uniform, WebGLRenderer } from 'three';
import { PoissionDenoisePass } from '../poissionDenoise/PoissionDenoisePass';
import { AOPass } from './AOPass';
import { ao_compose } from './shader/ao_compose';

const defaultAOOptions = {
	resolutionScale: 1,
	spp: 8,
	distancePower: 1,
	power: 2,
	bias: 40,
	thickness: 0.075,
	color: new Color('black'),
	useNormalPass: false,
	velocityDepthNormalPass: null,
	...PoissionDenoisePass.DefaultOptions
};

class AOEffect extends Effect {
	// #region Properties (7)

	public static DefaultOptions = defaultAOOptions;

	public aoPass: AOPass;
	public composer: EffectComposer;
	public lastSize = { width: 0, height: 0, resolutionScale: 0 };
	normalPass?: NormalPass;
	public poissionDenoisePass: PoissionDenoisePass;
	public resolutionScale = 1;

	// #endregion Properties (7)

	// #region Constructors (1)

	constructor(composer: EffectComposer, camera: Camera, scene: Scene, aoPass: AOPass, options: { [key: string]: unknown } = defaultAOOptions) {
		super('AOEffect', ao_compose, {
			uniforms: new Map([
				['inputTexture', new Uniform(null)],
				['depthTexture', new Uniform(null)],
				['power', (new Uniform(0) as Uniform)],
				['color', new Uniform(new Color('black'))]
			])
		});

		this.composer = composer;
		this.aoPass = aoPass;
		options = { ...defaultAOOptions, ...options };

		// set up depth texture
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (!(composer as any).depthTexture) (composer as any).createDepthTexture();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.aoPass.fullscreenMaterial as ShaderMaterial).uniforms.depthTexture.value = (composer as any).depthTexture;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.uniforms.get('depthTexture')!.value = (composer as any).depthTexture;

		// set up optional normal texture
		if (options.useNormalPass || options.normalTexture) {
			if (options.useNormalPass) this.normalPass = new NormalPass(scene, camera);

			const normalTexture = options.normalTexture ?? this.normalPass?.texture;

			(this.aoPass.fullscreenMaterial as ShaderMaterial).uniforms.normalTexture.value = normalTexture;
			(this.aoPass.fullscreenMaterial as ShaderMaterial).defines.useNormalTexture = '';
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.poissionDenoisePass = new PoissionDenoisePass(camera, this.aoPass.texture, (composer as any).depthTexture);

		this.makeOptionsReactive(options);
	}

	// #endregion Constructors (1)

	// #region Public Methods (3)

	public makeOptionsReactive(options: { [key: string]: unknown }) {
		for (const key of Object.keys(options)) {
			Object.defineProperty(this, key, {
				get() {
					return options[key];
				},
				set(value) {
					if (value === null || value === undefined) return;

					options[key] = value;

					switch (key) {
						case 'spp':
							(this.aoPass.fullscreenMaterial as ShaderMaterial).defines.spp = value.toFixed(0);

							(this.aoPass.fullscreenMaterial as ShaderMaterial).needsUpdate = true;
							break;

						case 'distance':
							(this.aoPass.fullscreenMaterial as ShaderMaterial).uniforms.aoDistance.value = value;
							this.poissionDenoisePass.fullscreenMaterial.uniforms['distance'].value = Math.max(value, 0.0001);
							break;

						case 'resolutionScale':
							this.setSize(this.lastSize.width, this.lastSize.height);
							break;

						case 'power':
							this.uniforms.get('power').value = value;
							break;

						case 'color':
							this.uniforms.get('color').value.copy(new Color(value));
							break;

						// denoiser
						case 'iterations':
						case 'radius':
						case 'rings':
						case 'samples':
							this.poissionDenoisePass[key] = value;
							break;

						case 'lumaPhi':
						case 'depthPhi':
						case 'normalPhi':
							this.poissionDenoisePass.fullscreenMaterial.uniforms[key].value = Math.max(value, 0.0001);
							break;

						default:
							if (key in (this.aoPass.fullscreenMaterial as ShaderMaterial).uniforms) {
								(this.aoPass.fullscreenMaterial as ShaderMaterial).uniforms[key].value = value;
							}
					}
				},
				configurable: true
			});

			// apply all uniforms and defines
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(this as any)[key] = options[key];
		}
	}

	public setSize(width: number, height: number) {
		if (width === undefined || height === undefined) return;
		if (
			width === this.lastSize.width &&
			height === this.lastSize.height &&
			this.resolutionScale === this.lastSize.resolutionScale
		) {
			return;
		}

		this.normalPass?.setSize(width, height);
		this.aoPass.setSize(width * this.resolutionScale, height * this.resolutionScale);

		this.poissionDenoisePass.setSize(width, height);

		this.lastSize = {
			width,
			height,
			resolutionScale: this.resolutionScale
		};
	}

	public update(renderer: WebGLRenderer) {
		if ('animatedNoise' in (this.aoPass.fullscreenMaterial as ShaderMaterial).defines) {
			delete (this.aoPass.fullscreenMaterial as ShaderMaterial).defines.animatedNoise;
			(this.aoPass.fullscreenMaterial as ShaderMaterial).needsUpdate = true;
		}

		// set input texture
		if (this.poissionDenoisePass.iterations > 0) {
			this.uniforms.get('inputTexture')!.value = this.poissionDenoisePass.texture;
		} else {
			this.uniforms.get('inputTexture')!.value = this.aoPass.texture;
		}

		this.normalPass?.render(renderer, null, null);
		this.aoPass.render(renderer);

		this.poissionDenoisePass.render(renderer);
	}

	// #endregion Public Methods (3)
}

export { AOEffect };
