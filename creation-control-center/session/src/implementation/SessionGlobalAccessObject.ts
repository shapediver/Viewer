import {
	QueryGltfConversion,
	ResBase,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {SessionEngine} from "@shapediver/viewer.session-engine.session-engine";
import {
	type ISessionGlobalAccessObjectDefinition,
	SettingsEngine,
	StatePromise} from "@shapediver/viewer.shared.services";
import {type SessionCreationDefinition} from "@shapediver/viewer.shared.types";

export class SessionGlobalAccessObject
	implements ISessionGlobalAccessObjectDefinition
{
	readonly #sessionCreationDefinition: SessionCreationDefinition;
	readonly #sessionEngine: SessionEngine;

	#initialOutputsLoaded: StatePromise<boolean> = new StatePromise();
	#initialized: StatePromise<boolean> = new StatePromise();
	#isFirstSession: boolean = false;
	#settingsRegistered: StatePromise<boolean> = new StatePromise();

	constructor(
		sessionEngine: SessionEngine,
		sessionCreationDefinition: SessionCreationDefinition,
	) {
		this.#sessionEngine = sessionEngine;
		this.#sessionCreationDefinition = sessionCreationDefinition;
	}

	public get canUploadGLTF(): boolean {
		return this.#sessionEngine.canUploadGLTF;
	}

	public get id(): string {
		return this.#sessionEngine.id;
	}

	public get initialOutputsLoaded(): StatePromise<boolean> {
		return this.#initialOutputsLoaded;
	}

	public get initialized(): StatePromise<boolean> {
		return this.#initialized;
	}

	public get isFirstSession(): boolean {
		return this.#isFirstSession;
	}

	public set isFirstSession(value: boolean) {
		this.#isFirstSession = value;
	}

	public get modelViewUrl(): string {
		return this.#sessionEngine.modelViewUrl;
	}

	public get sessionCreationDefinition(): SessionCreationDefinition {
		return this.#sessionCreationDefinition;
	}

	public get settingsEngine(): SettingsEngine {
		return this.#sessionEngine.settingsEngine;
	}

	public get settingsRegistered(): StatePromise<boolean> {
		return this.#settingsRegistered;
	}

	public uploadGLTF(
		gltf: Blob,
		name: QueryGltfConversion | undefined,
	): Promise<ResBase> {
		return this.#sessionEngine.uploadGLTF(gltf, name);
	}
}
