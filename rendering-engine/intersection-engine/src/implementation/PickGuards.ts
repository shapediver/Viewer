/**
 * Tells a cache whether the scene it was built from is still the same. The
 * rendering engine's `SceneCacheGuard` has this shape; the intersection engine
 * does not depend on the rendering engine, so it only knows the shape.
 */
export interface IChangeGuard {
	/** Nothing the cache watches changed since `markBuilt`. */
	isValid(): boolean;
	/** Call after the cache was built from the current scene. */
	markBuilt(): void;
}

/**
 * The guards of the picking caches of one viewport. A viewport hands them in
 * when it is created, with `setPickGuards`.
 */
export interface IPickGuards {
	/**
	 * Valid while no node of the scene moved, was shown or hidden, got new
	 * geometry, was added or removed, and while the scene is static. The
	 * bounds of the objects are then still what they were.
	 */
	readonly bounds: IChangeGuard;
	/**
	 * `bounds`, and no material changed. A highlight moves an instance to
	 * another slot of another instanced mesh, which only changes the
	 * material.
	 */
	readonly instances: IChangeGuard;
}

const guards = new Map<string, IPickGuards>();

/**
 * Sets (or with `undefined` removes) the guards the bounds hierarchies of a
 * viewport use to skip their validation while the scene is unchanged.
 * Without guards a hierarchy compares its objects with the scene on every
 * query.
 */
export function setPickGuards(
	viewportId: string,
	pickGuards: IPickGuards | undefined,
): void {
	if (pickGuards) guards.set(viewportId, pickGuards);
	else guards.delete(viewportId);
}

/** The guards of the viewport, if it handed some in. */
export function pickGuardsOf(viewportId: string): IPickGuards | undefined {
	return guards.get(viewportId);
}
