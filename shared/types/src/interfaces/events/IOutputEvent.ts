import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { IEvent } from "@shapediver/viewer.shared.services";

export interface IOutputEvent extends IEvent {
    outputId: string,
    outputVersion: string,
    newNode?: ITreeNode,
    oldNode?: ITreeNode
}