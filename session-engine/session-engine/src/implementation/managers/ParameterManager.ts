import {type ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {Logger} from "@shapediver/viewer.shared.services";
import {PARAMETER_TYPE} from "@shapediver/viewer.shared.types";

import {vec3} from "gl-matrix";

import {type IParameter} from "../../interfaces/dto/IParameter";
import {FileParameter} from "../dto/FileParameter";
import {DrawingParameter} from "../dto/interaction/DrawingParameter";
import {Parameter} from "../dto/Parameter";
import {SessionEngineCore} from "../SessionEngineCore";

/**
 * Manager responsible for parameters.
 *
 * The manager is created by the SessionEngineCore and can be accessed
 * via the `parameterManager` property.
 */
export class ParameterManager {
	private readonly _logger = Logger.instance;
	private readonly _parameterValues: {[key: string]: string} = {};
	private readonly _parameters: {[key: string]: IParameter<unknown>} = {};
	private readonly _sessionEngineCore: SessionEngineCore;

	private _ignoreUnknownParams?: boolean;
	private _parameterHistory: {
		[key: string]: {
			value: unknown;
			valueString: string;
		};
	}[] = [];
	private _parameterHistoryCall = false;
	private _parameterHistoryForward: {
		[key: string]: {
			value: unknown;
			valueString: string;
		};
	}[] = [];

	constructor(sessionEngineCore: SessionEngineCore) {
		this._sessionEngineCore = sessionEngineCore;
	}

	public get ignoreUnknownParams(): boolean | undefined {
		return this._ignoreUnknownParams;
	}

	public set ignoreUnknownParams(value: boolean | undefined) {
		this._ignoreUnknownParams = value;
	}

	public get parameterHistory(): {
		[key: string]: {
			value: unknown;
			valueString: string;
		};
	}[] {
		return this._parameterHistory;
	}

	public get parameterHistoryCall(): boolean {
		return this._parameterHistoryCall;
	}

	public set parameterHistoryForward(
		value: {
			[key: string]: {
				value: unknown;
				valueString: string;
			};
		}[],
	) {
		this._parameterHistoryForward = value;
	}

	public get parameterValues(): {[key: string]: string} {
		return this._parameterValues;
	}

	public get parameters(): {[key: string]: IParameter<unknown>} {
		return this._parameters;
	}

	/**
	 * Checks whether it is possible to go back in the parameter history.
	 *
	 * @returns True if it is possible to go back, false otherwise.
	 */
	public canGoBack(): boolean {
		// the first entry is always the one from the init call
		// all additional entries can be undone
		return this._parameterHistory.length > 1;
	}

	/**
	 * Checks whether it is possible to go forward in the parameter history.
	 *
	 * @returns True if it is possible to go forward, false otherwise.
	 */
	public canGoForward(): boolean {
		return this._parameterHistoryForward.length > 0;
	}

	/**
	 * Creates parameters from the session engine's response DTO.
	 *
	 * @param initialParameters
	 * @returns
	 */
	public createParametersFromDto(initialParameters?: {
		[key: string]: string;
	}): void {
		if (!this._sessionEngineCore.responseDto) return;

		const parameterSet: {
			[key: string]: {
				value: unknown;
				valueString: string;
			};
		} = {};

		for (const parameterId in this._sessionEngineCore.responseDto
			.parameters) {
			if (this.parameters[parameterId]) continue;
			this._sessionEngineCore.responseDto.parameters[parameterId].id =
				parameterId;

			switch (true) {
				case this._sessionEngineCore.responseDto.parameters[parameterId]
					.type === PARAMETER_TYPE.BOOL:
					this.parameters[parameterId] = new Parameter<boolean>(
						this._sessionEngineCore.responseDto.parameters[
							parameterId
						],
						this._sessionEngineCore,
						this,
					);
					break;
				case this._sessionEngineCore.responseDto.parameters[parameterId]
					.type === PARAMETER_TYPE.COLOR:
					this.parameters[parameterId] = new Parameter<number | vec3>(
						this._sessionEngineCore.responseDto.parameters[
							parameterId
						],
						this._sessionEngineCore,
						this,
					);
					break;
				case this._sessionEngineCore.responseDto.parameters[parameterId]
					.type === PARAMETER_TYPE.FILE:
					this.parameters[parameterId] = new FileParameter(
						this._sessionEngineCore.responseDto.parameters[
							parameterId
						],
						this._sessionEngineCore,
						this,
					);
					break;
				case this._sessionEngineCore.responseDto.parameters[parameterId]
					.type === PARAMETER_TYPE.EVEN ||
					this._sessionEngineCore.responseDto.parameters[parameterId]
						.type === PARAMETER_TYPE.FLOAT ||
					this._sessionEngineCore.responseDto.parameters[parameterId]
						.type === PARAMETER_TYPE.INT ||
					this._sessionEngineCore.responseDto.parameters[parameterId]
						.type === PARAMETER_TYPE.ODD:
					this.parameters[parameterId] = new Parameter<number>(
						this._sessionEngineCore.responseDto.parameters[
							parameterId
						],
						this._sessionEngineCore,
						this,
					);
					break;
				case this._sessionEngineCore.responseDto.parameters[parameterId]
					.type === PARAMETER_TYPE.INTERACTION:
					this.parameters[parameterId] =
						this._sessionEngineCore.utilsManager.createInteractionParameter(
							this._sessionEngineCore.responseDto.parameters[
								parameterId
							],
						);
					break;
				case this._sessionEngineCore.responseDto.parameters[parameterId]
					.type === PARAMETER_TYPE.DRAWING:
					this.parameters[parameterId] = new DrawingParameter(
						this._sessionEngineCore.responseDto.parameters[
							parameterId
						],
						this._sessionEngineCore,
						this,
					);
					break;
				default:
					this.parameters[parameterId] = new Parameter<string>(
						this._sessionEngineCore.responseDto.parameters[
							parameterId
						],
						this._sessionEngineCore,
						this,
					);
					break;
			}

			// we don't have to do larger restrictions for this as the backend would have already thrown an error if the values were not correct
			if (initialParameters) {
				let hasInitialValue = false;

				// check if the id is within the initial parameters
				if (initialParameters[parameterId] !== undefined) {
					this.parameters[parameterId].value =
						initialParameters[parameterId];
					hasInitialValue = true;
				}
				// check if the name is within the initial parameters
				else if (
					initialParameters[this.parameters[parameterId].name] !==
					undefined
				) {
					this.parameters[parameterId].value =
						initialParameters[this.parameters[parameterId].name];
					hasInitialValue = true;
				}
				// check if the displayname is within the initial parameters
				else if (
					this.parameters[parameterId].displayname &&
					initialParameters[
						this.parameters[parameterId].displayname!
					] !== undefined
				) {
					this.parameters[parameterId].value =
						initialParameters[
							this.parameters[parameterId].displayname!
						];
					hasInitialValue = true;
				}

				// if there is an initial value, we try to cast it to the correct type
				// we only do this for bool and number types, as the other types are either string or have their own parsing
				if (hasInitialValue) {
					if (
						this.parameters[parameterId].type ===
						PARAMETER_TYPE.BOOL
					) {
						if (
							typeof this.parameters[parameterId].value ===
							"string"
						) {
							this.parameters[parameterId].value =
								(
									this.parameters[parameterId].value as string
								).toLowerCase() === "true";
						}
					} else if (
						this.parameters[parameterId].type ===
							PARAMETER_TYPE.INT ||
						this.parameters[parameterId].type ===
							PARAMETER_TYPE.FLOAT ||
						this.parameters[parameterId].type ===
							PARAMETER_TYPE.EVEN ||
						this.parameters[parameterId].type === PARAMETER_TYPE.ODD
					) {
						// cast to number
						this.parameters[parameterId].value = Number(
							this.parameters[parameterId].value,
						);
					}
				}
			}

			parameterSet[parameterId] = {
				value: this.parameters[parameterId].value,
				valueString: this.parameters[parameterId].stringify(),
			};

			if (!this._sessionEngineCore.initialized)
				this.parameterValues[parameterId] =
					parameterSet[parameterId].valueString;
		}

		// store the initialization as the first parameter set in the history
		if (!this._sessionEngineCore.initialized)
			this.parameterHistory.push(parameterSet);
	}

	/**
	 * Goes one step back in the parameter history and applies the parameter values.
	 *
	 * @returns The tree node returned by the customization function.
	 */
	public async goBack(): Promise<ITreeNode> {
		if (!this.canGoBack()) {
			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).goBack: Cannot go further back.`,
			);
			return new TreeNode();
		}
		// get the current parameter set and store it in the forward history later on
		const currentParameterSet = this._parameterHistory.pop()!;

		// adjust the parameters according to the last parameter set
		const lastParameterSet =
			this._parameterHistory[this._parameterHistory.length - 1];
		for (const parameterId in lastParameterSet)
			this.parameters[parameterId].value =
				lastParameterSet[parameterId].value;

		// call the customization function with the parameterHistoryCall value set to true
		this._parameterHistoryCall = true;
		const node =
			await this._sessionEngineCore.customizationManager.customize();
		this._parameterHistoryCall = false;

		// add the current (not anymore current) parameter set to the forward history
		this._parameterHistoryForward.push(currentParameterSet);
		return node;
	}

	/**
	 * Goes one step forward in the parameter history and applies the parameter values.
	 *
	 * @returns The tree node returned by the customization function.
	 */
	public async goForward(): Promise<ITreeNode> {
		if (!this.canGoForward()) {
			this._logger.debug(
				`Session(${this._sessionEngineCore.id}).goForward: Cannot go further forward.`,
			);
			return new TreeNode();
		}
		// get the last undone parameter set and apply the values to the parameters
		const lastParameterSet = this._parameterHistoryForward.pop()!;
		for (const parameterId in lastParameterSet)
			this.parameters[parameterId].value =
				lastParameterSet[parameterId].value;

		// call the customization function with the parameterHistoryCall value set to true
		this._parameterHistoryCall = true;
		const node =
			await this._sessionEngineCore.customizationManager.customize();
		this._parameterHistoryCall = false;

		// add the current parameter set to the history
		this._parameterHistory.push(lastParameterSet);
		return node;
	}
}
