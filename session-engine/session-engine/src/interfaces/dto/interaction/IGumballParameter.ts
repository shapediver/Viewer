import { IInteractionParameter } from './IInteractionParameter';
import { IParameter } from '../IParameter';
import { IGumballParameterProps } from '@shapediver/viewer.shared.types';

export interface IGumballParameter extends IParameter<string>, IInteractionParameter, IGumballParameterProps { }
