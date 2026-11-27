import {type RaycasterParameters} from "three";
import {
	IntersectionEngine,
	type InstanceSlotCache,
} from "./implementation/IntersectionEngine";
import {
	NodeBoundsHierarchy,
	type IInstanceSlot,
	type INodeBoundsEntry,
	type IRayThresholds,
} from "./implementation/NodeBoundsHierarchy";
import {
	setPickGuards,
	type IChangeGuard,
	type IPickGuards,
} from "./implementation/PickGuards";
import {SelectionBox} from "./implementation/SelectionBox";
import {type IIntersectionEngine} from "./interfaces/IIntersectionEngine";
import {type ISelectionBox} from "./interfaces/ISelectionBox";

export {IntersectionEngine, NodeBoundsHierarchy, SelectionBox, setPickGuards};
export type {
	IChangeGuard,
	IInstanceSlot,
	IIntersectionEngine,
	INodeBoundsEntry,
	InstanceSlotCache,
	IPickGuards,
	IRayThresholds,
	ISelectionBox,
	RaycasterParameters,
};
