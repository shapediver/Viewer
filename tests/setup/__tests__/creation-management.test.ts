import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import * as ShapeDiverViewer from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');
const shelfTicket = sdeuc1.models['Shelf'].ticket;
const ringTicket = sdeuc1.models['Ring'].ticket;

let driver: webdriver.WebDriver;
let name = 'creation_management';

describe('viewer / session', () => {
    beforeAll(async () => {
        driver = await createDriver();
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/demos/viewer3_restructuring_1/cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    test(name + "_vs0_vis_S_ss_F", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewer = await SDV.createViewport({ 
                id: 'myViewer', 
                canvas: <HTMLCanvasElement>document.getElementById('canvas')
            })
            let session = await SDV.createSession({ 
                id: 'mySession', 
                ticket, 
                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
            });

            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "/vs0_vis_S_ss_F");
    });

//     test(name + "_vs0_vis_I_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_I_ss_F');
//     });

//     test(name + "_vs0_vis_M_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_M_ss_F');
//     });

    
    
    
//     test(name + "_vs0_vis_S_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_S_ss_N');
//     });

//     test(name + "_vs0_vis_I_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_I_ss_N');
//     });

//     test(name + "_vs0_vis_M_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_M_ss_N');
//     });



//     test(name + "_vs0_vis_S_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_S_ss_M');
//     });

//     test(name + "_vs0_vis_I_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_I_ss_M');
//     });

//     test(name + "_vs0_vis_M_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs0_vis_M_ss_M');
//     });

//      test(name + "_vs1_vis_S_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas')
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_S_ss_F');
//     });

//     test(name + "_vs1_vis_I_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_I_ss_F');
//     });

//     test(name + "_vs1_vis_M_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_M_ss_F');
//     });

    
    
    
//     test(name + "_vs1_vis_S_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_S_ss_N');
//     });

//     test(name + "_vs1_vis_I_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_I_ss_N');
//     });

//     test(name + "_vs1_vis_M_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_M_ss_N');
//     });

    

//     test(name + "_vs1_vis_S_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_S_ss_M');
//     });

//     test(name + "_vs1_vis_I_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_I_ss_M');
//     });

//     test(name + "_vs1_vis_M_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/vs1_vis_M_ss_M');
//     });
//     test(name + "_vs2_vis_S_ss_F", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas')
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_S_ss_F');
//    });

//    test(name + "_vs2_vis_I_ss_F", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                visibility: SDV.VISIBILITY_MODE.INSTANT
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_I_ss_F');
//    });

//    test(name + "_vs2_vis_M_ss_F", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                visibility: SDV.VISIBILITY_MODE.MANUAL
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_M_ss_F');
//    });

   
   
   
//    test(name + "_vs2_vis_S_ss_N", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_S_ss_N');
//    });

//    test(name + "_vs2_vis_I_ss_N", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                visibility: SDV.VISIBILITY_MODE.INSTANT
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_I_ss_N');
//    });

//    test(name + "_vs2_vis_M_ss_N", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                visibility: SDV.VISIBILITY_MODE.MANUAL
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_M_ss_N');
//    });

   

//    test(name + "_vs2_vis_S_ss_M", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsId: 'mySession',
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_S_ss_M');
//    });

//    test(name + "_vs2_vis_I_ss_M", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsId: 'mySession',
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                visibility: SDV.VISIBILITY_MODE.INSTANT
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_I_ss_M');
//    });

//    test(name + "_vs2_vis_M_ss_M", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsId: 'mySession',
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                visibility: SDV.VISIBILITY_MODE.MANUAL
//            })
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/vs2_vis_M_ss_M');
//    });
//     beforeAll(async () => {
//         driver = await createDriver();
//     });

//     beforeEach(async () => {
//         await driver.navigate().to('https://viewer.shapediver.com/v3/latest/cdn/index.html')
//     });

//     afterAll(async () => {
//         await driver.close();
//         await driver.quit();
//     })

//     test(name + "_sv0_vis_S_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas')
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_S_ss_F');
//     });

//     test(name + "_sv0_vis_I_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_I_ss_F');
//     });

//     test(name + "_sv0_vis_M_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_M_ss_F');
//     });

    
    
    
//     test(name + "_sv0_vis_S_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_S_ss_N');
//     });

//     test(name + "_sv0_vis_I_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_I_ss_N');
//     });

//     test(name + "_sv0_vis_M_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_M_ss_N');
//     });



//     test(name + "_sv0_vis_S_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_S_ss_M');
//     });

//     test(name + "_sv0_vis_I_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_I_ss_M');
//     });

//     test(name + "_sv0_vis_M_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv0_vis_M_ss_M');
//     });
//      test(name + "_sv1_vis_S_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas')
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_S_ss_F');
//     });

//     test(name + "_sv1_vis_I_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_I_ss_F');
//     });

//     test(name + "_sv1_vis_M_ss_F", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_M_ss_F');
//     });

    
    
    
//     test(name + "_sv1_vis_S_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_S_ss_N');
//     });

//     test(name + "_sv1_vis_I_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_I_ss_N');
//     });

//     test(name + "_sv1_vis_M_ss_N", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_M_ss_N');
//     });

    

//     test(name + "_sv1_vis_S_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_S_ss_M');
//     });

//     test(name + "_sv1_vis_I_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.INSTANT
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_I_ss_M');
//     });

//     test(name + "_sv1_vis_M_ss_M", async () => {
//         await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//             const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//             let session = await SDV.createSession({ 
//                 id: 'mySession', 
//                 ticket, 
//                 modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                 loadOutputs: false 
//             });
//             let viewer = await SDV.createViewport({ 
//                 id: 'myViewer', 
//                 canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                 sessionSettingsId: 'mySession',
//                 sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                 visibility: SDV.VISIBILITY_MODE.MANUAL
//             })
//             cb();
//         }, shelfTicket);
//         await screenshotCompare(await driver.takeScreenshot(), name + '/sv1_vis_M_ss_M');
//     });
//     test(name + "_sv2_vis_S_ss_F", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas')
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_S_ss_F');
//    });

//    test(name + "_sv2_vis_I_ss_F", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                visibility: SDV.VISIBILITY_MODE.INSTANT
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_I_ss_F');
//    });

//    test(name + "_sv2_vis_M_ss_F", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                visibility: SDV.VISIBILITY_MODE.MANUAL
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_M_ss_F');
//    });

   
   
   
//    test(name + "_sv2_vis_S_ss_N", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_S_ss_N');
//    });

//    test(name + "_sv2_vis_I_ss_N", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                visibility: SDV.VISIBILITY_MODE.INSTANT
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_I_ss_N');
//    });

//    test(name + "_sv2_vis_M_ss_N", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.NONE,
//                visibility: SDV.VISIBILITY_MODE.MANUAL
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_M_ss_N');
//    });

   

//    test(name + "_sv2_vis_S_ss_M", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsId: 'mySession',
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_S_ss_M');
//    });

//    test(name + "_sv2_vis_I_ss_M", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsId: 'mySession',
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                visibility: SDV.VISIBILITY_MODE.INSTANT
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_I_ss_M');
//    });

//    test(name + "_sv2_vis_M_ss_M", async () => {
//        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
//            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
//            let session = await SDV.createSession({ 
//                id: 'mySession', 
//                ticket, 
//                modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
//                waitForOutputs: false 
//            });
//            let viewer = await SDV.createViewport({ 
//                id: 'myViewer', 
//                canvas: <HTMLCanvasElement>document.getElementById('canvas'),
//                sessionSettingsId: 'mySession',
//                sessionSettingsMode: SDV.SESSION_SETTINGS_MODE.MANUAL,
//                visibility: SDV.VISIBILITY_MODE.MANUAL
//            })
//            cb();
//        }, shelfTicket);
//        await screenshotCompare(await driver.takeScreenshot(), name + '/sv2_vis_M_ss_M');
//    });
});
