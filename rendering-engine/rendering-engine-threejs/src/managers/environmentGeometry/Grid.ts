import {Converter} from "@shapediver/viewer.shared.services";
import {Color} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {RenderingEngine} from "../..";
import {SDData} from "../../objects/SDData";
import {SDObject} from "../../objects/SDObject";
import {IEnvironmentGeometry} from "./IEnvironmentGeometry";

export class Grid implements IEnvironmentGeometry {
	// #region Properties (5)

	private readonly _converter: Converter = Converter.instance;

	private _grid!: THREE.GridHelper;
	private _color: Color = "#44444426";
	private _gridObject!: SDData;

	// #endregion Properties (5)

	// #region Constructors (1)

	constructor(
		private readonly _renderingEngine: RenderingEngine,
		private readonly _parent: SDObject,
	) {
		this._gridObject = new SDData("grid", "");
		this._grid = new THREE.GridHelper();
		(<THREE.LineBasicMaterial>this._grid.material).opacity =
			typeof this._color == "string" && this._color.length <= 8
				? 0.15
				: this._converter.toAlpha(this._color);
		(<THREE.LineBasicMaterial>this._grid.material).transparent =
			(<THREE.LineBasicMaterial>this._grid.material).opacity !== 1;
		(<THREE.LineBasicMaterial>this._grid.material).color =
			this._renderingEngine.createThreeJsColor(this._color);
		this._grid.rotateX(Math.PI / 2);
		this._grid.visible = false;
		this._gridObject.add(this._grid);
		this._parent.add(this._gridObject);
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (3)

	public get color(): Color {
		return this._color;
	}

	public set color(value: Color) {
		this._color = value;
		(<THREE.LineBasicMaterial>this._grid.material).opacity =
			typeof this._color == "string" && this._color.length <= 8
				? 0.15
				: this._converter.toAlpha(this._color);
		(<THREE.LineBasicMaterial>this._grid.material).transparent =
			(<THREE.LineBasicMaterial>this._grid.material).opacity !== 1;
		(<THREE.LineBasicMaterial>this._grid.material).color =
			this._renderingEngine.createThreeJsColor(this._color);
		(<THREE.LineBasicMaterial>this._grid.material).needsUpdate = true;
	}

	public get visible(): boolean {
		return this._grid.visible;
	}

	public set visible(value: boolean) {
		this._grid.visible = value;
	}

	// #endregion Public Getters And Setters (3)

	// #region Public Methods (3)

	public changeSceneExtents(
		position: vec3,
		divisions: number,
		gridExtents: number,
	): void {
		this._gridObject.remove(this._grid);
		this._grid = new THREE.GridHelper(2 * gridExtents, divisions);
		(<THREE.LineBasicMaterial>this._grid.material).opacity =
			typeof this._color == "string" && this._color.length <= 8
				? 0.15
				: this._converter.toAlpha(this._color);
		(<THREE.LineBasicMaterial>this._grid.material).transparent =
			(<THREE.LineBasicMaterial>this._grid.material).opacity !== 1;
		(<THREE.LineBasicMaterial>this._grid.material).color =
			this._renderingEngine.createThreeJsColor(this._color);
		this._grid.rotateX(Math.PI / 2);
		this._grid.visible = this._renderingEngine.gridVisibility;
		this._gridObject.add(this._grid);

		this._grid.position.set(position[0], position[1], position[2]);
	}

	public updatePosition(position: vec3): void {
		if (this._grid)
			this._grid.position.set(position[0], position[1], position[2]);
	}

	// #endregion Public Methods (3)
}
