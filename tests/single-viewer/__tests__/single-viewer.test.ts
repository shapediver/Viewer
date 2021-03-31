import { api as API, RENDERERTYPE, CAMERATYPE, LIGHTTYPE } from "@shapediver/viewer"
import { getPage, screenshotCompare } from "./setup"

const tests: {
    ticket: string,
    modelViewUrl: string
}[] = 
[
    { modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', ticket: 'affa36eb1031f3cd6175477dc4d76b785e2ca1c6a70c36adabc1d9547c11660a2957f4ba5e4f55a16225af626c2f25be90d944d355938fd35fc03daaaf9c56cbc85f0c6c7325aeb956145b3a030ad4aa217eefaf2d977b2815aefec5e87912ea1b731507ff24f9109cf74b0aa0eebcea9b9e7b3c807a-8b9959c9e647a0d633136750b78fbf61' },
    { modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', ticket: 'c779ad9d41eb135de16cd86e6c84ca821f2fdc60c76f7a1041cc2ec8a93895a646a1d4995e59360559f3a7308b6bd6c1a3287fe3dfe1f205637f078c08dfc49ad03b63074a21a1f3f2bd0b11e019df687920c51d948b8ab9908eb7c3ea95cd00147d79cdc8c44dc950769c7da5cbcd528ae9ceb132d7-6f70a69df8698f79a7e01fcdd6d012f7' },
    { modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', ticket: 'e51b4ad7f2a48b5d74b8e9577bba490904af396c17da1d6a297202f41d3cdf3c39300400da579ccc2e39e8be2b8f1eaff7ace85a24e5e24a7ac9ab9b3911414e9ed2972edad63d3c22b203a3583a9d71e130174b62486a5f4e021199c2b2dd19f2105d00d5de13871ac43cc8c6ec67ebf998f84d2785-d4fef6e9a8e2d892d16a865c8790035d' },
    { modelViewUrl: 'https://model-view.shapediver.com', ticket: 'fcb5a8e69b1fbae77220bc96ab99fdbf78366e654134b742fde89eb6da2ac45fa7d93c18b9ff4b5c83b294070f15e5bced46682fce8e98115b53bf27638e31a42f59eb13504a37d3cdebabaf436fa80ab110c741e0ff1a87bf539e34c9582d85eb7ffc9577ee8226c36983864409450e41fec7112563d8c09c6d5d1716331aedd664bdafeb2854aa5a453817f7486be63524ee4ea55cdf2aaa6f800ca71df684e4070ad0539c9ad2eb4a2cebd7b662da-0370ba0ac3f10a692668c866913d177c' },
    { modelViewUrl: 'https://model-view.shapediver.com', ticket: '08604322ae00919a2e3327a3306b6f1b4783a72da11955c5bb78172ebe66d1a9a7755ec557c159131fdb62fc5fd04465e834b2ff61862f4adaa6ff190974d2eb06be50132b49611d5f3694a7deefefb1bb16ae6cb5e7ab430db23518a5c4e50b4637a58b010cfb550825163ca1b00c6e705eebcbe4a01638c43dea01af9e383ce8dfadb63f80105a8e4084ee5186d7922ba967749fad3a6a1edf5bc2ebea8f2c9b2076188906101dd101918e0bace852-16d7dc18c624d6d463b2be8f9bfbc58a' },
];

describe('screenshot tests', () => {
    for(let i = 0; i < tests.length; i++) {
        it('simple screenshot test ' + tests[i].ticket, async () => {
            const page = await getPage('temp');
    
            // DO SOMETHING WITH THE API
            await page.evaluate(async (ticket, modelViewUrl) => {
                const api: typeof API = (<any>window).api; 
                let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
                let session = await api.createSession({ ticket, modelViewUrl });
                viewer.show = true;
            }, tests[i].ticket, tests[i].modelViewUrl);
            
            // TAKE A SCREENSHOT
            await screenshotCompare('simple_screenshot_test_' + i);
        });
    }
});