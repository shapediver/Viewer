import { IInteractionParameter } from './IInteractionParameter';
import { IParameter } from '../IParameter';
import { ISelectionParameterProps } from '@shapediver/viewer.shared.types';

export interface ISelectionParameter extends IParameter<string>, IInteractionParameter, ISelectionParameterProps { }
