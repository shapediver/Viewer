import { ITreeNode } from "@shapediver/viewer.shared.node-tree";
import { GeometryData, AnimationData } from "@shapediver/viewer.shared.types";

/**
 * Check if a bone is contained in the hierarchy.
 * 
 * @param bone 
 * @param node 
 * @returns 
 */
const hasBoneInHierarchy = (bone: ITreeNode, node: ITreeNode): boolean => {
    if (bone === node) return true;

    for (let l = 0; l < node.children.length; l++)
        if (hasBoneInHierarchy(bone, node.children[l]))
            return true;

    return false;
}

/**
 * Find the node with the specified original ID.
 * 
 * @param node 
 * @param originalId 
 * @returns 
 */
const findNodeWithOriginalId = (node: ITreeNode, originalId: string): ITreeNode | undefined => {
    if (node.originalId === originalId) return node;

    for (let i = 0; i < node.children.length; i++) {
        const returnedNode = findNodeWithOriginalId(node.children[i], originalId);
        if (returnedNode) return returnedNode;
    }

    return;
}

/**
 * Helper function to add the bones of a skin to the nodes.
 * 
 * @param node 
 * @param skin 
 */
const addBones = (node: ITreeNode, skin: ITreeNode) => {
    for (let j = 0; j < node.data.length; j++)
        if (node.data[j] instanceof GeometryData)
            (<GeometryData>node.data[j]).skinNode = skin;

    for (let l = 0; l < node.children.length; l++)
        addBones(node.children[l], skin)
}

/**
 * To copy a skin and the corresponding bones from one node to another,
 * we have have to use this utiliry function.
 * 
 * It checks first if skins and all bones of these skins are available in the node.
 * 
 * It then adjusts the skins and the animation data.
 */
const cloneSkinData = (originalNode: ITreeNode, clonedNode: ITreeNode) => {
    // animation data has references to nodes, we need to adjust those
    const adjustAnimationData = (node: ITreeNode) => {
        for (let j = 0; j < node.data.length; j++) {
            if (node.data[j] instanceof AnimationData) {
                const anim = <AnimationData>node.data[j];
                const tracks = anim.tracks;
                anim.tracks = [];
                for (let i = 0; i < tracks.length; i++)
                    anim.tracks.push({
                        interpolation: tracks[i].interpolation,
                        node: findNodeWithOriginalId(clonedNode, tracks[i].node.originalId)!,
                        path: tracks[i].path,
                        pivot: tracks[i].pivot,
                        times: tracks[i].times,
                        values: tracks[i].values,
                    })

                node.updateVersion();
            }
        }


        for (let l = 0; l < node.children.length; l++)
            adjustAnimationData(node.children[l])
    }
    adjustAnimationData(clonedNode)


    // check if there are skins in the hierarchy
    const skins: ITreeNode[] = [];
    const skinsInHierarchy = (node: ITreeNode) => {
        if (node.skinNode) skins.push(node)

        for (let i = 0; i < node.children.length; i++)
            skinsInHierarchy(node.children[i])
    }
    skinsInHierarchy(originalNode);


    let allIn = true;
    // check if all bones of the skins are in the hierarchy
    for (let i = 0; i < skins.length; i++) {
        const skin = skins[i];
        for (let j = 0; j < skin.bones.length; j++) {
            const bone = skin.bones[j];
            allIn = allIn && hasBoneInHierarchy(bone, originalNode);

        }
    }

    // bones are missing, we exit before doing anything
    if (!allIn) return;

    for (let i = 0; i < skins.length; i++) {
        const skin = skins[i];

        // find cloned skinNode
        const skinClone = findNodeWithOriginalId(clonedNode, skin.originalId);
        if (!skinClone) continue;

        const bonesClone: ITreeNode[] = [];
        for (let j = 0; j < skin.bones.length; j++) {
            const bone = skin.bones[j];
            const boneClone = findNodeWithOriginalId(clonedNode, bone.originalId);
            if (!boneClone) continue;
            bonesClone.push(boneClone)
        }

        skinClone.skinNode = true;
        skinClone.bones = bonesClone;
        skinClone.boneInverses = skin.boneInverses;

        addBones(skinClone, skinClone);
    }
}

const NodeTreeUtils = {
    cloneSkinData, addBones, hasBoneInHierarchy, findNodeWithOriginalId
}

export {
    NodeTreeUtils
}