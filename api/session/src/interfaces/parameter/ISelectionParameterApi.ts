import { IParameterApi } from './IParameterApi';
import { ISelectionParameterSettings } from '@shapediver/viewer.shared.types';

export interface ISelectionParameterApi extends IParameterApi<string>, ISelectionParameterSettings {}
