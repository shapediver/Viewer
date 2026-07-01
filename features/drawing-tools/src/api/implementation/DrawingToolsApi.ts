import {type ITreeNode, type IViewportApi} from "@shapediver/viewer";
import {
	CameraPlaneRestriction,
	CameraPlaneRestrictionApi,
	GeometryRestriction,
	GeometryRestrictionApi,
	type IRestrictionApi,
	LineRestriction,
	LineRestrictionApi,
	PlaneRestriction,
	PlaneRestrictionApi,
	PointRestriction,
	PointRestrictionApi,
	type RayTraceResult,
	type RestrictionProperties} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {vec3} from "gl-matrix";
import {DrawingToolsManager} from "../../business/implementation/DrawingToolsManager";
import {
	type Callbacks,
	type DefaultTextures,
	type IDrawingToolsManager,
	type PointsData,
	type SettingsOptional} from "../../business/interfaces/IDrawingToolsManager";
import {type IDrawingToolsApi} from "../interfaces/IDrawingToolsApi";

export class DrawingToolsApi implements IDrawingToolsApi {
	// #region Properties (2)

	readonly #drawingToolsManager: IDrawingToolsManager;
	readonly #restrictions: {[key: string]: IRestrictionApi} = {};

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(
		viewport: IViewportApi,
		callbacks: Callbacks,
		settings: SettingsOptional,
		defaultTextures?: DefaultTextures,
		parentNode?: ITreeNode,
	) {
		this.#drawingToolsManager = new DrawingToolsManager(
			viewport,
			callbacks,
			settings,
			defaultTextures,
			parentNode,
		);

		for (const token in this.#drawingToolsManager.restrictions) {
			if (
				this.#drawingToolsManager.restrictions[token] instanceof
				PlaneRestriction
			)
				this.#restrictions[token] = new PlaneRestrictionApi(
					this.#drawingToolsManager.restrictions[
						token
					] as PlaneRestriction,
				);
			if (
				this.#drawingToolsManager.restrictions[token] instanceof
				GeometryRestriction
			)
				this.#restrictions[token] = new GeometryRestrictionApi(
					this.#drawingToolsManager.restrictions[
						token
					] as GeometryRestriction,
				);
			if (
				this.#drawingToolsManager.restrictions[token] instanceof
				PointRestriction
			)
				this.#restrictions[token] = new PointRestrictionApi(
					this.#drawingToolsManager.restrictions[
						token
					] as PointRestriction,
				);
			if (
				this.#drawingToolsManager.restrictions[token] instanceof
				LineRestriction
			)
				this.#restrictions[token] = new LineRestrictionApi(
					this.#drawingToolsManager.restrictions[
						token
					] as LineRestriction,
				);
			if (
				this.#drawingToolsManager.restrictions[token] instanceof
				CameraPlaneRestriction
			)
				this.#restrictions[token] = new CameraPlaneRestrictionApi(
					this.#drawingToolsManager.restrictions[
						token
					] as CameraPlaneRestriction,
				);
		}
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (7)

	public get closed(): boolean {
		return this.#drawingToolsManager.closed;
	}

	public get paused(): boolean {
		return this.#drawingToolsManager.paused;
	}

	public get pointsData(): PointsData {
		return this.#drawingToolsManager.getPointsData();
	}

	public get uuid(): string {
		return this.#drawingToolsManager.uuid;
	}

	public get restrictions(): {[key: string]: IRestrictionApi} {
		return this.#restrictions;
	}

	public get showDistanceLabels(): boolean {
		return this.#drawingToolsManager.showDistanceLabels;
	}

	public set showDistanceLabels(value: boolean) {
		this.#drawingToolsManager.showDistanceLabels = value;
	}

	public get showPointLabels(): boolean {
		return this.#drawingToolsManager.showPointLabels;
	}

	public set showPointLabels(value: boolean) {
		this.#drawingToolsManager.showPointLabels = value;
	}

	// #endregion Public Getters And Setters (7)

	// #region Public Methods (11)

	public addPoint(index: number, position?: vec3 | undefined): void {
		this.#drawingToolsManager.addPoint(index, position);
	}

	public addRestriction(
		properties: RestrictionProperties,
		incomingToken?: string,
	): IRestrictionApi | undefined {
		const token = this.#drawingToolsManager.addRestriction(
			properties,
			incomingToken,
		);
		if (!token) return;

		if (
			this.#drawingToolsManager.restrictions[token] instanceof
			PlaneRestriction
		)
			this.#restrictions[token] = new PlaneRestrictionApi(
				this.#drawingToolsManager.restrictions[
					token
				] as PlaneRestriction,
			);
		if (
			this.#drawingToolsManager.restrictions[token] instanceof
			GeometryRestriction
		)
			this.#restrictions[token] = new GeometryRestrictionApi(
				this.#drawingToolsManager.restrictions[
					token
				] as GeometryRestriction,
			);
		if (
			this.#drawingToolsManager.restrictions[token] instanceof
			PointRestriction
		)
			this.#restrictions[token] = new PointRestrictionApi(
				this.#drawingToolsManager.restrictions[
					token
				] as PointRestriction,
			);
		if (
			this.#drawingToolsManager.restrictions[token] instanceof
			LineRestriction
		)
			this.#restrictions[token] = new LineRestrictionApi(
				this.#drawingToolsManager.restrictions[
					token
				] as LineRestriction,
			);
		if (
			this.#drawingToolsManager.restrictions[token] instanceof
			CameraPlaneRestriction
		)
			this.#restrictions[token] = new CameraPlaneRestrictionApi(
				this.#drawingToolsManager.restrictions[
					token
				] as CameraPlaneRestriction,
			);

		return this.#restrictions[token];
	}

	public canRedo(): boolean {
		return this.#drawingToolsManager.canRedo();
	}

	public canUndo(): boolean {
		return this.#drawingToolsManager.canUndo();
	}

	public pause(): void {
		this.#drawingToolsManager.pause();
	}

	public continue(): void {
		this.#drawingToolsManager.continue();
	}

	public cancel(): void {
		this.#drawingToolsManager.cancel();
	}

	public cancelDrag(): void {
		this.#drawingToolsManager.cancelDrag();
	}

	public isInteractionActive(): boolean {
		return this.#drawingToolsManager.isInteractionActive();
	}

	public close(): void {
		this.#drawingToolsManager.close();
	}

	public movePoint(
		index: number,
		position: vec3,
		temporary?: boolean,
		skipConstraints?: boolean,
	): void {
		this.#drawingToolsManager.movePoint(
			index,
			position,
			undefined,
			temporary,
			skipConstraints,
		);
	}

	public redo(): void {
		this.#drawingToolsManager.redo();
	}

	public removePoint(index: number): void {
		this.#drawingToolsManager.removePoint(index);
	}

	public removeRestriction(token: string): void {
		this.#drawingToolsManager.removeRestriction(token);
		delete this.#restrictions[token];
	}

	public undo(): void {
		this.#drawingToolsManager.undo();
	}

	public update(): {
		pointsData: PointsData;
		metaData: (RayTraceResult | undefined)[];
	} | void {
		return this.#drawingToolsManager.update();
	}

	// #endregion Public Methods (11)
}
