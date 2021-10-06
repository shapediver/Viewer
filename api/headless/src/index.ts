import { container } from 'tsyringe'
import {
  AbstractTreeNodeData,
  ITransformation,
  ITreeNodeData,
  Tree,
  TreeNode,
} from '@shapediver/viewer.shared.node-tree'
import { CustomData, GeometryData, MaterialData, SDTFAttributeData, SDTFAttributeOverview, SDTFItemData, SDTFAttributesData, PRIMITIVETYPEHINT, GEOMETRYTYPEHINT, SDTFOverview, SDTFAttributeVisualization, ATTRIBUTEVISUALIZATION, AnimationTrack, AnimationData } from '@shapediver/viewer.shared.types'
import { EVENTTYPE, LOGGINGLEVEL } from '@shapediver/viewer.shared.services'
import { SessionData, SessionOutputData } from '@shapediver/viewer.session-engine.session-engine'
import { ShapeDiverResponseExportDefinitionType as EXPORTTYPE } from '@shapediver/api.geometry-api-dto-v1'

import { Api } from './implementation/Api'
import { Output } from './implementation/session/Output'
import { Export } from './implementation/session/Export'
import { Session } from './implementation/session/Session'
import { Parameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from './implementation/session/Parameter'
import { FileParameter } from './implementation/session/FileParameter'
import { IApi } from './interfaces/IApi'
import { IExport } from './interfaces/session/IExport'
import { IFileParameter } from './interfaces/session/IFileParameter'
import { IOutput } from './interfaces/session/IOutput'
import { IParameter } from './interfaces/session/IParameter'
import { ISession } from './interfaces/session/ISession'

export const api: Api = <Api>container.resolve(Api);

export {
    LOGGINGLEVEL, EVENTTYPE, EXPORTTYPE, PARAMETERTYPE, PARAMETERVISUALIZATION
}

export {
    Api, Session, Parameter, Export, Output, FileParameter
}
export {
    IApi, ISession, IParameter, IExport, IOutput, IFileParameter
}

export {
    Tree, TreeNode, ITransformation, ITreeNodeData, AbstractTreeNodeData, CustomData, GeometryData, AnimationData, AnimationTrack, MaterialData, SessionData, SessionOutputData
}

export {
    SDTFAttributeData, SDTFAttributeOverview, SDTFOverview, SDTFItemData, SDTFAttributesData, PRIMITIVETYPEHINT, GEOMETRYTYPEHINT, SDTFAttributeVisualization, ATTRIBUTEVISUALIZATION
}