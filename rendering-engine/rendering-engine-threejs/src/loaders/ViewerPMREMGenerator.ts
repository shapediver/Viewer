import * as THREE from "three";

/** The internals of THREE.PMREMGenerator (r184) that {@link ViewerPMREMGenerator.prepare} uses. */
export interface IPMREMGeneratorInternals {
	_renderer: THREE.WebGLRenderer;
	_blurMaterial: THREE.ShaderMaterial | null;
	_cubemapMaterial: THREE.ShaderMaterial | null;
	_equirectMaterial: THREE.ShaderMaterial | null;
	_ggxMaterial: THREE.ShaderMaterial | null;
	_pingPongRenderTarget: THREE.WebGLRenderTarget | null;
	_allocateTargets(): THREE.WebGLRenderTarget;
	_compileMaterial(material: THREE.Material): void;
	_setSize(cubeSize: number): void;
}

/** The part of a three.js WebGLProgram that tells whether its link is done. */
interface IProgramStatus {
	isReady(): boolean;
}

/** How often a pending program link is checked, in milliseconds. */
const POLL_INTERVAL = 5;

/**
 * A PMREM generator whose programs link in the background.
 *
 * three.js links the prefilter programs on their first draw and waits for the
 * driver there. With KHR_parallel_shader_compile, {@link prepare} starts that
 * link early, in the variant the prefilter draws with (into a render target),
 * and resolves once the driver is done, so that the prefilter itself does not
 * wait. The programs are kept until {@link dispose}: dispose the generator
 * only when the viewport closes, not after each map.
 *
 * It relies on internals of THREE.PMREMGenerator. Where they are missing (a
 * three.js upgrade renamed them) or the extension is missing, {@link prepare}
 * resolves at once and the programs link on first use, as in three.js.
 */
export class ViewerPMREMGenerator extends THREE.PMREMGenerator {
	// #region Properties (4)

	private readonly _rejects = new Set<(error: Error) => void>();
	private readonly _timers = new Set<ReturnType<typeof setTimeout>>();

	private _compileTarget?: THREE.WebGLRenderTarget;
	private _disposed = false;

	// #endregion Properties (4)

	// #region Public Methods (3)

	/**
	 * Dispose the generator and its programs, and stop pending links.
	 * Promises of {@link prepare} that are still pending reject.
	 */
	public dispose(): void {
		this._disposed = true;
		this._timers.forEach((timer) => clearTimeout(timer));
		this._timers.clear();
		const rejects = [...this._rejects];
		this._rejects.clear();
		rejects.forEach((reject) =>
			reject(new Error("The PMREM generator was disposed.")),
		);
		this._compileTarget?.dispose();
		this._compileTarget = undefined;
		super.dispose();
	}

	/**
	 * Start linking the programs that fromEquirectangular or fromCubemap need
	 * for a cube face size, in the render-target variant they draw with.
	 * Resolves when they are ready, without the extension at once.
	 * Rejects when the generator is disposed meanwhile.
	 *
	 * @param cubeSize the cube face size; for an equirectangular map a quarter of its width
	 * @param source the kind of map that is prefiltered
	 */
	public prepare(
		cubeSize: number,
		source: "equirect" | "cubemap",
	): Promise<void> {
		if (this._disposed)
			return Promise.reject(
				new Error("The PMREM generator was disposed."),
			);
		if (!this.supported()) return Promise.resolve();

		const internals = this as unknown as IPMREMGeneratorInternals;
		const renderer = internals._renderer;

		const target = renderer.getRenderTarget();
		const activeCubeFace = renderer.getActiveCubeFace();
		const activeMipmapLevel = renderer.getActiveMipmapLevel();
		const materials: THREE.Material[] = [];
		try {
			// creates the filter materials for this size, or keeps them if the size is the same
			internals._setSize(cubeSize);
			internals._allocateTargets().dispose();

			// a bound render target gives the variant the prefilter draws with:
			// linear output, no tone mapping
			if (!this._compileTarget)
				this._compileTarget = new THREE.WebGLRenderTarget(1, 1);
			renderer.setRenderTarget(this._compileTarget);

			// the source materials are created by three.js only through these methods
			if (source === "equirect") {
				if (internals._equirectMaterial === null)
					this.compileEquirectangularShader();
				materials.push(internals._equirectMaterial!);
			} else {
				if (internals._cubemapMaterial === null)
					this.compileCubemapShader();
				materials.push(internals._cubemapMaterial!);
			}
			// six-image maps are prefiltered by three.js itself, always with GGX
			const filterMaterial =
				source === "cubemap"
					? internals._ggxMaterial
					: this.filterMaterial(internals);
			if (filterMaterial) materials.push(filterMaterial);

			// a program that exists already is only looked up
			materials.forEach((material) =>
				internals._compileMaterial(material),
			);
		} catch {
			// the programs link on first use, as in three.js
			return Promise.resolve();
		} finally {
			renderer.setRenderTarget(target, activeCubeFace, activeMipmapLevel);
		}

		return this.waitForPrograms(materials);
	}

	/**
	 * Free the GPU memory of the intermediate render target after a prefilter.
	 * The materials and programs stay. three.js allocates the target again on
	 * its next use.
	 */
	public releaseTargets(): void {
		(
			this as unknown as IPMREMGeneratorInternals
		)._pingPongRenderTarget?.dispose();
	}

	// #endregion Public Methods (3)

	// #region Protected Methods (1)

	/** The material that fills the blurred levels of an equirectangular map. */
	protected filterMaterial(
		internals: IPMREMGeneratorInternals,
	): THREE.ShaderMaterial | null {
		return internals._ggxMaterial;
	}

	// #endregion Protected Methods (1)

	// #region Private Methods (2)

	/** Whether the internals and the extension that {@link prepare} needs exist. */
	private supported(): boolean {
		const internals = this as unknown as IPMREMGeneratorInternals;
		return (
			typeof internals._setSize === "function" &&
			typeof internals._allocateTargets === "function" &&
			typeof internals._compileMaterial === "function" &&
			"_ggxMaterial" in internals &&
			"_blurMaterial" in internals &&
			"_equirectMaterial" in internals &&
			"_cubemapMaterial" in internals &&
			"_pingPongRenderTarget" in internals &&
			!!internals._renderer &&
			internals._renderer.extensions.has("KHR_parallel_shader_compile")
		);
	}

	private waitForPrograms(materials: THREE.Material[]): Promise<void> {
		const properties = (this as unknown as IPMREMGeneratorInternals)
			._renderer.properties;
		const programs = (): IProgramStatus[] =>
			materials
				.map(
					(material) =>
						(
							properties.get(material) as {
								currentProgram?: IProgramStatus;
							}
						).currentProgram,
				)
				// a material that was replaced meanwhile (another size) has no
				// program any more; its replacement links on first use
				.filter((program): program is IProgramStatus => !!program);

		return new Promise<void>((resolve, reject) => {
			this._rejects.add(reject);
			const check = () => {
				if (this._disposed) return;
				if (
					// timers of a hidden page run once a second or less: link on
					// first use there, as in three.js, instead of waiting for them
					(typeof document !== "undefined" &&
						document.visibilityState === "hidden") ||
					programs().every((program) => program.isReady())
				) {
					this._rejects.delete(reject);
					resolve();
					return;
				}
				const timer = setTimeout(() => {
					this._timers.delete(timer);
					check();
				}, POLL_INTERVAL);
				this._timers.add(timer);
			};
			check();
		});
	}

	// #endregion Private Methods (2)
}
