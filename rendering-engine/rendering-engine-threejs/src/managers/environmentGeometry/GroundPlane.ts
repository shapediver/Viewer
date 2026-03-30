import {MaterialStandardData} from "@shapediver/viewer.shared.node-tree";
import {Converter} from "@shapediver/viewer.shared.services";
import {Color, MATERIAL_SIDE} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {RenderingEngine} from "../..";
import {SDObject} from "../../objects/SDObject";
import {IEnvironmentGeometry} from "./IEnvironmentGeometry";

export class GroundPlane implements IEnvironmentGeometry {
	// #region Properties (4)

	private readonly _converter: Converter = Converter.instance;

	private _color: Color = "#d3d3d3ff";
	private _groundPlane!: THREE.Mesh;
	private _groundPlaneObject!: SDObject;

	// #endregion Properties (4)

	// #region Constructors (1)

	constructor(
		private readonly _renderingEngine: RenderingEngine,
		private readonly _parent: SDObject,
	) {
		this._groundPlaneObject = new SDObject("groundPlane", "");
		const mat = new MaterialStandardData();
		mat.color = this._color;
		mat.side = MATERIAL_SIDE.FRONT;
		mat.opacity = this._converter.toAlpha(this._color);
		mat.roughness = 1;
		mat.metalness = 0;
		this._groundPlane = new THREE.Mesh(
			new THREE.PlaneGeometry(),
			this._renderingEngine.materialLoader.load(mat),
		);
		this._groundPlane.receiveShadow = true;
		this._groundPlane.visible = false;
		this._groundPlaneObject.add(this._groundPlane);
		this._parent.add(this._groundPlaneObject);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (4)

	public get color(): Color {
		return this._color;
	}

	public set color(value: Color) {
		this._color = value;
		this.assignGroundPlaneColor(value);
	}

	public get visible(): boolean {
		return this._groundPlane.visible;
	}

	public set visible(value: boolean) {
		this._groundPlane.visible = value;
	}

	// #endregion Public Getters And Setters (4)

	// #region Public Methods (2)

	public changeSceneExtents(
		position: vec3,
		divisions: number,
		gridExtents: number,
	): void {
		this._groundPlane.geometry = new THREE.PlaneGeometry(
			2 * gridExtents,
			2 * gridExtents,
			2,
			2,
		);
		this._groundPlane.position.set(position[0], position[1], position[2]);
	}

	public updatePosition(position: vec3): void {
		this._groundPlane.position.set(position[0], position[1], position[2]);
	}

	// #endregion Public Methods (2)

	// #region Private Methods (1)

	private assignGroundPlaneColor(color: Color) {
		(<THREE.MeshPhysicalMaterial>this._groundPlane.material).opacity =
			this._converter.toAlpha(color);
		(<THREE.MeshPhysicalMaterial>this._groundPlane.material).transparent =
			(<THREE.MeshPhysicalMaterial>this._groundPlane.material).opacity !==
			1;
		(<THREE.MeshPhysicalMaterial>this._groundPlane.material).depthWrite =
			!(<THREE.MeshPhysicalMaterial>this._groundPlane.material)
				.transparent;
		(<THREE.MeshPhysicalMaterial>this._groundPlane.material).color =
			this._renderingEngine.createThreeJsColor(color);
		(<THREE.MeshPhysicalMaterial>this._groundPlane.material).needsUpdate =
			true;
	}

	// #endregion Private Methods (1)
}
