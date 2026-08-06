import {GumballTransform} from "./implementation/gumballTransform/GumballTransform";
import {RectangleTransform} from "./implementation/rectangleTransform/RectangleTransform";
import {type EventResponseMapping} from "./interfaces/events/EventResponseMapping";
import {type ITransformationToolsEvent} from "./interfaces/events/ITransformationToolsEvent";
import {
	type GumballTransformSettings,
	type IGumballTransform,
} from "./interfaces/gumballTransform/IGumballTransform";
import {type IGumballTransformEvent} from "./interfaces/gumballTransform/IGumballTransformEvent";
import {type Settings} from "./interfaces/ITransformationToolsManager";
import {
	type IRectangleTransform,
	type RectangleTransformSettings,
} from "./interfaces/rectangleTransform/IRectangleTransform";
import {type IRectangleTransformEvent} from "./interfaces/rectangleTransform/IRectangleTransformEvents";
import {updateTransformation} from "./updateTransformation";

export {GumballTransform, RectangleTransform, updateTransformation};
export type {
	EventResponseMapping,
	GumballTransformSettings,
	IGumballTransform,
	IGumballTransformEvent,
	IRectangleTransform,
	IRectangleTransformEvent,
	ITransformationToolsEvent,
	RectangleTransformSettings,
	Settings as TransformationToolsSettings,
};
