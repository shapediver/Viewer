import {ShapeDiverResponseDto} from "@shapediver/sdk.geometry-api-sdk-v2";
import {SessionEngine} from "@shapediver/viewer.session-engine.session-engine";
import {
	ISettingsSections,
	SessionCreationDefinition,
} from "@shapediver/viewer.shared.types";

export interface ICreationControlCenterSession {
	// #region Properties (2)

	sessionEngines: {[key: string]: SessionEngine};
	updateSessions?: (sessionEngines: {[key: string]: SessionEngine}) => void;

	// #endregion Properties (2)

	// #region Public Methods (5)

	applySettings(
		sessionId: string,
		response: ShapeDiverResponseDto,
		sections?: ISettingsSections,
	): Promise<void>;
	closeSessionEngine(id: string): Promise<void>;
	createSessionEngine(
		properties: SessionCreationDefinition,
	): Promise<SessionEngine>;
	resetSettings(
		sessionId: string,
		sections?: ISettingsSections,
	): Promise<void>;
	saveSettings(sessionId: string, viewportId?: string): Promise<boolean>;

	// #endregion Public Methods (5)
}
