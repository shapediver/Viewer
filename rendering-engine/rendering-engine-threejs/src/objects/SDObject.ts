import {ISDObject} from "@shapediver/viewer.rendering-engine.rendering-engine";
import {mat4} from "gl-matrix";
import * as THREE from "three";
import {Object3D} from "three";

export enum SD_DATA_TYPE {
	GEOMETRY = "geometry",
	MATERIAL = "material",
	THREEJS = "threejs",
	LIGHT = "light",
	CAMERA = "camera",
	ANIMATION = "animation",
	INTERACTION = "interaction",
	HTML_ELEMENT_ANCHOR = "html_element_anchor",
	CUSTOM = "custom",
	OBJECT = "object",
}

export class SDObject extends Object3D implements ISDObject {
	// #region Constructors (1)

	#SDid: string;
	#SDversion: string;
	#SDtype: SD_DATA_TYPE;

	constructor(
		SDid: string,
		SDversion: string,
		type: SD_DATA_TYPE = SD_DATA_TYPE.OBJECT,
	) {
		super();
		this.#SDid = SDid;
		this.#SDversion = SDversion;
		this.#SDtype = type;
	}

	public applyTransformation(transformation: mat4): void {
		this.matrix.identity();
		this.matrixWorld.identity();
		this.position.set(0, 0, 0);
		this.scale.set(1, 1, 1);
		this.quaternion.set(0, 0, 0, 1);
		this.applyMatrix4(new THREE.Matrix4().fromArray(transformation));
	}

	// #endregion Constructors (1)

	// #region Public Accessors (4)

	public get SDid(): string {
		return this.#SDid;
	}

	public set SDid(value: string) {
		this.#SDid = value;
	}

	public get SDversion(): string {
		return this.#SDversion;
	}

	public set SDversion(value: string) {
		this.#SDversion = value;
	}

	public get SDtype(): SD_DATA_TYPE {
		return this.#SDtype;
	}

	public set SDtype(value: SD_DATA_TYPE) {
		this.#SDtype = value;
	}

	public cloneObject(): SDObject {
		const clone = this.clone();
		clone.SDid = this.SDid;
		clone.SDversion = this.SDversion;
		clone.SDtype = this.SDtype;
		return clone;
	}

	// #endregion Public Accessors (4)
}
