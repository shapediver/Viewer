import {ResBase} from "@shapediver/sdk.geometry-api-sdk-v2";
import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";

import {type ISessionData} from "../interfaces/ISessionData";

export class SessionData extends AbstractTreeNodeData implements ISessionData {
	#instance: boolean = false;
	#responseDto: ResBase;

	constructor(
		responseDto: ResBase,
		instance: boolean = false,
		id?: string,
		version?: string,
	) {
		super(id, version);
		this.#responseDto = responseDto;
		this.#instance = instance;
	}

	public get instance(): boolean {
		return this.#instance;
	}

	public set instance(value: boolean) {
		this.#instance = value;
	}

	public get responseDto(): ResBase {
		return this.#responseDto;
	}

	public set responseDto(value: ResBase) {
		this.#responseDto = value;
	}

	public clone(): ISessionData {
		return new SessionData(
			this.responseDto,
			this.instance,
			this.id,
			this.version,
		);
	}
}
