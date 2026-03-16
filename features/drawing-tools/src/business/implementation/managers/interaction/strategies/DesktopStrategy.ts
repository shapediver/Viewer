import {IViewportApi} from "@shapediver/viewer";
import {SelectionBox} from "@shapediver/viewer.rendering-engine.intersection-engine";
import {
	GeometryMathManager,
	IRestrictionManager,
} from "@shapediver/viewer.rendering-engine.intersection-restriction-engine";
import {FLAG_TYPE, IRay} from "@shapediver/viewer.shared.types";

import {vec3} from "gl-matrix";

import {MATERIAL_INDEX} from "../../../../interfaces/IDrawingToolsManager";
import {DrawingToolsManager} from "../../../DrawingToolsManager";
import {InsertionInteractionHandler} from "../handlers/InsertionInteractionHandler";
import {MidPointInteractionHandler} from "../handlers/MidPointInteractionHandler";
import {InteractionManagerHelper} from "../helpers/InteractionManagerHelper";
import {InteractionManager} from "../InteractionManager";
import {IStrategy} from "../interfaces/IStrategy";

/**
 * ## Quick Reference - Main Event Flow:
 *
 * **Mouse Down** → Initiate interaction (box selection, insertion, point selection)
 * **Mouse Move** → Update previews, handle dragging, provide feedback
 * **Mouse Up** → Finalize operations, apply changes, cleanup state
 * **Mouse Out** → Pause operations, cleanup visual feedback
 * **Key Down** → Execute commands (insert, confirm, cancel, delete)
 *
 * ## Interaction State Priority:
 * 1. **Box Selection** (Alt + drag) - Highest priority, blocks other interactions
 * 2. **Active Insertion** - Continuous point placement mode
 * 3. **Point Dragging** - Moving selected points
 * 4. **Point Selection** - Single/multi-point selection
 * 5. **Mid-point Insertion** - Insert between existing points
 * 6. **Hover Detection** - Visual feedback only
 *
 * See DesktopStrategy.md for detailed workflow documentation.
 */

/**
 * DesktopStrategy - Handles desktop mouse and keyboard interactions for drawing tools
 *
 * This class implements the Strategy pattern to provide desktop-specific interaction handling
 * for drawing tools. It manages various interaction modes including point insertion, selection,
 * dragging, and box selection.
 *
 * ## Main Interaction Workflows:
 *
 * ### 1. Point Insertion Workflow:
 * - User clicks to start insertion mode
 * - Mouse movements update the insertion preview
 * - Click again to finalize point placement
 * - Supports auto-start for empty drawings
 *
 * ### 2. Point Selection & Dragging Workflow:
 * - Click on existing points to select them
 * - Drag selected points to move them
 * - Multiple selection support with modifier keys
 *
 * ### 3. Box Selection Workflow:
 * - Alt + drag to create selection box
 * - Shift = additive selection, Ctrl = removal selection
 * - All points within box are selected/deselected
 *
 * ### 4. Mid-point Insertion Workflow:
 * - Hover over line segments to show mid-point preview
 * - Click to insert point between existing points
 *
 * ## Key Features:
 * - Camera freeze during interactions
 * - Visual feedback through cursor changes
 * - Material updates for hover/selection states
 * - Keyboard shortcuts for common operations
 * - Restriction-based point placement
 */
export class DesktopStrategy implements IStrategy {
	private static readonly CLICK_THRESHOLD_SQUARED = 25; // 5px threshold squared
	private static readonly COORDINATE_STEP = 3; // Number of coordinates per point (x, y, z)

	// Priority-based cursor tracking across all DesktopStrategy instances:
	// only reset to "default" when no instance is hovering or dragging.
	static readonly #hoveringInstances: Set<string> = new Set();
	static readonly #draggingInstances: Set<string> = new Set();

	readonly #drawingToolsManager: DrawingToolsManager;
	readonly #geometryMathManager: GeometryMathManager;
	readonly #insertionInteractionHandler: InsertionInteractionHandler;
	readonly #interactionManager: InteractionManager;
	readonly #interactionManagerHelper: InteractionManagerHelper;
	readonly #midPointInteractionHandler: MidPointInteractionHandler;
	readonly #restrictionManager: IRestrictionManager;
	readonly #selectionBox: SelectionBox;
	readonly #viewport: IViewportApi;

	#boxHoveredPoints: number[] = [];
	#cameraFreezeFlag: string = "";
	#isBoxSelecting: boolean = false;
	#lastEvent?: PointerEvent;
	#lastMoveEvent?: PointerEvent;
	#onDownPointer?: PointerEvent;

	constructor(
		drawingToolsManager: DrawingToolsManager,
		interactionManager: InteractionManager,
	) {
		this.#drawingToolsManager = drawingToolsManager;
		this.#interactionManager = interactionManager;
		this.#viewport = drawingToolsManager.viewport;
		this.#geometryMathManager =
			this.#drawingToolsManager.geometryMathManager;
		this.#restrictionManager = this.#interactionManager.restrictionManager;
		this.#insertionInteractionHandler =
			this.#interactionManager.insertionInteractionHandler;
		this.#midPointInteractionHandler =
			this.#interactionManager.midPointInteractionHandler;
		this.#interactionManagerHelper =
			this.#interactionManager.interactionManagerHelper;
		this.#selectionBox = new SelectionBox(this.#viewport.canvas);
	}

	public get cameraFreezeFlag(): string {
		return this.#cameraFreezeFlag;
	}

	/**
	 * Handles mouse/pointer down events - Entry point for most interaction workflows
	 *
	 * ## Workflow Priority:
	 * 1. **Box Selection** (Alt + Click): Initiates rectangular selection mode
	 * 2. **Insertion Finalization**: If insertion is active, finalizes current point and starts new insertion
	 * 3. **Point Interaction**: Handles hover detection, selection, and dragging initiation
	 * 4. **Right Click**: Cancels current operation
	 *
	 * ## State Changes:
	 * - Sets camera freeze flag for dragging/box selection
	 * - Updates selection state
	 * - Triggers mid-point insertion completion
	 * - Starts dragging mode for selected points
	 *
	 * @param event - Pointer event containing mouse button and modifier key information
	 * @param ray - 3D ray from camera through mouse position for intersection testing
	 */
	public onDown(event: PointerEvent, ray: IRay): void {
		if (event.button === 0) {
			this.#onDownPointer = event;
			this.#interactionManagerHelper.moving = false;

			// Handle box selection initiation
			if (this.handleBoxSelectionStart(event)) {
				return;
			}

			// Handle insertion finalization and restart
			if (this.handleInsertionFinalization(event, ray)) {
				return;
			}

			// Calculate point distances for hover and selection logic
			const distances = this.#geometryMathManager.checkPointDistances(
				ray,
				this.#drawingToolsManager.positionArray,
			);

			// Handle mid-point insertion
			this.handleMidPointInsertion(distances);

			// Check hover state
			this.#interactionManagerHelper.checkHover(distances, ray);

			// Handle point selection and dragging
			this.handlePointSelection(distances);
		} else if (event.button === 2) {
			// Right mouse button - cancel current operation
			this.onOut();
		}
	}

	/**
	 * Handles keyboard input for drawing tool controls
	 *
	 * ## Supported Operations:
	 *
	 * ### Confirm Key (typically Enter):
	 * - **During Insertion**: Finalizes insertion and updates drawing
	 * - **Normal Mode**: Updates/commits current drawing state
	 *
	 * ### Cancel Key (typically Escape):
	 * - **During Insertion**: Stops insertion mode
	 * - **Normal Mode**: Cancels entire drawing operation
	 *
	 * ### Insert Key (typically Space):
	 * - Starts insertion mode at current mouse position
	 * - Shows restriction visualization
	 *
	 * ### Delete Key (typically Delete/Backspace):
	 * - Removes currently selected points from drawing
	 *
	 * ## Workflow Integration:
	 * These keyboard shortcuts provide alternative ways to control the drawing workflow
	 * without relying solely on mouse interactions.
	 */
	public onKeyDown(): void {
		const keys = this.getKeyStates();

		// Handle confirm key
		if (keys.confirm) {
			if (
				this.#interactionManager.insertionInteractionHandler
					.insertionActive
			) {
				this.stopInsertion();
				this.#drawingToolsManager.update();
			} else {
				this.#drawingToolsManager.update();
			}
		}

		// Handle cancel key
		if (keys.cancel) {
			if (
				this.#interactionManager.insertionInteractionHandler
					.insertionActive
			) {
				this.stopInsertion();
			} else {
				this.#drawingToolsManager.cancel();
			}
		}

		// Handle insert key
		if (keys.insert) {
			this.startInsertion();
		}

		// Handle delete key
		if (keys.delete) {
			this.#interactionManager.deleteSelection();
		}
	}

	/**
	 * Handles mouse/pointer movement - Core interaction processing for all movement-based workflows
	 *
	 * ## Primary Workflows:
	 *
	 * ### 1. Box Selection Mode (when #isBoxSelecting = true):
	 * - Updates selection rectangle bounds
	 * - Provides real-time hover feedback for points within selection
	 * - Respects modifier keys (Shift=add, Ctrl=remove)
	 *
	 * ### 2. Insertion Workflows:
	 * - **Auto-start**: Automatically begins insertion for empty drawings
	 * - **Resume**: Restarts paused insertions when mouse re-enters valid area
	 * - **Active insertion**: Updates insertion preview position
	 * - **Pause**: Pauses insertion when mouse leaves restricted area
	 *
	 * ### 3. Point Manipulation:
	 * - **Dragging**: Moves selected points when dragging is active
	 * - **Hover detection**: Updates hover state for visual feedback
	 * - **Mid-point insertion**: Shows preview for inserting points between existing ones
	 *
	 * ### 4. Visual Feedback:
	 * - **Cursor updates**: Changes cursor based on interaction state (grab, pointer, default)
	 * - **Material updates**: Updates point colors for hover/selection states
	 * - **Text visualization**: Updates position indicator text
	 *
	 * ## Movement Detection:
	 * Uses CLICK_THRESHOLD_SQUARED to distinguish between clicks and drags,
	 * preventing accidental dragging on small mouse movements.
	 *
	 * @param event - Pointer event with current mouse position and modifier keys
	 * @param ray - 3D ray for intersection testing and point placement
	 */
	public onMove(event: PointerEvent, ray: IRay): void {
		// Track the last move event for modifier key states
		this.#lastMoveEvent = event;

		// Handle box selection movement
		if (this.#isBoxSelecting) {
			// Pass the current shift/ctrl state to determine selection behavior
			const isAdditive = event.shiftKey;
			const isRemoval = event.ctrlKey;
			this.#selectionBox.onMove(event, isAdditive, isRemoval);

			// Update hover effects for points inside the selection box
			this.updateBoxSelectionHover();
			return;
		}

		let currentRestrictedPoint: vec3 | undefined;

		// Handle automatic start and insertion resume
		currentRestrictedPoint =
			this.handleAutoStart(event) || currentRestrictedPoint;
		currentRestrictedPoint =
			this.handleInsertionResume(event) || currentRestrictedPoint;

		const pointerMoved = this.hasPointerMoved(event);
		this.#interactionManagerHelper.moving = pointerMoved;

		if (pointerMoved) {
			this.#lastEvent = event;

			// Handle point dragging
			currentRestrictedPoint =
				this.#interactionManagerHelper.moveSelectedPoints(ray) ||
				currentRestrictedPoint;
		}

		// Check point distances and hover state
		const distances = this.#geometryMathManager.checkPointDistances(
			ray,
			this.#drawingToolsManager.positionArray,
		);
		this.#interactionManagerHelper.checkHover(distances, ray);

		if (pointerMoved) {
			// Handle insertion movement
			currentRestrictedPoint =
				this.handleInsertionMove(ray) || currentRestrictedPoint;

			// Handle mid-point insertion
			this.handleMidPointMove(ray);
		}

		// Update cursor and handle insertion pause
		this.updateCursor();
		this.handleInsertionPause(currentRestrictedPoint);

		this.#drawingToolsManager.textVisualizationManager.updatePointerPosition(
			currentRestrictedPoint,
		);
	}

	/**
	 * Handles mouse leave/out events - Cleanup and state reset
	 *
	 * ## Cleanup Operations:
	 * - **Restriction visualization**: Hides visual guides for point placement restrictions
	 * - **Insertion pause**: Temporarily stops insertion mode (can be resumed on mouse re-enter)
	 * - **Hover state**: Clears any hovered point indicators
	 * - **General reset**: Calls reset() to clean up interaction state
	 *
	 * ## Use Cases:
	 * - Mouse leaves the drawing area/viewport
	 * - Right-click cancellation
	 * - Focus loss events
	 *
	 * This ensures the UI returns to a clean state when interaction is interrupted.
	 */
	public onOut(): void {
		this.#restrictionManager.showRestrictionVisualization = false;
		this.#insertionInteractionHandler.pauseInsertion();
		this.#interactionManagerHelper.onOut();
		this.#clearCursorState();
		this.reset();
	}

	/**
	 * Handles mouse/pointer up events - Finalization of click/drag operations
	 *
	 * ## Primary Operations:
	 *
	 * ### Box Selection Completion:
	 * When box selection is active (#isBoxSelecting = true):
	 * 1. **Finalize selection**: Ends the selection rectangle operation
	 * 2. **Process intersections**: Determines which points are within the selection box
	 * 3. **Apply selection logic**: Handles modifier keys for add/remove/toggle selection
	 * 4. **Visual cleanup**: Updates material indices and resets hover states
	 * 5. **State reset**: Clears box selection flags and data
	 *
	 * ### General Cleanup:
	 * For all other operations:
	 * - **End dragging**: Stops any active point dragging operations
	 * - **Camera unfreeze**: Removes camera movement restrictions
	 * - **State reset**: Returns to default interaction state
	 *
	 * ## Workflow Integration:
	 * This method completes the interaction cycle started by onDown(),
	 * ensuring proper cleanup and state transitions for all operation types.
	 *
	 * @param event - Pointer event with final mouse position and modifier key states
	 */
	public onUp(event: PointerEvent): void {
		// Handle box selection completion
		if (this.#isBoxSelecting) {
			this.#selectionBox.onEnd(event);
			this.handleBoxSelection(event);

			// Clear box hovered points, last move event, and update material indices for all points
			this.#boxHoveredPoints = [];
			this.#updateAllPointMaterials();
			this.#lastMoveEvent = undefined;

			this.#isBoxSelecting = false;
			this.#selectionBox.reset();
		}

		this.#interactionManagerHelper.onUp();
		this.reset();
	}

	/**
	 * Convert position array to array of vec3 points
	 */
	private convertPositionArrayToPoints(): vec3[] {
		if (
			!this.#drawingToolsManager.positionArray ||
			this.#drawingToolsManager.positionArray.length === 0
		) {
			return [];
		}

		const points: vec3[] = [];
		for (
			let i = 0;
			i < this.#drawingToolsManager.positionArray.length;
			i += DesktopStrategy.COORDINATE_STEP
		) {
			points.push(
				vec3.fromValues(
					this.#drawingToolsManager.positionArray[i],
					this.#drawingToolsManager.positionArray[i + 1],
					this.#drawingToolsManager.positionArray[i + 2],
				),
			);
		}
		return points;
	}

	/**
	 * Get the current state of control keys
	 */
	private getKeyStates() {
		return {
			insert: this.#drawingToolsManager.keyPressed(
				this.#drawingToolsManager.settings.controls.insert,
			),
			cancel: this.#drawingToolsManager.keyPressed(
				this.#drawingToolsManager.settings.controls.cancel,
			),
			confirm: this.#drawingToolsManager.keyPressed(
				this.#drawingToolsManager.settings.controls.confirm,
			),
			delete: this.#drawingToolsManager.keyPressed(
				this.#drawingToolsManager.settings.controls.delete,
			),
		};
	}

	/**
	 * Enables automatic insertion start for empty drawings to improve user experience
	 *
	 * ## Auto-start Conditions:
	 * 1. **Setting enabled**: `autoStart` setting must be enabled
	 * 2. **No active insertion**: Insertion mode is not currently active
	 * 3. **Empty drawing**: No points exist in the current drawing
	 *
	 * ## Workflow Benefits:
	 * - Eliminates need to press insert key for first point
	 * - Creates smoother initial user experience
	 * - Reduces friction for starting new drawings
	 *
	 * @param event - Pointer event to cache for insertion start
	 * @returns Restricted point position if insertion started, undefined otherwise
	 */
	private handleAutoStart(event: PointerEvent): vec3 | undefined {
		if (
			this.#drawingToolsManager.settings.general.autoStart &&
			this.#insertionInteractionHandler.insertionActive === false &&
			this.#drawingToolsManager.getPointsData().length === 0
		) {
			this.#lastEvent = event;
			return this.startInsertion();
		}
		return undefined;
	}

	/**
	 * Processes box selection completion and applies selection logic based on modifier keys
	 *
	 * ## Selection Logic Workflow:
	 * 1. **Point conversion**: Converts position array to 3D points for intersection testing
	 * 2. **Intersection calculation**: Determines which points are within the selection box
	 * 3. **Modifier key handling**:
	 *    - **Shift**: Additive selection (adds points to existing selection)
	 *    - **Ctrl**: Removal selection (removes points from existing selection)
	 *    - **None**: Toggle selection (default behavior - toggles each point's selection state)
	 *
	 * ## Integration with Selection System:
	 * - Uses InteractionManagerHelper methods for consistent selection behavior
	 * - Maintains selection state across different interaction modes
	 * - Respects existing selection when using modifier keys
	 *
	 * @param event - Optional pointer event for modifier key state (fallback to last move event)
	 */
	private handleBoxSelection(event?: PointerEvent): void {
		const points = this.convertPositionArrayToPoints();
		if (points.length === 0) {
			return;
		}

		// Get intersected point indices
		const intersectedIndices = this.#selectionBox.intersectPoints(points);

		// Use the last move event for modifier key state, fallback to provided event
		const currentEvent = this.#lastMoveEvent || event;

		// Handle selection based on modifier keys from the last move event
		if (currentEvent?.shiftKey) {
			// Shift key: add to selection
			intersectedIndices.forEach((index) => {
				this.#interactionManagerHelper.selectPoint([
					{index, distance: 0},
				]);
			});
		} else if (currentEvent?.ctrlKey) {
			// Ctrl key: remove from selection
			intersectedIndices.forEach((index) => {
				this.#interactionManagerHelper.deselectPoint(index);
			});
		} else {
			// No modifier key: replace selection (default behavior)
			intersectedIndices.forEach((index) => {
				this.#interactionManagerHelper.toggleSelection(index);
			});
		}
	}

	/**
	 * Initiates box selection mode when Alt key is pressed during mouse down
	 *
	 * ## Workflow:
	 * 1. **Validation**: Checks if Alt key is pressed
	 * 2. **State setup**: Sets box selection flag and initializes selection box
	 * 3. **Camera control**: Freezes camera to prevent viewport movement during selection
	 * 4. **Event binding**: Connects selection box to camera projection for accurate 3D selection
	 *
	 * ## Visual Feedback:
	 * - Selection rectangle appears on screen
	 * - Camera movement is disabled
	 * - Cursor indicates selection mode
	 *
	 * @param event - Pointer event to check for Alt key modifier
	 * @returns true if box selection was initiated, false otherwise
	 */
	private handleBoxSelectionStart(event: PointerEvent): boolean {
		if (!event.altKey) return false;

		this.#isBoxSelecting = true;
		if (this.#viewport.camera) {
			this.#selectionBox.onDown(
				event,
				this.#viewport.camera.project.bind(this.#viewport.camera),
			);
		}
		if (!this.#cameraFreezeFlag) {
			this.#cameraFreezeFlag = this.#viewport.addFlag(
				FLAG_TYPE.CAMERA_FREEZE,
			);
		}
		return true;
	}

	/**
	 * Manages the insertion workflow when insertion mode is already active
	 *
	 * ## Insertion Finalization Workflow:
	 * 1. **Completion attempt**: Tries to finalize the current insertion point
	 * 2. **Success path**: If successful, updates the drawing and exits
	 * 3. **Continuation path**: If not finalized, starts a new insertion at click location
	 * 4. **Hover management**: Updates hover state after point distance calculations
	 *
	 * ## Use Cases:
	 * - User clicks while in insertion mode to place a point
	 * - Handles both successful point placement and insertion continuation
	 * - Maintains smooth insertion workflow for multiple point placement
	 *
	 * @param event - Pointer event for the new insertion location
	 * @param ray - 3D ray for intersection testing and point placement
	 * @returns true if insertion was processed, false if insertion mode is not active
	 */
	private handleInsertionFinalization(
		event: PointerEvent,
		ray: IRay,
	): boolean {
		if (!this.#insertionInteractionHandler.insertionActive) return false;

		const result = this.#insertionInteractionHandler.finalizeInsertion();
		const distances = this.#geometryMathManager.checkPointDistances(
			ray,
			this.#drawingToolsManager.positionArray,
		);
		this.#interactionManagerHelper.checkHover(distances, ray);

		if (result) {
			this.#drawingToolsManager.update();
			return true;
		} else {
			this.#insertionInteractionHandler.startInsertion(event);
			return true;
		}
	}

	/**
	 * Handle mouse move during insertion mode
	 */
	private handleInsertionMove(ray: IRay): vec3 | undefined {
		return this.#insertionInteractionHandler.onMove(ray);
	}

	/**
	 * Handle insertion pause when point is not restricted
	 */
	private handleInsertionPause(
		currentRestrictedPoint: vec3 | undefined,
	): void {
		if (
			!currentRestrictedPoint &&
			this.#insertionInteractionHandler.insertionActive
		) {
			this.#insertionInteractionHandler.pauseInsertion();
		}
	}

	/**
	 * Handle resuming paused insertion
	 */
	private handleInsertionResume(event: PointerEvent): vec3 | undefined {
		if (this.#insertionInteractionHandler.insertionPaused) {
			this.#lastEvent = event;
			return this.startInsertion();
		}
		return undefined;
	}

	/**
	 * Handle mid-point insertion completion
	 */
	private handleMidPointInsertion(
		distances: {index: number; distance: number}[] | undefined,
	): void {
		if (
			this.#midPointInteractionHandler.midPointInsertionActive &&
			distances
		) {
			this.#midPointInteractionHandler.finishMidPointInsertion(distances);
			this.#interactionManagerHelper.midPointInserted = true;
		}
	}

	/**
	 * Handle mid-point insertion logic during movement
	 */
	private handleMidPointMove(ray: IRay): void {
		if (
			this.#insertionInteractionHandler.insertionActive === false &&
			this.#interactionManagerHelper.dragging === false &&
			this.#interactionManagerHelper.selectedPointIndices.length === 0
		) {
			this.#midPointInteractionHandler.onMove(
				ray,
				this.#interactionManagerHelper.hoveredPoint,
			);
		}
	}

	/**
	 * Handle point selection and dragging initiation
	 */
	private handlePointSelection(
		distances: {index: number; distance: number}[] | undefined,
	): void {
		if (!distances) return;

		this.#interactionManagerHelper.selectPoint(distances);

		const draggingStarted = this.#interactionManagerHelper.startDragging();
		if (draggingStarted && !this.#cameraFreezeFlag) {
			this.#cameraFreezeFlag = this.#viewport.addFlag(
				FLAG_TYPE.CAMERA_FREEZE,
			);
		}
	}

	/**
	 * Check if pointer has moved beyond the click threshold
	 */
	private hasPointerMoved(event: PointerEvent): boolean {
		const distanceSquared = this.#onDownPointer
			? Math.pow(event.clientX - this.#onDownPointer.clientX, 2) +
				Math.pow(event.clientY - this.#onDownPointer.clientY, 2)
			: Infinity;
		return distanceSquared > DesktopStrategy.CLICK_THRESHOLD_SQUARED;
	}

	/**
	 * Comprehensive state reset for interaction cleanup
	 *
	 * ## Reset Workflow:
	 * ```
	 * Box Selection Reset → Insertion State Check → Camera Unfreeze → Helper Reset
	 *         ↓                      ↓                    ↓               ↓
	 *   Clear box flags      Check if insertion    Remove freeze     Reset selection
	 *   Reset hover states   is still active       flag if safe      and drag states
	 *   Clear tracking       Keep freeze if        Restore camera    Clean temp data
	 *   ```
	 *
	 * ## Safety Measures:
	 * - Only unfreezes camera if insertion is not active
	 * - Properly cleans up visual states for all tracked points
	 * - Ensures no orphaned state remains after interactions
	 */
	private reset(): void {
		// Reset box selection if active
		if (this.#isBoxSelecting) {
			this.#isBoxSelecting = false;
			this.#selectionBox.reset();
			this.#lastMoveEvent = undefined;

			// Clear hover effects from box hovered points
			this.#boxHoveredPoints.forEach((index) => {
				const isSelected =
					this.#interactionManagerHelper.selectedPointIndices.includes(
						index,
					);
				this.updatePointMaterial(index, isSelected, false);
			});
			this.#boxHoveredPoints = [];
		}

		if (this.#insertionInteractionHandler.insertionActive === false) {
			this.#restrictionManager.showRestrictionVisualization = false;
			this.#viewport.removeFlag(this.#cameraFreezeFlag);
			this.#cameraFreezeFlag = "";
		}
		this.#interactionManagerHelper.reset();
	}

	/**
	 * Initiates insertion mode with proper state setup
	 *
	 * ## Insertion Start Workflow:
	 * ```
	 * Enable Restrictions → Stop Mid-point → Start Insertion → Return Position
	 *         ↓                    ↓               ↓               ↓
	 *   Show visual       Clear any existing   Begin insertion    Validate and
	 *   guides for        mid-point preview    at cached event    return position
	 *   valid placement   operations           location           or undefined
	 * ```
	 *
	 * @returns Restricted point position if insertion started successfully, undefined if restricted
	 */
	private startInsertion(): vec3 | undefined {
		this.#restrictionManager.showRestrictionVisualization = true;

		this.#midPointInteractionHandler.stopMidPointInsertion();

		return this.#insertionInteractionHandler.startInsertion(
			this.#lastEvent!,
		);
	}

	/**
	 * Cleanly exits insertion mode with proper cleanup
	 *
	 * ## Insertion Stop Workflow:
	 * ```
	 * Hide Restrictions → Stop Insertion → Unfreeze Camera → Clear Flags
	 *         ↓                 ↓               ↓               ↓
	 *   Remove visual     End insertion     Restore camera    Reset freeze
	 *   guides and        handler state     movement         flag state
	 *   feedback                            capability
	 * ```
	 */
	private stopInsertion(): void {
		this.#restrictionManager.showRestrictionVisualization = false;
		this.#insertionInteractionHandler.stopInsertion();
		this.#viewport.removeFlag(this.#cameraFreezeFlag);
		this.#cameraFreezeFlag = "";
	}

	/**
	 * Update material indices for all points to ensure correct display after selection changes
	 */
	#updateAllPointMaterials(): void {
		if (
			!this.#drawingToolsManager.positionArray ||
			this.#drawingToolsManager.positionArray.length === 0
		) {
			return;
		}

		const pointCount =
			this.#drawingToolsManager.positionArray.length /
			DesktopStrategy.COORDINATE_STEP;
		const selectedIndices =
			this.#interactionManagerHelper.selectedPointIndices;
		const hoveredPoint = this.#interactionManagerHelper.hoveredPoint;

		for (let i = 0; i < pointCount; i++) {
			const isSelected = selectedIndices.includes(i);
			const isHovered = hoveredPoint === i;
			this.updatePointMaterial(i, isSelected, isHovered);
		}
	}

	/**
	 * Provides real-time visual feedback during box selection by updating hover states
	 *
	 * ## Dynamic Hover Management:
	 * 1. **Current intersection**: Calculates which points are currently in the selection box
	 * 2. **Hover removal**: Points that left the box lose their hover effect
	 * 3. **Hover addition**: Points that entered the box gain hover effect
	 * 4. **State preservation**: Maintains existing selection states while adding hover effects
	 *
	 * ## Visual Feedback:
	 * - Points inside selection box show hover material (different color/highlight)
	 * - Selected + hovered points show combined visual state
	 * - Provides immediate feedback during box drag operation
	 *
	 * ## Performance Optimization:
	 * - Only updates materials for points that changed state
	 * - Tracks previous hover state to minimize unnecessary updates
	 */
	private updateBoxSelectionHover(): void {
		const points = this.convertPositionArrayToPoints();
		if (points.length === 0) {
			return;
		}

		// Get current intersected point indices
		const currentBoxIntersectedIndices =
			this.#selectionBox.intersectPoints(points);

		// Find points that were previously hovered but are no longer in the box
		const pointsToUnhover = this.#boxHoveredPoints.filter(
			(index) => !currentBoxIntersectedIndices.includes(index),
		);

		// Find points that are newly in the box
		const pointsToHover = currentBoxIntersectedIndices.filter(
			(index) => !this.#boxHoveredPoints.includes(index),
		);

		// Remove hover effect from points no longer in the box
		pointsToUnhover.forEach((index) => {
			const isSelected =
				this.#interactionManagerHelper.selectedPointIndices.includes(
					index,
				);
			this.updatePointMaterial(index, isSelected, false);
		});

		// Add hover effect to points newly in the box
		pointsToHover.forEach((index) => {
			const isSelected =
				this.#interactionManagerHelper.selectedPointIndices.includes(
					index,
				);
			this.updatePointMaterial(index, isSelected, true);
		});

		// Update the tracked hovered points
		this.#boxHoveredPoints = currentBoxIntersectedIndices;
	}

	/**
	 * Remove this instance from the global cursor-priority tracking sets.
	 * Called when the pointer leaves the canvas so this instance no longer
	 * blocks the cursor from resetting to "default".
	 */
	#clearCursorState(): void {
		const uuid = this.#drawingToolsManager.uuid;
		DesktopStrategy.#draggingInstances.delete(uuid);
		DesktopStrategy.#hoveringInstances.delete(uuid);
	}

	/**
	 * Update cursor based on current interaction state across all active instances.
	 * Uses a priority of: grabbing > pointer > default, so that having two
	 * drawing-tool instances active at once (e.g. rectangle + rotation handle in
	 * Fireball) does not cause the second instance to override a valid "pointer"
	 * cursor set by the first.
	 */
	private updateCursor(): void {
		const uuid = this.#drawingToolsManager.uuid;
		if (this.#interactionManagerHelper.dragging) {
			DesktopStrategy.#draggingInstances.add(uuid);
			DesktopStrategy.#hoveringInstances.delete(uuid);
		} else if (this.#interactionManagerHelper.hoveredPoint !== undefined) {
			DesktopStrategy.#hoveringInstances.add(uuid);
			DesktopStrategy.#draggingInstances.delete(uuid);
		} else {
			DesktopStrategy.#draggingInstances.delete(uuid);
			DesktopStrategy.#hoveringInstances.delete(uuid);
		}

		if (DesktopStrategy.#draggingInstances.size > 0) {
			document.body.style.cursor = "grabbing";
		} else if (DesktopStrategy.#hoveringInstances.size > 0) {
			document.body.style.cursor = "pointer";
		} else {
			document.body.style.cursor = "default";
		}
	}

	/**
	 * Update material index for a single point based on its state
	 */
	private updatePointMaterial(
		index: number,
		isSelected: boolean,
		isHovered: boolean,
	): void {
		let materialIndex: MATERIAL_INDEX;
		if (isSelected && isHovered) {
			materialIndex = MATERIAL_INDEX.SELECTED_HOVERED;
		} else if (isSelected) {
			materialIndex = MATERIAL_INDEX.SELECTED;
		} else if (isHovered) {
			materialIndex = MATERIAL_INDEX.HOVERED;
		} else {
			materialIndex = MATERIAL_INDEX.DEFAULT;
		}

		this.#drawingToolsManager.updateMaterialIndex(index, materialIndex);
	}
}
