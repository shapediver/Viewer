import {ResBase} from "@shapediver/sdk.geometry-api-sdk-v2";
import {ITreeNodeData} from "@shapediver/viewer.shared.node-tree";

export interface ISessionData extends ITreeNodeData {
	instance: boolean;
	responseDto: ResBase;

	clone(): ISessionData;
}
