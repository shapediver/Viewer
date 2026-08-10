import {AnimationFrameEngine} from "@shapediver/viewer.rendering-engine.animation-frame-engine";
import {GeometryData} from "@shapediver/viewer.shared.node-tree";
import {
	FLAG_TYPE,
	type Color,
	type IPulseEffectDefinition,
} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {type RenderingEngine} from "../RenderingEngine";

type GeometryType =
	| THREE.Mesh
	| THREE.Line
	| THREE.Points
	| THREE.LineSegments
	| THREE.LineLoop;

/** Applies and animates material pulse effects for rendered geometry objects. */
export class PulseEffectManager {
	private readonly _animationFrameEngine = AnimationFrameEngine.instance;
	private _animationFrameToken?: string;
	private _continuousRenderingToken?: string;
	private readonly _pulsedObjects = new Map<
		GeometryType,
		{
			baseEmissive: THREE.Color;
			baseEmissiveIntensity: number;
			baseOpacity?: number;
			baseMaterial: THREE.Material;
			color: THREE.Color;
			colorDefinition?: Color;
			effect: IPulseEffectDefinition;
			material: THREE.Material & {
				emissive: THREE.Color;
				emissiveIntensity: number;
				opacity?: number;
			};
		}
	>();

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	public update(
		geometry: GeometryData,
		objects: Iterable<GeometryType>,
	): void {
		const effect =
			geometry.effectPulses[geometry.effectPulses.length - 1]?.effect;
		for (const object of objects) {
			this.clear(object);
			if (!effect || object instanceof THREE.InstancedMesh) continue;
			const source = object.material;
			if (
				Array.isArray(source) ||
				!("emissive" in source) ||
				!("emissiveIntensity" in source)
			)
				continue;

			const material = source.clone() as THREE.Material & {
				emissive: THREE.Color;
				emissiveIntensity: number;
			};
			object.material = material;
			this._pulsedObjects.set(object, {
				baseEmissive: material.emissive.clone(),
				baseEmissiveIntensity: material.emissiveIntensity,
				baseOpacity:
					material.transparent && "opacity" in material
						? material.opacity
						: undefined,
				baseMaterial: source,
				color: this._renderingEngine.createThreeJsColor(
					effect.color ?? "#00ff78",
				),
				colorDefinition: effect.color,
				effect,
				material,
			});
		}
		this.updateAnimation();
	}

	public clear(object: GeometryType): void {
		const current = this._pulsedObjects.get(object);
		if (!current) return;
		if (object.material === current.material)
			object.material = current.baseMaterial;
		current.material.dispose();
		this._pulsedObjects.delete(object);
	}

	/** Restore an object's original material when it leaves the scene. */
	public remove(object: GeometryType): void {
		this.clear(object);
		this.updateAnimation();
	}

	public dispose(): void {
		for (const object of this._pulsedObjects.keys()) this.clear(object);
		this.updateAnimation();
	}

	private updateAnimation(): void {
		if (this._pulsedObjects.size === 0) {
			if (this._animationFrameToken)
				this._animationFrameEngine.removeAnimationFrameCallback(
					this._animationFrameToken,
				);
			if (this._continuousRenderingToken)
				this._renderingEngine.removeFlag(
					this._continuousRenderingToken,
				);
			this._animationFrameToken = undefined;
			this._continuousRenderingToken = undefined;
			return;
		}
		if (!this._continuousRenderingToken)
			this._continuousRenderingToken = this._renderingEngine.addFlag(
				FLAG_TYPE.CONTINUOUS_RENDERING,
			);
		if (!this._animationFrameToken)
			this._animationFrameToken =
				this._animationFrameEngine.addAnimationFrameCallback((time) =>
					this.animate(time),
				);
	}

	private animate(time: number): void {
		for (const pulse of this._pulsedObjects.values()) {
			const phase =
				(time / 1000) * (pulse.effect.pulseSpeed ?? 1.4) * Math.PI * 2;
			const intensity =
				(pulse.effect.intensity ?? 0.3) * ((Math.sin(phase) + 1) / 2);
			if (pulse.colorDefinition !== pulse.effect.color) {
				pulse.color = this._renderingEngine.createThreeJsColor(
					pulse.effect.color ?? "#00ff78",
				);
				pulse.colorDefinition = pulse.effect.color;
			}
			pulse.material.emissive.setRGB(
				Math.min(1, pulse.baseEmissive.r + pulse.color.r * intensity),
				Math.min(1, pulse.baseEmissive.g + pulse.color.g * intensity),
				Math.min(1, pulse.baseEmissive.b + pulse.color.b * intensity),
			);
			pulse.material.emissiveIntensity = Math.max(
				pulse.baseEmissiveIntensity,
				1,
			);
			if (pulse.baseOpacity !== undefined)
				pulse.material.opacity =
					1 -
					(1 - pulse.baseOpacity) *
						(1 - THREE.MathUtils.clamp(intensity, 0, 1)) ** 2;
		}
	}
}
