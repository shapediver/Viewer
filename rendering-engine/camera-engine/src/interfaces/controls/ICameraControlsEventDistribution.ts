import { IDomEventListener } from "@shapediver/viewer.shared.services";

export interface ICameraControlsEventDistribution extends IDomEventListener {
    reset(): void;
}