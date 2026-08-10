import {type Color} from "../../types";

/** A material-level interaction effect that preserves the current material. */
export interface IPulseEffectDefinition {
	type: "pulse";
	/** Pulse color. Defaults to the viewer interaction green. */
	color?: Color;
	/**
	 * Maximum blend factor between the original material color and the pulse
	 * color. When both colors are nearly equal, a softened inverse-color fallback
	 * keeps the pulse visible. For transparent materials, this also controls an
	 * eased interpolation from the base opacity toward fully opaque.
	 * Defaults to 0.3.
	 */
	intensity?: number;
	/** Pulse speed. Defaults to 1.4. */
	pulseSpeed?: number;
}
