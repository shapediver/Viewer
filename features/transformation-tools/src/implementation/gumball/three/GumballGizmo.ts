import {SystemInfo} from "@shapediver/viewer.shared.services";

import {
	BoxGeometry,
	BufferGeometry,
	CylinderGeometry,
	Euler,
	Float32BufferAttribute,
	Line,
	LineBasicMaterial,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	OctahedronGeometry,
	OrthographicCamera,
	PerspectiveCamera,
	Quaternion,
	TorusGeometry,
	Vector3,
} from "three";

import {GumballControls, TransformationType} from "./GumballControls";

export class GumballGizmo extends Object3D {
	private _availablePicker: {
		translate: Object3D;
		rotate: Object3D;
		scale: Object3D;
	};
	private _enableRotation: boolean = true;
	private _enableRotationX: boolean = true;
	private _enableRotationXY: boolean = true;
	private _enableRotationXZ: boolean = true;
	private _enableRotationY: boolean = true;
	private _enableRotationYZ: boolean = true;
	private _enableRotationZ: boolean = true;
	private _enableScaling: boolean = true;
	private _enableScalingX: boolean = true;
	private _enableScalingXY: boolean = true;
	private _enableScalingXZ: boolean = true;
	private _enableScalingY: boolean = true;
	private _enableScalingYZ: boolean = true;
	private _enableScalingZ: boolean = true;
	private _enableTranslation: boolean = true;
	private _enableTranslationX: boolean = true;
	private _enableTranslationXY: boolean = true;
	private _enableTranslationXZ: boolean = true;
	private _enableTranslationY: boolean = true;
	private _enableTranslationYZ: boolean = true;
	private _enableTranslationZ: boolean = true;

	public gizmo: {
		translate: Object3D;
		rotate: Object3D;
		scale: Object3D;
	};
	public helper: {
		translate: Object3D;
		rotate: Object3D;
		scale: Object3D;
	};
	public isGumballGizmo: true;
	public picker: {
		translate: Object3D;
		rotate: Object3D;
		scale: Object3D;
	};
	public type: "GumballGizmo";

	constructor(readonly _gumballControls: GumballControls) {
		super();

		this.isGumballGizmo = true;

		this.type = "GumballGizmo";

		const isMobile = SystemInfo.instance.isMobile;
		const mobileFactorSingleAxis = isMobile ? 2 : 1;
		const mobileFactorMultiAxis = isMobile ? 1.5 : 1;

		// shared materials

		const gizmoMaterial = new MeshBasicMaterial({
			depthTest: false,
			depthWrite: false,
			fog: false,
			toneMapped: false,
			transparent: true,
		});

		const gizmoLineMaterial = new LineBasicMaterial({
			depthTest: false,
			depthWrite: false,
			fog: false,
			toneMapped: false,
			transparent: true,
		});

		// Make unique material for each axis/color

		const materialInvisible = gizmoMaterial.clone();
		materialInvisible.opacity = 0.15;
		const translationMaterialInvisible = materialInvisible.clone();
		const rotationMaterialInvisible = materialInvisible.clone();
		const scaleMaterialInvisible = materialInvisible.clone();

		const materialHelper = gizmoLineMaterial.clone();
		materialHelper.opacity = 0.5;
		const translationMaterialHelper = materialHelper.clone();
		const rotationMaterialHelper = materialHelper.clone();
		const scaleMaterialHelper = materialHelper.clone();

		const materialRed = gizmoMaterial.clone();
		materialRed.color.setHex(0xff0000);
		const translationMaterialRed = materialRed.clone();
		const rotationMaterialRed = materialRed.clone();
		const scaleMaterialRed = materialRed.clone();

		const materialGreen = gizmoMaterial.clone();
		materialGreen.color.setHex(0x00ff00);
		const translationMaterialGreen = materialGreen.clone();
		const rotationMaterialGreen = materialGreen.clone();
		const scaleMaterialGreen = materialGreen.clone();

		const materialBlue = gizmoMaterial.clone();
		materialBlue.color.setHex(0x0000ff);
		const translationMaterialBlue = materialBlue.clone();
		const rotationMaterialBlue = materialBlue.clone();
		const scaleMaterialBlue = materialBlue.clone();

		const materialRedTransparent = gizmoMaterial.clone();
		materialRedTransparent.color.setHex(0xff0000);
		materialRedTransparent.opacity = 0.5;
		const translationMaterialRedTransparent =
			materialRedTransparent.clone();
		const scaleMaterialRedTransparent = materialRedTransparent.clone();

		const materialGreenTransparent = gizmoMaterial.clone();
		materialGreenTransparent.color.setHex(0x00ff00);
		materialGreenTransparent.opacity = 0.5;
		const translationMaterialGreenTransparent =
			materialGreenTransparent.clone();
		const scaleMaterialGreenTransparent = materialGreenTransparent.clone();

		const materialBlueTransparent = gizmoMaterial.clone();
		materialBlueTransparent.color.setHex(0x0000ff);
		materialBlueTransparent.opacity = 0.5;
		const translationMaterialBlueTransparent =
			materialBlueTransparent.clone();
		const scaleMaterialBlueTransparent = materialBlueTransparent.clone();

		const materialWhiteTransparent = gizmoMaterial.clone();
		materialWhiteTransparent.opacity = 0.25;
		const translationMaterialWhiteTransparent =
			materialWhiteTransparent.clone();
		const scaleMaterialWhiteTransparent = materialWhiteTransparent.clone();

		const materialYellowTransparent = gizmoMaterial.clone();
		materialYellowTransparent.color.setHex(0xffff00);
		materialYellowTransparent.opacity = 0.25;
		const rotationMaterialYellowTransparent =
			materialYellowTransparent.clone();

		const materialGray = gizmoMaterial.clone();
		materialGray.color.setHex(0x787878);
		const rotationMaterialGray = materialGray.clone();

		// reusable geometry

		const arrowGeo = new CylinderGeometry(0, 0.04, 0.1, 12);
		arrowGeo.translate(0, 0.05, 0);
		const translationArrowGeometry = arrowGeo.clone();

		const scaleHandleGeometry = new BoxGeometry(0.08, 0.08, 0.08);
		scaleHandleGeometry.translate(0, 0.04, 0);

		const lineGeo = new BufferGeometry();
		lineGeo.setAttribute(
			"position",
			new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3),
		);
		const translationLineGeometry = lineGeo.clone();
		const scaleLineGeometry = lineGeo.clone();
		const rotationLineGeometry = lineGeo.clone();

		const lineGeo2 = new CylinderGeometry(0.0075, 0.0075, 0.5, 3);
		lineGeo2.translate(0, 0.25, 0);
		const translationLineGeometry2 = lineGeo2.clone();

		function CircleGeometry(radius: number, arc: number) {
			const geometry = new TorusGeometry(
				radius,
				0.0075,
				3,
				64,
				arc * Math.PI * 2,
			);
			geometry.rotateY(Math.PI / 2);
			geometry.rotateX(Math.PI / 2);
			return geometry;
		}

		// Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position

		function TranslateHelperGeometry() {
			const geometry = new BufferGeometry();

			geometry.setAttribute(
				"position",
				new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3),
			);

			return geometry;
		}

		// Gizmo definitions - custom hierarchy definitions for setupGizmo() function
		// this has to be typed separately because TypeScript type inference can't infer type from array of arrays
		type GizmoMap = {
			[key: string]: (
				| [
						Mesh | Line,
						[number, number, number] | null,
						[number, number, number] | null,
						[number, number, number] | null,
						string | null,
				  ]
				| [
						Mesh | Line,
						[number, number, number] | null,
						[number, number, number] | null,
						[number, number, number] | null,
				  ]
				| [
						Mesh | Line,
						[number, number, number] | null,
						[number, number, number] | null,
				  ]
				| [Mesh | Line, [number, number, number] | null]
				| [Mesh | Line]
			)[];
		};

		const gizmoTranslate: GizmoMap = {
			X: [
				[
					new Mesh(translationArrowGeometry, translationMaterialRed),
					[0.5, 0, 0],
					[0, 0, -Math.PI / 2],
				],
				// [new Mesh(translationArrowGeometry, translationMaterialRed), [- 0.5, 0, 0], [0, 0, Math.PI / 2]],
				[
					new Mesh(translationLineGeometry2, translationMaterialRed),
					[0, 0, 0],
					[0, 0, -Math.PI / 2],
				],
			],
			Y: [
				[
					new Mesh(
						translationArrowGeometry,
						translationMaterialGreen,
					),
					[0, 0.5, 0],
				],
				// [new Mesh(translationArrowGeometry, translationMaterialGreen), [0, - 0.5, 0], [Math.PI, 0, 0]],
				[new Mesh(translationLineGeometry2, translationMaterialGreen)],
			],
			Z: [
				[
					new Mesh(translationArrowGeometry, translationMaterialBlue),
					[0, 0, 0.5],
					[Math.PI / 2, 0, 0],
				],
				// [new Mesh(translationArrowGeometry, translationMaterialBlue), [0, 0, - 0.5], [- Math.PI / 2, 0, 0]],
				[
					new Mesh(translationLineGeometry2, translationMaterialBlue),
					null,
					[Math.PI / 2, 0, 0],
				],
			],
			XYZ: [
				[
					new Mesh(
						new OctahedronGeometry(0.1, 0),
						translationMaterialWhiteTransparent.clone(),
					),
					[0, 0, 0],
				],
			],
			XY: [
				[
					new Mesh(
						new BoxGeometry(0.15, 0.15, 0.01),
						translationMaterialBlueTransparent.clone(),
					),
					[
						0.25 * mobileFactorMultiAxis,
						0.25 * mobileFactorMultiAxis,
						0,
					],
				],
			],
			YZ: [
				[
					new Mesh(
						new BoxGeometry(0.15, 0.15, 0.01),
						translationMaterialRedTransparent.clone(),
					),
					[
						0,
						0.25 * mobileFactorMultiAxis,
						0.25 * mobileFactorMultiAxis,
					],
					[0, Math.PI / 2, 0],
				],
			],
			XZ: [
				[
					new Mesh(
						new BoxGeometry(0.15, 0.15, 0.01),
						translationMaterialGreenTransparent.clone(),
					),
					[
						0.25 * mobileFactorMultiAxis,
						0,
						0.25 * mobileFactorMultiAxis,
					],
					[-Math.PI / 2, 0, 0],
				],
			],
		};

		const pickerTranslate: GizmoMap = {
			X: [
				[
					new Mesh(
						new CylinderGeometry(
							0.15 * mobileFactorSingleAxis,
							0.15 * mobileFactorSingleAxis,
							0.6,
							4,
						),
						translationMaterialInvisible,
					),
					[0.3, 0, 0],
					[0, 0, -Math.PI / 2],
				],
				// [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [- 0.3, 0, 0], [0, 0, Math.PI / 2]]
			],
			Y: [
				[
					new Mesh(
						new CylinderGeometry(
							0.15 * mobileFactorSingleAxis,
							0.15 * mobileFactorSingleAxis,
							0.6,
							4,
						),
						translationMaterialInvisible,
					),
					[0, 0.3, 0],
				],
				// [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [0, - 0.3, 0], [0, 0, Math.PI]]
			],
			Z: [
				[
					new Mesh(
						new CylinderGeometry(
							0.15 * mobileFactorSingleAxis,
							0.15 * mobileFactorSingleAxis,
							0.6,
							4,
						),
						translationMaterialInvisible,
					),
					[0, 0, 0.3],
					[Math.PI / 2, 0, 0],
				],
				// [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), translationMaterialInvisible), [0, 0, - 0.3], [- Math.PI / 2, 0, 0]]
			],
			XYZ: [
				[
					new Mesh(
						new OctahedronGeometry(0.2, 0),
						translationMaterialInvisible,
					),
				],
			],
			XY: [
				[
					new Mesh(
						new BoxGeometry(
							0.2 * mobileFactorMultiAxis,
							0.2 * mobileFactorMultiAxis,
							0.01 * mobileFactorMultiAxis,
						),
						translationMaterialInvisible,
					),
					[
						0.25 * mobileFactorMultiAxis,
						0.25 * mobileFactorMultiAxis,
						0,
					],
				],
			],
			YZ: [
				[
					new Mesh(
						new BoxGeometry(
							0.2 * mobileFactorMultiAxis,
							0.2 * mobileFactorMultiAxis,
							0.01 * mobileFactorMultiAxis,
						),
						translationMaterialInvisible,
					),
					[
						0,
						0.25 * mobileFactorMultiAxis,
						0.25 * mobileFactorMultiAxis,
					],
					[0, Math.PI / 2, 0],
				],
			],
			XZ: [
				[
					new Mesh(
						new BoxGeometry(
							0.2 * mobileFactorMultiAxis,
							0.2 * mobileFactorMultiAxis,
							0.01 * mobileFactorMultiAxis,
						),
						translationMaterialInvisible,
					),
					[
						0.25 * mobileFactorMultiAxis,
						0,
						0.25 * mobileFactorMultiAxis,
					],
					[-Math.PI / 2, 0, 0],
				],
			],
		};

		const helperTranslate: GizmoMap = {
			START: [
				[
					new Mesh(
						new OctahedronGeometry(0.01, 2),
						translationMaterialHelper,
					),
					null,
					null,
					null,
					"helper",
				],
			],
			END: [
				[
					new Mesh(
						new OctahedronGeometry(0.01, 2),
						translationMaterialHelper,
					),
					null,
					null,
					null,
					"helper",
				],
			],
			DELTA: [
				[
					new Line(
						TranslateHelperGeometry(),
						translationMaterialHelper,
					),
					null,
					null,
					null,
					"helper",
				],
			],
			X: [
				[
					new Line(
						translationLineGeometry,
						translationMaterialHelper.clone(),
					),
					[-1e3, 0, 0],
					null,
					[1e6, 1, 1],
					"helper",
				],
			],
			Y: [
				[
					new Line(
						translationLineGeometry,
						translationMaterialHelper.clone(),
					),
					[0, -1e3, 0],
					[0, 0, Math.PI / 2],
					[1e6, 1, 1],
					"helper",
				],
			],
			Z: [
				[
					new Line(
						translationLineGeometry,
						translationMaterialHelper.clone(),
					),
					[0, 0, -1e3],
					[0, -Math.PI / 2, 0],
					[1e6, 1, 1],
					"helper",
				],
			],
		};

		const rotationScale = 1.5;

		const gizmoRotate: GizmoMap = {
			// XYZE: [
			//     [new Mesh(CircleGeometry(0.5 * rotationScale, 1), rotationMaterialGray), null, [0, Math.PI / 2, 0]]
			// ],
			X: [
				[
					new Mesh(
						CircleGeometry(0.5 * rotationScale, 0.5),
						rotationMaterialRed,
					),
				],
			],
			Y: [
				[
					new Mesh(
						CircleGeometry(0.5 * rotationScale, 0.5),
						rotationMaterialGreen,
					),
					null,
					[0, 0, -Math.PI / 2],
				],
			],
			Z: [
				[
					new Mesh(
						CircleGeometry(0.5 * rotationScale, 0.5),
						rotationMaterialBlue,
					),
					null,
					[0, Math.PI / 2, 0],
				],
			],
			E: [
				[
					new Mesh(
						CircleGeometry(0.6 * rotationScale, 1),
						rotationMaterialYellowTransparent,
					),
					null,
					[0, Math.PI / 2, 0],
				],
			],
		};

		const helperRotate: GizmoMap = {
			AXIS: [
				[
					new Line(
						rotationLineGeometry,
						rotationMaterialHelper.clone(),
					),
					[-1e3, 0, 0],
					null,
					[1e6, 1, 1],
					"helper",
				],
			],
		};

		const pickerRotate: GizmoMap = {
			// XYZE: [
			//     [new Mesh(new SphereGeometry(0.25 * rotationScale, 10, 8), rotationMaterialInvisible)]
			// ],
			X: [
				[
					new Mesh(
						new TorusGeometry(
							0.5 * rotationScale,
							0.1 * mobileFactorSingleAxis,
							4,
							24,
						),
						rotationMaterialInvisible,
					),
					[0, 0, 0],
					[0, -Math.PI / 2, -Math.PI / 2],
				],
			],
			Y: [
				[
					new Mesh(
						new TorusGeometry(
							0.5 * rotationScale,
							0.1 * mobileFactorSingleAxis,
							4,
							24,
						),
						rotationMaterialInvisible,
					),
					[0, 0, 0],
					[Math.PI / 2, 0, 0],
				],
			],
			Z: [
				[
					new Mesh(
						new TorusGeometry(
							0.5 * rotationScale,
							0.1 * mobileFactorSingleAxis,
							4,
							24,
						),
						rotationMaterialInvisible,
					),
					[0, 0, 0],
					[0, 0, -Math.PI / 2],
				],
			],
			E: [
				[
					new Mesh(
						new TorusGeometry(0.6 * rotationScale, 0.1, 2, 24),
						rotationMaterialInvisible,
					),
				],
			],
		};

		const gizmoScale: GizmoMap = {
			X: [
				// [new Mesh(scaleHandleGeometry, scaleMaterialRed), [0.5, 0, 0], [0, 0, - Math.PI / 2]],
				// [new Mesh(scaleLineGeometry2, scaleMaterialRed), [0, 0, 0], [0, 0, - Math.PI / 2]],
				[
					new Mesh(scaleHandleGeometry, scaleMaterialRed),
					[-0.5, 0, 0],
					[0, 0, Math.PI / 2],
				],
			],
			Y: [
				// [new Mesh(scaleHandleGeometry, scaleMaterialGreen), [0, 0.5, 0]],
				// [new Mesh(scaleLineGeometry2, scaleMaterialGreen)],
				[
					new Mesh(scaleHandleGeometry, scaleMaterialGreen),
					[0, -0.5, 0],
					[0, 0, Math.PI],
				],
			],
			Z: [
				// [new Mesh(scaleHandleGeometry, scaleMaterialBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
				// [new Mesh(scaleLineGeometry2, scaleMaterialBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
				[
					new Mesh(scaleHandleGeometry, scaleMaterialBlue),
					[0, 0, -0.5],
					[-Math.PI / 2, 0, 0],
				],
			],
			XY: [
				[
					new Mesh(
						new BoxGeometry(-0.15, -0.15, 0.01),
						scaleMaterialBlueTransparent,
					),
					[
						-0.25 * mobileFactorMultiAxis,
						-0.25 * mobileFactorMultiAxis,
						0,
					],
				],
			],
			YZ: [
				[
					new Mesh(
						new BoxGeometry(-0.15, -0.15, 0.01),
						scaleMaterialRedTransparent,
					),
					[
						0,
						-0.25 * mobileFactorMultiAxis,
						-0.25 * mobileFactorMultiAxis,
					],
					[0, Math.PI / 2, 0],
				],
			],
			XZ: [
				[
					new Mesh(
						new BoxGeometry(-0.15, -0.15, 0.01),
						scaleMaterialGreenTransparent,
					),
					[
						-0.25 * mobileFactorMultiAxis,
						0,
						-0.25 * mobileFactorMultiAxis,
					],
					[-Math.PI / 2, 0, 0],
				],
			],
			// XYZ: [
			//     [new Mesh(new BoxGeometry(0.1, 0.1, 0.1), scaleMaterialWhiteTransparent.clone())],
			// ]
		};

		const pickerScale: GizmoMap = {
			X: [
				// [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0.3, 0, 0], [0, 0, - Math.PI / 2]],
				[
					new Mesh(
						new CylinderGeometry(
							0.15 * mobileFactorSingleAxis,
							0.15 * mobileFactorSingleAxis,
							0.6,
							4,
						),
						scaleMaterialInvisible,
					),
					[-0.3, 0, 0],
					[0, 0, Math.PI / 2],
				],
			],
			Y: [
				// [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0, 0.3, 0]],
				[
					new Mesh(
						new CylinderGeometry(
							0.15 * mobileFactorSingleAxis,
							0.15 * mobileFactorSingleAxis,
							0.6,
							4,
						),
						scaleMaterialInvisible,
					),
					[0, -0.3, 0],
					[0, 0, Math.PI],
				],
			],
			Z: [
				// [new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), scaleMaterialInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
				[
					new Mesh(
						new CylinderGeometry(
							0.15 * mobileFactorSingleAxis,
							0.15 * mobileFactorSingleAxis,
							0.6,
							4,
						),
						scaleMaterialInvisible,
					),
					[0, 0, -0.3],
					[-Math.PI / 2, 0, 0],
				],
			],
			XY: [
				[
					new Mesh(
						new BoxGeometry(
							-0.2 * mobileFactorMultiAxis,
							-0.2 * mobileFactorMultiAxis,
							0.01,
						),
						scaleMaterialInvisible,
					),
					[
						-0.25 * mobileFactorMultiAxis,
						-0.25 * mobileFactorMultiAxis,
						0,
					],
				],
			],
			YZ: [
				[
					new Mesh(
						new BoxGeometry(
							-0.2 * mobileFactorMultiAxis,
							-0.2 * mobileFactorMultiAxis,
							0.01,
						),
						scaleMaterialInvisible,
					),
					[
						0,
						-0.25 * mobileFactorMultiAxis,
						-0.25 * mobileFactorMultiAxis,
					],
					[0, Math.PI / 2, 0],
				],
			],
			XZ: [
				[
					new Mesh(
						new BoxGeometry(
							-0.2 * mobileFactorMultiAxis,
							-0.2 * mobileFactorMultiAxis,
							0.01,
						),
						scaleMaterialInvisible,
					),
					[
						-0.25 * mobileFactorMultiAxis,
						0,
						-0.25 * mobileFactorMultiAxis,
					],
					[-Math.PI / 2, 0, 0],
				],
			],
			// XYZ: [
			//     [new Mesh(new BoxGeometry(0.2, 0.2, 0.2), scaleMaterialInvisible), [0, 0, 0]],
			// ]
		};

		const helperScale: GizmoMap = {
			X: [
				[
					new Line(scaleLineGeometry, scaleMaterialHelper.clone()),
					[-1e3, 0, 0],
					null,
					[1e6, 1, 1],
					"helper",
				],
			],
			Y: [
				[
					new Line(scaleLineGeometry, scaleMaterialHelper.clone()),
					[0, -1e3, 0],
					[0, 0, Math.PI / 2],
					[1e6, 1, 1],
					"helper",
				],
			],
			Z: [
				[
					new Line(scaleLineGeometry, scaleMaterialHelper.clone()),
					[0, 0, -1e3],
					[0, -Math.PI / 2, 0],
					[1e6, 1, 1],
					"helper",
				],
			],
		};

		// Creates an Object3D with gizmos described in custom hierarchy definition.

		function setupGizmo(gizmoMap: GizmoMap) {
			const gizmo = new Object3D();

			for (const name in gizmoMap) {
				for (let i = gizmoMap[name].length; i--; ) {
					const object = gizmoMap[name][i][0].clone();
					const position = gizmoMap[name][i][1];
					const rotation = gizmoMap[name][i][2];
					const scale = gizmoMap[name][i][3];
					const tag = gizmoMap[name][i][4];

					// name and tag properties are essential for picking and updating logic.
					object.name = name;
					object.userData.ambientOcclusion = false;
					(object as any).tag = tag;

					if (position) {
						object.position.set(
							position[0],
							position[1],
							position[2],
						);
					}

					if (rotation) {
						object.rotation.set(
							rotation[0],
							rotation[1],
							rotation[2],
						);
					}

					if (scale) {
						object.scale.set(scale[0], scale[1], scale[2]);
					}

					object.updateMatrix();

					const tempGeometry = object.geometry.clone();
					tempGeometry.applyMatrix4(object.matrix);
					object.geometry = tempGeometry;
					object.renderOrder = Infinity;

					object.position.set(0, 0, 0);
					object.rotation.set(0, 0, 0);
					object.scale.set(1, 1, 1);

					gizmo.add(object);
				}
			}

			return gizmo;
		}

		// Gizmo creation

		this.gizmo = {
			translate: setupGizmo(gizmoTranslate),
			rotate: setupGizmo(gizmoRotate),
			scale: setupGizmo(gizmoScale),
		};
		this._availablePicker = this.picker = {
			translate: setupGizmo(pickerTranslate),
			rotate: setupGizmo(pickerRotate),
			scale: setupGizmo(pickerScale),
		};
		this.helper = {
			translate: setupGizmo(helperTranslate),
			rotate: setupGizmo(helperRotate),
			scale: setupGizmo(helperScale),
		};

		this.add(this.gizmo["scale"]);
		this.add(this._availablePicker["scale"]);
		this.add(this.helper["scale"]);

		this.add(this.gizmo["translate"]);
		this.add(this._availablePicker["translate"]);
		this.add(this.helper["translate"]);

		this.add(this.gizmo["rotate"]);
		this.add(this._availablePicker["rotate"]);
		this.add(this.helper["rotate"]);

		// Pickers should be hidden always

		this._availablePicker["translate"].visible = false;
		this._availablePicker["rotate"].visible = false;
		this._availablePicker["scale"].visible = false;
	}

	public get enableRotation(): boolean {
		return this._enableRotation;
	}

	public set enableRotation(value: boolean) {
		this._enableRotation = value;
	}

	public get enableRotationX(): boolean {
		return this._enableRotationX;
	}

	public set enableRotationX(value: boolean) {
		this._enableRotationX = value;
	}

	public get enableRotationXY(): boolean {
		return this._enableRotationXY;
	}

	public set enableRotationXY(value: boolean) {
		this._enableRotationXY = value;
	}

	public get enableRotationXZ(): boolean {
		return this._enableRotationXZ;
	}

	public set enableRotationXZ(value: boolean) {
		this._enableRotationXZ = value;
	}

	public get enableRotationY(): boolean {
		return this._enableRotationY;
	}

	public set enableRotationY(value: boolean) {
		this._enableRotationY = value;
	}

	public get enableRotationYZ(): boolean {
		return this._enableRotationYZ;
	}

	public set enableRotationYZ(value: boolean) {
		this._enableRotationYZ = value;
	}

	public get enableRotationZ(): boolean {
		return this._enableRotationZ;
	}

	public set enableRotationZ(value: boolean) {
		this._enableRotationZ = value;
	}

	public get enableScaling(): boolean {
		return this._enableScaling;
	}

	public set enableScaling(value: boolean) {
		this._enableScaling = value;
	}

	public get enableScalingX(): boolean {
		return this._enableScalingX;
	}

	public set enableScalingX(value: boolean) {
		this._enableScalingX = value;
	}

	public get enableScalingXY(): boolean {
		return this._enableScalingXY;
	}

	public set enableScalingXY(value: boolean) {
		this._enableScalingXY = value;
	}

	public get enableScalingXZ(): boolean {
		return this._enableScalingXZ;
	}

	public set enableScalingXZ(value: boolean) {
		this._enableScalingXZ = value;
	}

	public get enableScalingY(): boolean {
		return this._enableScalingY;
	}

	public set enableScalingY(value: boolean) {
		this._enableScalingY = value;
	}

	public get enableScalingYZ(): boolean {
		return this._enableScalingYZ;
	}

	public set enableScalingYZ(value: boolean) {
		this._enableScalingYZ = value;
	}

	public get enableScalingZ(): boolean {
		return this._enableScalingZ;
	}

	public set enableScalingZ(value: boolean) {
		this._enableScalingZ = value;
	}

	public get enableTranslation(): boolean {
		return this._enableTranslation;
	}

	public set enableTranslation(value: boolean) {
		this._enableTranslation = value;
	}

	public get enableTranslationX(): boolean {
		return this._enableTranslationX;
	}

	public set enableTranslationX(value: boolean) {
		this._enableTranslationX = value;
	}

	public get enableTranslationXY(): boolean {
		return this._enableTranslationXY;
	}

	public set enableTranslationXY(value: boolean) {
		this._enableTranslationXY = value;
	}

	public get enableTranslationXZ(): boolean {
		return this._enableTranslationXZ;
	}

	public set enableTranslationXZ(value: boolean) {
		this._enableTranslationXZ = value;
	}

	public get enableTranslationY(): boolean {
		return this._enableTranslationY;
	}

	public set enableTranslationY(value: boolean) {
		this._enableTranslationY = value;
	}

	public get enableTranslationYZ(): boolean {
		return this._enableTranslationYZ;
	}

	public set enableTranslationYZ(value: boolean) {
		this._enableTranslationYZ = value;
	}

	public get enableTranslationZ(): boolean {
		return this._enableTranslationZ;
	}

	public set enableTranslationZ(value: boolean) {
		this._enableTranslationZ = value;
	}

	// updateMatrixWorld will update transformations and appearance of individual handles
	public updateMatrixWorld(force: boolean) {
		const space = this._gumballControls.space;

		let quaternion = new Quaternion();
		if (space === "local") {
			this._gumballControls.object?.getWorldQuaternion(quaternion);
		} else {
			quaternion = _identityQuaternion;
		}

		// Show only gizmos for current transform mode

		this.gizmo["translate"].visible = this.enableTranslation;
		this.gizmo["rotate"].visible = this.enableRotation;
		this.gizmo["scale"].visible =
			this.enableScaling && this._gumballControls.space === "local";

		this.helper["translate"].visible = this.enableTranslation;
		this.helper["rotate"].visible = this.enableRotation;
		this.helper["scale"].visible =
			this.enableScaling && this._gumballControls.space === "local";

		this.picker = this._availablePicker;

		let handles: {
			object: Object3D;
			mode: TransformationType;
		}[] = [];
		if (this.enableTranslation) {
			let pickers = this._availablePicker.translate.children;
			let gizmos = this.gizmo.translate.children;
			let helpers = this.helper.translate.children;

			// filter out all X handles if X is disabled
			if (this.enableTranslationX === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"X",
				);

			// filter out all Y handles if Y is disabled
			if (this.enableTranslationY === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"Y",
				);

			// filter out all Z handles if Z is disabled
			if (this.enableTranslationZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"Z",
				);

			// filter out all XY handles if XY is disabled
			if (this.enableTranslationXY === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"XY",
				);

			// filter out all YZ handles if YZ is disabled
			if (this.enableTranslationYZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"YZ",
				);

			// filter out all XZ handles if XZ is disabled
			if (this.enableTranslationXZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"XZ",
				);

			// filter out all XYZ handles if XYZ is disabled
			if (
				this.enableTranslationX === false ||
				this.enableTranslationY === false ||
				this.enableTranslationZ === false
			)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"XYZ",
				);

			handles = handles.concat(
				pickers.map((object) => ({
					object,
					mode: TransformationType.TRANSLATION,
				})),
			);
			handles = handles.concat(
				gizmos.map((object) => ({
					object,
					mode: TransformationType.TRANSLATION,
				})),
			);
			handles = handles.concat(
				helpers.map((object) => ({
					object,
					mode: TransformationType.TRANSLATION,
				})),
			);
		}

		if (this.enableRotation) {
			let pickers = this._availablePicker.rotate.children;
			let gizmos = this.gizmo.rotate.children;
			let helpers = this.helper.rotate.children;

			// filter out all X handles if X is disabled
			if (this.enableRotationX === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"X",
				);

			// filter out all Y handles if Y is disabled
			if (this.enableRotationY === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"Y",
				);

			// filter out all Z handles if Z is disabled
			if (this.enableRotationZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"Z",
				);

			// filter out all XY handles if XY is disabled
			if (this.enableRotationXY === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"XY",
				);

			// filter out all YZ handles if YZ is disabled
			if (this.enableRotationYZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"YZ",
				);

			// filter out all XZ handles if XZ is disabled
			if (this.enableRotationXZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"XZ",
				);

			// filter out all E handles if one of the axis is disabled
			if (
				this.enableRotationX === false ||
				this.enableRotationY === false ||
				this.enableRotationZ === false
			)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"E",
				);

			handles = handles.concat(
				pickers.map((object) => ({
					object,
					mode: TransformationType.ROTATION,
				})),
			);
			handles = handles.concat(
				gizmos.map((object) => ({
					object,
					mode: TransformationType.ROTATION,
				})),
			);
			handles = handles.concat(
				helpers.map((object) => ({
					object,
					mode: TransformationType.ROTATION,
				})),
			);
		}

		if (this.enableScaling && this._gumballControls.space === "local") {
			let pickers = this._availablePicker.scale.children;
			let gizmos = this.gizmo.scale.children;
			let helpers = this.helper.scale.children;

			// filter out all X handles if X is disabled
			if (this.enableScalingX === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"X",
				);

			// filter out all Y handles if Y is disabled
			if (this.enableScalingY === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"Y",
				);

			// filter out all Z handles if Z is disabled
			if (this.enableScalingZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"Z",
				);

			// filter out all XY handles if XY is disabled
			if (this.enableScalingXY === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"XY",
				);

			// filter out all YZ handles if YZ is disabled
			if (this.enableScalingYZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"YZ",
				);

			// filter out all XZ handles if XZ is disabled
			if (this.enableScalingXZ === false)
				[pickers, gizmos, helpers] = this.filterOutAxis(
					pickers,
					gizmos,
					helpers,
					"XZ",
				);

			handles = handles.concat(
				pickers.map((object) => ({
					object,
					mode: TransformationType.SCALE,
				})),
			);
			handles = handles.concat(
				gizmos.map((object) => ({
					object,
					mode: TransformationType.SCALE,
				})),
			);
			handles = handles.concat(
				helpers.map((object) => ({
					object,
					mode: TransformationType.SCALE,
				})),
			);
		}

		for (let i = 0; i < handles.length; i++) {
			const handle = handles[i] as {
				object:
					| Mesh<BufferGeometry, MeshBasicMaterial>
					| Line<BufferGeometry, LineBasicMaterial>;
				mode: TransformationType;
			};

			// hide aligned to camera

			handle.object.visible = true;
			handle.object.rotation.set(0, 0, 0);
			handle.object.position.copy(this._gumballControls.worldPosition);

			let factor;

			if (
				(this._gumballControls.camera as OrthographicCamera)
					.isOrthographicCamera
			) {
				factor =
					((this._gumballControls.camera as OrthographicCamera).top -
						(this._gumballControls.camera as OrthographicCamera)
							.bottom) /
					(this._gumballControls.camera as OrthographicCamera).zoom;
			} else {
				factor =
					this._gumballControls.worldPosition.distanceTo(
						this._gumballControls.cameraPosition,
					) *
					Math.min(
						(1.9 *
							Math.tan(
								(Math.PI *
									(
										this._gumballControls
											.camera as PerspectiveCamera
									).fov) /
									360,
							)) /
							(this._gumballControls.camera as PerspectiveCamera)
								.zoom,
						7,
					);
			}

			handle.object.scale
				.set(1, 1, 1)
				.multiplyScalar(factor * this._gumballControls.size);

			// TODO: simplify helpers and consider decoupling from gizmo

			if ((handle.object as any).tag === "helper") {
				handle.object.visible = false;

				if (handle.object.name === "AXIS") {
					handle.object.visible = !!this._gumballControls.axis;

					if (this._gumballControls.axis === "X") {
						_tempQuaternion.setFromEuler(_tempEuler.set(0, 0, 0));
						handle.object.quaternion
							.copy(quaternion)
							.multiply(_tempQuaternion);

						if (
							Math.abs(
								_alignVector
									.copy(_unitX)
									.applyQuaternion(quaternion)
									.dot(this._gumballControls.eye),
							) > 0.9
						) {
							handle.object.visible = false;
						}
					}

					if (this._gumballControls.axis === "Y") {
						_tempQuaternion.setFromEuler(
							_tempEuler.set(0, 0, Math.PI / 2),
						);
						handle.object.quaternion
							.copy(quaternion)
							.multiply(_tempQuaternion);

						if (
							Math.abs(
								_alignVector
									.copy(_unitY)
									.applyQuaternion(quaternion)
									.dot(this._gumballControls.eye),
							) > 0.9
						) {
							handle.object.visible = false;
						}
					}

					if (this._gumballControls.axis === "Z") {
						_tempQuaternion.setFromEuler(
							_tempEuler.set(0, Math.PI / 2, 0),
						);
						handle.object.quaternion
							.copy(quaternion)
							.multiply(_tempQuaternion);

						if (
							Math.abs(
								_alignVector
									.copy(_unitZ)
									.applyQuaternion(quaternion)
									.dot(this._gumballControls.eye),
							) > 0.9
						) {
							handle.object.visible = false;
						}
					}

					if (this._gumballControls.axis === "XYZE") {
						_tempQuaternion.setFromEuler(
							_tempEuler.set(0, Math.PI / 2, 0),
						);
						_alignVector.copy(this._gumballControls.rotationAxis);
						handle.object.quaternion.setFromRotationMatrix(
							_lookAtMatrix.lookAt(
								_zeroVector,
								_alignVector,
								_unitY,
							),
						);
						handle.object.quaternion.multiply(_tempQuaternion);
						handle.object.visible = this._gumballControls.dragging;
					}

					if (this._gumballControls.axis === "E") {
						handle.object.visible = false;
					}
				} else if (handle.object.name === "START") {
					handle.object.position.copy(
						this._gumballControls.worldPositionStart,
					);
					handle.object.visible = this._gumballControls.dragging;
				} else if (handle.object.name === "END") {
					handle.object.position.copy(
						this._gumballControls.worldPosition,
					);
					handle.object.visible = this._gumballControls.dragging;
				} else if (handle.object.name === "DELTA") {
					handle.object.position.copy(
						this._gumballControls.worldPositionStart,
					);
					handle.object.quaternion.copy(
						this._gumballControls.worldQuaternionStart,
					);
					_tempVector
						.set(1e-10, 1e-10, 1e-10)
						.add(this._gumballControls.worldPositionStart)
						.sub(this._gumballControls.worldPosition)
						.multiplyScalar(-1);
					_tempVector.applyQuaternion(
						this._gumballControls.worldQuaternionStart
							.clone()
							.invert(),
					);
					handle.object.scale.copy(_tempVector);
					handle.object.visible = this._gumballControls.dragging;
				} else {
					handle.object.quaternion.copy(quaternion);

					if (this._gumballControls.dragging) {
						handle.object.position.copy(
							this._gumballControls.worldPositionStart,
						);
					} else {
						handle.object.position.copy(
							this._gumballControls.worldPosition,
						);
					}

					if (this._gumballControls.axis) {
						handle.object.visible =
							this._gumballControls.axis.search(
								handle.object.name,
							) !== -1;
					}
				}

				// If updating helper, skip rest of the loop
				continue;
			}

			// Align handles to current local or world rotation

			handle.object.quaternion.copy(quaternion);

			if (
				(this.enableTranslation &&
					handle.mode === TransformationType.TRANSLATION) ||
				(this.enableScaling && handle.mode === TransformationType.SCALE)
			) {
				// Hide translate and scale axis facing the camera

				const AXIS_HIDE_THRESHOLD = 0.99;
				const PLANE_HIDE_THRESHOLD = 0.2;

				if (handle.object.name === "X") {
					if (
						Math.abs(
							_alignVector
								.copy(_unitX)
								.applyQuaternion(quaternion)
								.dot(this._gumballControls.eye),
						) > AXIS_HIDE_THRESHOLD
					) {
						handle.object.scale.set(1e-10, 1e-10, 1e-10);
						handle.object.visible = false;
					}
				}

				if (handle.object.name === "Y") {
					if (
						Math.abs(
							_alignVector
								.copy(_unitY)
								.applyQuaternion(quaternion)
								.dot(this._gumballControls.eye),
						) > AXIS_HIDE_THRESHOLD
					) {
						handle.object.scale.set(1e-10, 1e-10, 1e-10);
						handle.object.visible = false;
					}
				}

				if (handle.object.name === "Z") {
					if (
						Math.abs(
							_alignVector
								.copy(_unitZ)
								.applyQuaternion(quaternion)
								.dot(this._gumballControls.eye),
						) > AXIS_HIDE_THRESHOLD
					) {
						handle.object.scale.set(1e-10, 1e-10, 1e-10);
						handle.object.visible = false;
					}
				}

				if (handle.object.name === "XY") {
					if (
						Math.abs(
							_alignVector
								.copy(_unitZ)
								.applyQuaternion(quaternion)
								.dot(this._gumballControls.eye),
						) < PLANE_HIDE_THRESHOLD
					) {
						handle.object.scale.set(1e-10, 1e-10, 1e-10);
						handle.object.visible = false;
					}
				}

				if (handle.object.name === "YZ") {
					if (
						Math.abs(
							_alignVector
								.copy(_unitX)
								.applyQuaternion(quaternion)
								.dot(this._gumballControls.eye),
						) < PLANE_HIDE_THRESHOLD
					) {
						handle.object.scale.set(1e-10, 1e-10, 1e-10);
						handle.object.visible = false;
					}
				}

				if (handle.object.name === "XZ") {
					if (
						Math.abs(
							_alignVector
								.copy(_unitY)
								.applyQuaternion(quaternion)
								.dot(this._gumballControls.eye),
						) < PLANE_HIDE_THRESHOLD
					) {
						handle.object.scale.set(1e-10, 1e-10, 1e-10);
						handle.object.visible = false;
					}
				}
			}

			if (this.enableRotation) {
				// Align handle.objects to current local or world rotation

				_tempQuaternion2.copy(quaternion);
				_alignVector
					.copy(this._gumballControls.eye)
					.applyQuaternion(_tempQuaternion.copy(quaternion).invert());

				if (handle.object.name.search("E") !== -1) {
					handle.object.quaternion.setFromRotationMatrix(
						_lookAtMatrix.lookAt(
							this._gumballControls.eye,
							_zeroVector,
							_unitY,
						),
					);
				}

				if (handle.object.name === "X") {
					_tempQuaternion.setFromAxisAngle(
						_unitX,
						Math.atan2(-_alignVector.y, _alignVector.z),
					);
					_tempQuaternion.multiplyQuaternions(
						_tempQuaternion2,
						_tempQuaternion,
					);
					handle.object.quaternion.copy(_tempQuaternion);
				}

				if (handle.object.name === "Y") {
					_tempQuaternion.setFromAxisAngle(
						_unitY,
						Math.atan2(_alignVector.x, _alignVector.z),
					);
					_tempQuaternion.multiplyQuaternions(
						_tempQuaternion2,
						_tempQuaternion,
					);
					handle.object.quaternion.copy(_tempQuaternion);
				}

				if (handle.object.name === "Z") {
					_tempQuaternion.setFromAxisAngle(
						_unitZ,
						Math.atan2(_alignVector.y, _alignVector.x),
					);
					_tempQuaternion.multiplyQuaternions(
						_tempQuaternion2,
						_tempQuaternion,
					);
					handle.object.quaternion.copy(_tempQuaternion);
				}
			}

			// Hide disabled axes
			handle.object.visible =
				handle.object.visible &&
				(handle.object.name.indexOf("X") === -1 ||
					this._gumballControls.showX);
			handle.object.visible =
				handle.object.visible &&
				(handle.object.name.indexOf("Y") === -1 ||
					this._gumballControls.showY);
			handle.object.visible =
				handle.object.visible &&
				(handle.object.name.indexOf("Z") === -1 ||
					this._gumballControls.showZ);
			handle.object.visible =
				handle.object.visible &&
				(handle.object.name.indexOf("E") === -1 ||
					(this._gumballControls.showX &&
						this._gumballControls.showY &&
						this._gumballControls.showZ));

			// highlight selected axis
			if (
				handle.object.material instanceof MeshBasicMaterial ||
				handle.object.material instanceof LineBasicMaterial
			) {
				(handle.object.material as any)._color =
					(handle.object.material as any)._color ||
					handle.object.material.color.clone();
				(handle.object.material as any)._opacity =
					(handle.object.material as any)._opacity ||
					handle.object.material.opacity;

				handle.object.material.color.copy(
					(handle.object.material as any)._color,
				);
				handle.object.material.opacity = (
					handle.object.material as any
				)._opacity;

				if (
					this._gumballControls.enabled &&
					this._gumballControls.axis &&
					handle.mode === this._gumballControls.mode
				) {
					if (handle.object.name === this._gumballControls.axis) {
						handle.object.material.color.setHex(0xffff00);
						handle.object.material.opacity = 1.0;
					} else if (
						this._gumballControls.axis.split("").some(function (a) {
							return handle.object.name === a;
						})
					) {
						handle.object.material.color.setHex(0xffff00);
						handle.object.material.opacity = 1.0;
					}
				} else if (
					this._gumballControls.enabled &&
					this._gumballControls.pivotDragged
				) {
					handle.object.material.color.setHex(0xffff00);
					handle.object.material.opacity = 1.0;
				}
			}
		}

		super.updateMatrixWorld(force);
	}

	private filterOutAxis(
		pickers: Object3D[],
		gizmos: Object3D[],
		helpers: Object3D[],
		axis: string,
	) {
		const pickersAxis = pickers.filter((object) => object.name === axis);
		const gizmosAxis = gizmos.filter((object) => object.name === axis);
		const helpersAxis = helpers.filter((object) => object.name === axis);

		[pickersAxis, gizmosAxis, helpersAxis].forEach((objects) => {
			objects.forEach((object) => {
				object.visible = false;
			});
		});

		pickersAxis.forEach((object) => {
			this.picker.translate.remove(object);
			this.picker.rotate.remove(object);
			this.picker.scale.remove(object);
		});

		pickers = pickers.filter((object) => object.name !== axis);
		gizmos = gizmos.filter((object) => object.name !== axis);
		helpers = helpers.filter((object) => object.name !== axis);

		return [pickers, gizmos, helpers];
	}
}

const _alignVector = new Vector3(0, 1, 0);
const _identityQuaternion = new Quaternion();
const _lookAtMatrix = new Matrix4();
const _tempEuler = new Euler();
const _tempQuaternion = new Quaternion();
const _tempQuaternion2 = new Quaternion();
const _tempVector = new Vector3();
const _unitX = new Vector3(1, 0, 0);
const _unitY = new Vector3(0, 1, 0);
const _unitZ = new Vector3(0, 0, 1);
const _zeroVector = new Vector3(0, 0, 0);
