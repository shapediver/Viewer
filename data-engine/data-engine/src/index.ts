import { DataEngine } from './DataEngine';
import { GlobalAccessObjects } from '@shapediver/viewer.shared.global-access-objects';

export {
    DataEngine
};

const instance = DataEngine.instance;
GlobalAccessObjects.instance.loadContent = instance.loadContent.bind(instance);