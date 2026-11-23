import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";

import {SelectManager} from "../src/implementation/managers/SelectManager";

// the viewer bundle (three.js) is not needed: the manager only uses the tree
jest.mock("@shapediver/viewer", () => ({
	Tree: {instance: {root: {traverse: () => {}}}},
}));
jest.mock("../src/implementation/utils/InteractionEffectUtils", () => ({
	InteractionEffectUtils: class {},
}));
// a node is one of the manager's nodes when it has `own: true`
jest.mock("../src/implementation/utils/InteractionManagerUtils", () => ({
	InteractionManagerUtils: {
		createInteractionFilter: () => () => (node: {own?: boolean}) =>
			!!node.own,
		validateViewport: () => true,
		getInteractionData: (node: {own?: boolean}) =>
			node.own ? {interactionStates: {}} : undefined,
		applyInteractionEffects: () => ({
			token: undefined,
			groupTokens: undefined,
		}),
		removeInteractionEffects: () => {},
		updateViewport: () => {},
	},
}));

type FakeNode = {name: string; own: boolean};

const node = (name: string, own: boolean): FakeNode => ({name, own});
const hit = (n: FakeNode) =>
	({
		type: "RayTracingIntersection",
		node: n,
		distance: 1,
		point: [0, 0, 0],
	}) as never;
const event = {} as PointerEvent;
const ray = {origin: [0, 0, 0], direction: [0, 0, -1]} as never;

describe("SelectManager.onClaimedPress", () => {
	const egg = node("egg", true);
	const car = node("car", false);
	let manager: SelectManager;
	let events: string[];
	const tokens: string[] = [];

	beforeEach(() => {
		events = [];
		tokens.push(
			EventEngine.instance.addListener(
				EVENTTYPE.INTERACTION.SELECT_ON,
				(e) => events.push("on:" + (e as {node: FakeNode}).node.name),
			),
			EventEngine.instance.addListener(
				EVENTTYPE.INTERACTION.SELECT_OFF,
				(e) => events.push("off:" + (e as {node: FakeNode}).node.name),
			),
		);
	});

	afterEach(() => {
		while (tokens.length)
			EventEngine.instance.removeListener(tokens.pop()!);
	});

	const create = (deselectOnEmpty: boolean) => {
		manager = new SelectManager("m", undefined, deselectOnEmpty);
		manager.add({id: "viewport"} as never);
		manager.onClaimedPress(event, ray, [hit(egg)], [hit(egg)]);
		expect(events).toEqual(["on:egg"]);
		events.length = 0;
	};

	it("deselects on a press on another object with deselectOnEmpty", () => {
		create(true);
		manager.onClaimedPress(event, ray, [], [hit(car)]);
		expect(events).toEqual(["off:egg"]);
	});

	it("keeps the selection on a press on another object without deselectOnEmpty", () => {
		create(false);
		manager.onClaimedPress(event, ray, [], [hit(car)]);
		expect(events).toEqual([]);
	});

	it("keeps the selection when its node is under the press but left out (the node the claiming tool acts on)", () => {
		create(true);
		manager.onClaimedPress(event, ray, [], [hit(car), hit(egg)]);
		expect(events).toEqual([]);
	});

	it("keeps the selection on a press on the selected node", () => {
		create(true);
		manager.onClaimedPress(event, ray, [hit(egg)], [hit(egg)]);
		expect(events).toEqual([]);
	});

	it("selects a pressed node after a press on another object deselected", () => {
		create(true);
		manager.onClaimedPress(event, ray, [], [hit(car)]);
		manager.onClaimedPress(event, ray, [hit(egg)], [hit(egg)]);
		expect(events).toEqual(["off:egg", "on:egg"]);
	});
});
