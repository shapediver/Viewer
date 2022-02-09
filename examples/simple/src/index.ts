import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({ 
        ticket: '5dbb5117b630fb83a8056f06ee719f570a904be69ac45152822c327f33d21483a8dae9e3122ae17c992ea6b3e2b65af09ac9871dd83a263ef488e58b2c2260a07899418548bd4a8dcf1cff3ca33954c9e4c0fe60118f730d03c56b7e598eab908b34e16ba8625d-b5ac96869614191d8ada6725aba8fba6', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession',
        bearerToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvYXBwLnNoYXBlZGl2ZXIuY29tXC9hcGlcL3YxXC90b2tlbnMiLCJzdWIiOiJjNmI4NTA1OS0wOTBkLTRmNTItYTRlMi1mMDUyYzk2NGMxZDQiLCJhdWQiOiI1YTk3NzE2OC1mNDlkLTQzZWEtODA2My1jODljYzkwNDIzMzUiLCJleHAiOjE2NDMyMTAxMjQsInNjb3BlIjoiZ3JvdXAudmlldyBncm91cC5leHBvcnQgZ3JvdXAub3duZXIiLCJpYXQiOjE2NDMyMDY1MjQsInNkX3VzZXJfaWQiOiJlYjFmNWJhNy1jY2NkLTExZWItOWFhYS0wZTk4ZDY0ZDE2ODUifQ.RwmLnWzmkKXDfeEfthd6LK6Ntmr_fve2ZZnDa1c5LDQ7-xf3DyjqaECRE7jlpkuOOqMpYUDHbq-tKDOeXiDZOzBKZsKLe7KDJ1Lk2G--jN7gS43VlFC-XppN1hkNhXh6V29eNk_qAXKyfcogIPmVdVwOi7MpqZJcHBENSP06heA1ZEiT9zkHSO0yHNRJgNtvyp14JRtkQtC1f_oNzQ1Dt8CQjnIAxB99ladrkokzthhwfrCEYYxFKiPrn6XzYf2djKQeNVl449ViqXFd9WKuUEemav1H6Skg7nUyaCy23Tdg_CBAEI2IUG0Z6mXLCf2VVZ-GHCzRE4afh2G9Jog6gw'
    });
})();