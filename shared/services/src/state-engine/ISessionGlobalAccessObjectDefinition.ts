import {
	QueryGltfConversion,
	ResBase,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {type SessionCreationDefinition} from "@shapediver/viewer.shared.types";
import {SettingsEngine} from "../settings-engine/SettingsEngine";
import {StatePromise} from "./StatePromise";

/**
 * Interface for the global access definition of a session.
 * This interface is used to define the properties and methods that are available via the state engine for a session.
 * This means that they can be called without having a direct reference to the session engine.
 */
export interface ISessionGlobalAccessObjectDefinition {
	// #region Properties (9)

	readonly canUploadGLTF: boolean;
	readonly id: string;
	readonly initialOutputsLoaded: StatePromise<boolean>;
	readonly initialized: StatePromise<boolean>;
	readonly modelViewUrl: string;
	readonly settingsEngine: SettingsEngine;
	readonly settingsRegistered: StatePromise<boolean>;
	readonly sessionCreationDefinition: SessionCreationDefinition;

	isFirstSession: boolean;
	uploadGLTF: (
		gltf: Blob,
		name: QueryGltfConversion | undefined,
	) => Promise<ResBase>;

	// #endregion Properties (9)
}
