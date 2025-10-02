import {GlobalAccessObjects} from "@shapediver/viewer.shared.global-access-objects";
import {MaterialDatabaseEngine} from "./MaterialDatabaseEngine";

export {MaterialDatabaseEngine};
const instance = MaterialDatabaseEngine.instance;
GlobalAccessObjects.instance.assignMaterialFromDatabase =
	instance.assignMaterialFromDatabase.bind(instance);
