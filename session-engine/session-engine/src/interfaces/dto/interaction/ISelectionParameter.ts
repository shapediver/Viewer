import { IInteractionParameter } from './IInteractionParameter';
import { IParameter } from '../IParameter';
import { ISelectionParameterSettings } from '@shapediver/viewer.shared.types';

export interface ISelectionParameter extends IParameter<string>, IInteractionParameter, ISelectionParameterSettings { }
