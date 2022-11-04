// Notes on CodeSandBox
// if you don't see a preview when you load this page for the first time, reload the browser tab to the right

import {
  createSession,
  createViewport,
  ENVIRONMENT_MAP,
  SPINNER_POSITIONING,
  VISIBILITY_MODE
} from "@shapediver/viewer";
import { StageManager } from "./core/StageManager";
import { stage1 } from "./stages/Stage1";
import { stage2 } from "./stages/Stage2";
import { stage3 } from "./stages/Stage3";
import { stage4 } from "./stages/Stage4";
import { stage5 } from "./stages/Stage5";
import { stage6 } from "./stages/Stage6";

if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  window.document.addEventListener(
    "touchmove",
    (e) => {
      if ((<any>e).scale !== 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

(async () => {
  // create a viewport
  const viewport = await createViewport({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    visibility: VISIBILITY_MODE.MANUAL,
    branding: {
      backgroundColor: "#3e547d", // NOTE UI: This color should be the same as clearColor below and the background in the index.html file.
      spinnerPositioning: SPINNER_POSITIONING.TOP_RIGHT,
      // NOTE CHRIS: To show another logo, just replace this link
      logo: "https://viewer.shapediver.com/v3/graphics/logo_animated_breath.svg"
    }
  });

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(<string>prop),
  });
  let ticket = decodeURIComponent((<any>params).ticket);
  ticket = ticket === "null" ? "5f90b57a6bcd97dca94c010494f4e23f47efac14d0d9d7f5bdd08e38663d7c6b9e83e7956265e3aa02d4055719cffbba6321cfaee76b385950f782ef573ee89faa0b285890e7fd192229f17e6678586156f6c794e574ecd7be9c7cb2bfac8fea0a33d04270fcdf-97bd452e64cf5427cd7abe2231817147" : ticket;
  // create a session
  const session = await createSession({
    // NOTE CHRIS: If you upload a new model, just replace the ticket here. You can find the new ticket on the platform in the embedding tab.
    ticket,
    modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
    loadOutputs: false
  });

  // all of these viewport settings can be set on the platform
  // I simply did that here to always have the same style, no matter which model was provided
  viewport.createLightScene();
  viewport.environmentMap = ENVIRONMENT_MAP.PHOTO_STUDIO;
  viewport.ambientOcclusion = false;
  viewport.shadows = false;
  viewport.groundPlaneVisibility = false;
  viewport.gridVisibility = false;
  // NOTE UI: This color should be the same as backgroundColor above and the background in the index.html file.
  viewport.clearColor = "#3e547d";

  // The stage manager handles the transition between different stages.
  // You can add new stages, remove them or switch the order
  // Please have a look at the IStageData interface in the StageManager.ts file,
  // there you can see the data that is provided from some stages and used by the future ones.
  const stageManager = new StageManager(
    [stage1, stage2, stage3, stage4, stage5, stage6],
    <HTMLDivElement>document.getElementById("stages"),
    viewport,
    session
  );

  // Start and automatically continue with Stage 1
  stageManager.start();
})();
