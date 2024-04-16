import { EffectComposer } from 'postprocessing';
import { Camera, Scene } from 'three';
import { AOEffect } from '../ao/AOEffect';

import { AOPass } from '../ao/AOPass';
import { hbao as fragmentShader } from './shader/hbao';
import { hbao_utils } from './shader/hbao_utils';

const finalFragmentShader = fragmentShader.replace('#include <hbao_utils>', hbao_utils);

class HBAOPass extends AOPass {
	// #region Constructors (1)

	constructor(camera: Camera, scene: Scene) {
		super(camera, scene, finalFragmentShader);
	}

	// #endregion Constructors (1)
}

class HBAOEffect extends AOEffect {
	// #region Properties (1)

	public lastSize = { width: 0, height: 0, resolutionScale: 0 };

	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(composer: EffectComposer, camera: Camera, scene: Scene, options: { [key: string]: unknown } = AOEffect.DefaultOptions) {
		super(composer, camera, scene, new HBAOPass(camera, scene), {
			...AOEffect.DefaultOptions,
			...HBAOEffect.DefaultOptions,
			...options
		});
	}

	// #endregion Constructors (1)
}

export { HBAOEffect };
