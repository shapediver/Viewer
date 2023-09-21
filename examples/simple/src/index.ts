import * as SDV from '@shapediver/viewer';
import {
  createSession,
  createViewport,
  IHBAOEffectDefinition,
  ISSAOEffectDefinition,
  POST_PROCESSING_EFFECT_TYPE
} from '@shapediver/viewer';
import { mat4, vec3 } from 'gl-matrix';
import * as THREE from "three";

(<any>window).SDV = SDV;

(async () => {

  let promises = [];
  for (let i = 1; i <= 4; i++) {
    promises.push(createViewport({
      canvas: document.getElementById("canvas" + i) as HTMLCanvasElement,
      id: "myViewport" + i,
      visibility: SDV.VISIBILITY_MODE.INSTANT
    }));
  }
  await Promise.all(promises);

  // create a session
  const session1 = await createSession({
    ticket:
      "95aa45115f2bfa0e9501127bf9c9f392c977792e44c62c6b2a5575133426c4066ead20626932b8c199eec88594bbc03a80854a6d06f3db775880a00df465c8bd3e53dd290464b51c69f4afad03e8bbe80f0a70b7dc9896a43ca4c75eaa97dc11713e1bacd650d1-6c09ff8204f1fce099cde4b86dd74ba5",
    modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
    id: "mySession1",
    excludeViewports: ["myViewport2", "myViewport4"]
  });

  // create a session 2
  const session2 = await createSession({
    ticket:
      "95aa45115f2bfa0e9501127bf9c9f392c977792e44c62c6b2a5575133426c4066ead20626932b8c199eec88594bbc03a80854a6d06f3db775880a00df465c8bd3e53dd290464b51c69f4afad03e8bbe80f0a70b7dc9896a43ca4c75eaa97dc11713e1bacd650d1-6c09ff8204f1fce099cde4b86dd74ba5",
    modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
    id: "mySession2",
    excludeViewports: ["myViewport1", "myViewport3"]
  });
  session2.node.addTransformation({
    id: "scale",
    matrix: mat4.fromScaling(mat4.create(), vec3.fromValues(1000, 1000, 1000))
  })
  session2.node.updateVersion();



  SDV.viewports["myViewport1"].postProcessing.addEffect({
    properties: {
      resolutionScale: 1, spp: 8, distance: 3, distanceIntensity: 0.5, intensity: 10, color: "#000000",
      iterations: 1, radius: 15, rings: 4, lumaPhi: 10, depthPhi: 2, normalPhi: 3.25, samples: 16
    },
    type: POST_PROCESSING_EFFECT_TYPE.SSAO
  });
  SDV.viewports["myViewport1"].camera?.zoomTo();

  SDV.viewports["myViewport2"].postProcessing.addEffect({
    properties: {
      resolutionScale: 1, spp: 8, distance: 3, distanceIntensity: 0.5, intensity: 10, color: "#000000",
      iterations: 1, radius: 15, rings: 4, lumaPhi: 10, depthPhi: 2, normalPhi: 3.25, samples: 16
    },
    type: POST_PROCESSING_EFFECT_TYPE.SSAO
  });
  SDV.viewports["myViewport2"].camera?.zoomTo();

  SDV.viewports["myViewport3"].postProcessing.addEffect({
    properties: {
      resolutionScale: 1, spp: 8, distance: 2, distanceIntensity: 1, intensity: 5, color: "#000000", bias: 10, thickness: 0.5,
      iterations: 1, radius: 15, rings: 4, lumaPhi: 10, depthPhi: 2, normalPhi: 3.25, samples: 16
    },
    type: POST_PROCESSING_EFFECT_TYPE.HBAO
  })
  SDV.viewports["myViewport3"].camera?.zoomTo();

  SDV.viewports["myViewport4"].postProcessing.addEffect({
    properties: {
      resolutionScale: 1, spp: 8, distance: 2, distanceIntensity: 1, intensity: 5, color: "#000000", bias: 10, thickness: 0.5,
      iterations: 1, radius: 15, rings: 4, lumaPhi: 10, depthPhi: 2, normalPhi: 3.25, samples: 16
    },
    type: POST_PROCESSING_EFFECT_TYPE.HBAO
  })
  SDV.viewports["myViewport4"].camera?.zoomTo();

})();
