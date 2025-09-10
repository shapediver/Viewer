import {IRay} from "@shapediver/viewer.shared.types";

export interface IStrategy {
	cameraFreezeFlag: string;
	onDown(event: PointerEvent, ray: IRay): void;
	onMove(event: PointerEvent, ray: IRay): void;
	onUp(): void;
	onOut(): void;
	onKeyDown(): void;
}
