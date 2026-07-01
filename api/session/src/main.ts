import {showConsoleMessage} from "@shapediver/viewer.api.general";
import {CreationControlCenterSession} from "@shapediver/viewer.creation-control-center.session";
import {SessionEngine} from "@shapediver/viewer.session-engine.session-engine";
import {
	InputValidator,
	Logger,
	ShapeDiverViewerSessionError} from "@shapediver/viewer.shared.services";
import {type SessionCreationDefinition} from "@shapediver/viewer.shared.types";
import {SessionApi} from "./implementation/SessionApi";
import {type ISessionApi} from "./interfaces/ISessionApi";

/**
 * The sessions that are currently being used.
 */
export const sessions: {[key: string]: ISessionApi} = {};

// Whenever a session or viewport is added or removed, this update is called.
const updateSessions = (sessionEngines: {[key: string]: SessionEngine}) => {
	for (const s in sessionEngines)
		if (!sessions[s]) sessions[s] = new SessionApi(sessionEngines[s]);

	for (const s in sessions) if (!sessionEngines[s]) delete sessions[s];
};

/**
 * Create and initialize a session with a model hosted on a
 * {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend},
 * using the provided ticket/guid and modelViewUrl.
 * Returns a session api object allowing to control the session.
 *
 * A JWT can be specified for authorizing the API calls to the Geometry Backend.
 * The model's settings on the Geometry Backend might require a JWT to be provided.
 *
 * By default the outputs of the model for its default parameter values will be loaded.
 *
 * An optional identifier for the session can be provided. This identifier can be used to retrieve the
 * api object from {@link sessions}. In case no identifier is provided, a unique one will be generated.
 *
 * @param properties.ticket The ticket for direct embedding of the model represented by the session. This identifies the model on the Geometry Backend. If no ticket was provided, a {@link guid} has to be provided instead.
 * @param properties.guid The geometry backend model id (guid). This identifies the model on the Geometry Backend. A {@link jwtToken} is needed for authentication. If no guid was provided, a {@link ticket} has to be provided instead.
 * @param properties.modelViewUrl The modelViewUrl of the {@link https://help.shapediver.com/doc/Geometry-Backend.1863942173.html|ShapeDiver Geometry Backend} hosting the model.
 * @param properties.jwtToken The JWT to use for authorizing the API calls to the Geometry Backend.
 * @param properties.id The unique identifier to use for the session.
 * @param properties.ignoreUnknownParams Option to allow relaxed validation of parameter identifiers. When set to `true`, unrecognized parameters will be ignored rather than causing an error. (default: false)
 * @param properties.waitForOutputs Option to wait for the outputs to be loaded, or return immediately after creation of the session. (default: true)
 * @param properties.loadOutputs Option to load the outputs, or not load them until the first call of {@link ISession.customize}. (default: true)
 * @param properties.loadSdtf Option to load the SDTF data. The data is not loaded by default as it can be quite large. (default: false)
 * @param properties.excludeViewports Option to exclude some viewports from the start. Can be accessed via {@link ISession.excludeViewports}.
 * @param properties.initialParameterValues The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified.
 * @param properties.allowOutputLoading Option to allow the outputs to be loaded, or to prevent them from being loaded. (default: true)
 * @param properties.modelStateId The optional model state id to use for the session. If not provided, no model state will be loaded.
 * @param properties.modelStateValidationMode The optional model state validation mode to use for the session. If not provided, the default validation mode of the Geometry SDK will be used.
 * @returns
 */
export const createSession = async (
	properties: SessionCreationDefinition,
): Promise<ISessionApi> => {
	const logger: Logger = Logger.instance;
	const inputValidator: InputValidator = InputValidator.instance;
	const creationControlCenterSession: CreationControlCenterSession =
		CreationControlCenterSession.instance;

	if (creationControlCenterSession.updateSessions === undefined)
		creationControlCenterSession.updateSessions = updateSessions;

	showConsoleMessage();

	logger.debug(
		`createSession: Creating and initializing session with properties ${JSON.stringify(properties)}.`,
	);
	// input validation
	inputValidator.validateAndError("createSession", properties, "object");
	inputValidator.validateAndError(
		"createSession",
		properties.ticket,
		"string",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.guid,
		"string",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.modelViewUrl,
		"string",
	);
	inputValidator.validateAndError(
		"createSession",
		properties.jwtToken,
		"string",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.id,
		"string",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.waitForOutputs,
		"boolean",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.loadOutputs,
		"boolean",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.loadSdtf,
		"boolean",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.excludeViewports,
		"stringArray",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.initialParameterValues,
		"object",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.allowOutputLoading,
		"boolean",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.modelStateId,
		"string",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.modelStateValidationMode,
		"boolean",
		false,
	);
	inputValidator.validateAndError(
		"createSession",
		properties.ignoreUnknownParams,
		"boolean",
		false,
	);
	if (properties.initialParameterValues)
		for (const p in properties.initialParameterValues)
			inputValidator.validateAndError(
				"createSession",
				properties.initialParameterValues[p],
				"string",
			);

	// we either expect a ticket or guid + jwtToken, error if we get both
	if (properties.ticket !== undefined && properties.guid !== undefined)
		throw new ShapeDiverViewerSessionError(
			"createSession: A ticket and a guid were provided for the session creation. Please only provide one or the other. The session was not created.",
		);

	// we either expect a ticket or guid + jwtToken, error if we get none
	if (properties.ticket === undefined && properties.guid === undefined)
		throw new ShapeDiverViewerSessionError(
			"createSession: Neither a ticket nor a guid were provided for the session creation. Please provide one or the other. The session was not created.",
		);

	// we either expect a guid + jwtToken, error if the jwtToken is missing
	if (properties.guid !== undefined && properties.jwtToken === undefined)
		throw new ShapeDiverViewerSessionError(
			"createSession: When creating a session with a guid, a jwtToken is required, please provide one. The session was not created.",
		);

	if (properties.waitForOutputs === undefined)
		properties.waitForOutputs = true;
	if (properties.loadOutputs === undefined) properties.loadOutputs = true;

	const sessionEngine =
		await creationControlCenterSession.createSessionEngine(properties);
	sessions[sessionEngine.id] = new SessionApi(sessionEngine);
	return sessions[sessionEngine.id];
};
