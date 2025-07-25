import {ResOutputChunk} from "@shapediver/sdk.geometry-api-sdk-v2";
import {AbstractTreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {IChunkData} from "../../interfaces/data/IChunkData";

export class ChunkData extends AbstractTreeNodeData implements IChunkData {
	readonly #chunk: ResOutputChunk;

	constructor(chunk: ResOutputChunk) {
		super(chunk.id);
		this.#chunk = chunk;
	}

	get id(): string {
		return this.#chunk.id;
	}

	get name(): string {
		return this.#chunk.name;
	}

	get typeHint(): string {
		return this.#chunk.typeHint;
	}

	get tooltip(): string | undefined {
		return this.#chunk.tooltip;
	}

	get displayname(): string {
		return this.#chunk.displayname;
	}

	get hidden(): boolean {
		return this.#chunk.hidden;
	}

	clone(): IChunkData {
		return new ChunkData(this.#chunk);
	}
}
