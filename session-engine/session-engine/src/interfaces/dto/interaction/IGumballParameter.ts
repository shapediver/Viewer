import { IInteractionParameter } from './IInteractionParameter';
import { IParameter } from '../IParameter';
import { IGumballParameterSettings } from '@shapediver/viewer.shared.types';

export interface IGumballParameter extends IParameter<string>, IInteractionParameter, IGumballParameterSettings { }
