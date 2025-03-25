// Helper for passes that need to fill the viewport with a single quad.

import {
	BufferGeometry,
	Float32BufferAttribute,
	Material,
	Mesh,
	OrthographicCamera,
	WebGLRenderer,
} from "three";

const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

// https://github.com/mrdoob/three.js/pull/21358

const _geometry = new BufferGeometry();
_geometry.setAttribute(
	"position",
	new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3),
);
_geometry.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));

export class FullScreenQuad {
	_mesh: Mesh;

	constructor(material: Material) {
		this._mesh = new Mesh(_geometry, material);
	}

	dispose() {
		this._mesh.geometry.dispose();
	}

	render(renderer: WebGLRenderer) {
		renderer.render(this._mesh, _camera);
	}

	get material() {
		return this._mesh.material;
	}

	set material(value) {
		this._mesh.material = value;
	}
}
