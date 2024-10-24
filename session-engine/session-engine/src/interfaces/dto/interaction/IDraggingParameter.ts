import { IInteractionParameter } from './IInteractionParameter';
import { IParameter } from '../IParameter';
import { IDraggingParameterProps } from '@shapediver/viewer.shared.types';

export interface IDraggingParameter extends IParameter<string>, IInteractionParameter, IDraggingParameterProps { }
