import {type Color} from "../../types";

/** A material-level interaction effect that preserves the current material. */
export interface IPulseEffectDefinition {
	type: "pulse";
	/** Pulse color. Defaults to the viewer interaction green. */
	color?: Color;
	/** Maximum additive emissive intensity. Defaults to 0.3. */
	intensity?: number;
	/** Pulse speed. Defaults to 1.4. */
	pulseSpeed?: number;
}
