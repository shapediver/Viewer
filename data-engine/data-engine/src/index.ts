import {GlobalAccessObjects} from "@shapediver/viewer.shared.global-access-objects";
import {DataEngine} from "./DataEngine";

export {DataEngine};

const instance = DataEngine.instance;
GlobalAccessObjects.instance.loadContent = instance.loadContent.bind(instance);
