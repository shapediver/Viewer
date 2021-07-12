import "reflect-metadata"
import { api } from "@shapediver/viewer"

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;

const modelViewUrls = {
    'eu-central-1': 'https://sdeuc1.eu-central-1.shapediver.com',
    'eu-central-2': 'https://sddev2.eu-central-1.shapediver.com',
    'us-east-1': 'https://model-view.shapediver.com',
}

const models: { [key: string]: { ticket: string, modelViewUrl: string }} = 
{
    'BoxAndPoints': { 
        ticket: 'ead5496b55f2c8cc9ce9d6a5ec9eb8338093fd6a458f38d82e19c7d57022e0931a9106bb20a8c822c20319cd66b7a233c7abf6670612c5a3d68dde1389356faa66c75901ae74c4bcd8fa92efd860092179d073fcbb882b8702f251280dfd28a4ce92ac6c8f758a9dace40fbb8650eec38a42a7e36eb2896997c330e28767b2ca-ec47cfc49ebbcef7746c6f9883e42e33',
        modelViewUrl: modelViewUrls['us-east-1']
    },
    'CubeMizator': {
        ticket: 'b9deea346b988b90b45ef359be0e57d3325fb8e089c33008a5c7e41b5a3020b1ba16b5f4926c9d487037cf128455653573096649deee8415afa220b4ec27565e28178f2193c9f66366361de05e866e9c91e0c44f278261692f7c778dbf3ee3c53a139526fded5aea8aa8a52f19a9fc20aed1eab5f6da22eac8e0eff4b8ca4ddd-df2cbd31660c1cd9d38673d8362b9466', 
        modelViewUrl: modelViewUrls['eu-central-1'], 
    },
    'Material Test': { 
        ticket: '1e8922035033c9be1e33706b0f57e8b0049387c0a7f6c328b0e9a60de60c77934dc71ecce2efca2c64f24e765e0e56f9bfc18eadcb176e823c51434474997791b4b73615981c685ab1c75d08e986fd7d83763c3021ffaa7b399c8a9bd8de4010542cf9f45a5b525ceeb2b3b63654fe9d6a9310c006-2f92cac8002b6a3ab84643205ee94dcf',
        modelViewUrl: modelViewUrls['eu-central-2']
    },
    'Pointillist': { 
        ticket: 'd5b7a2dbb34e54e05dbbd86d5c626b427557636ba743186e3bcbc3103abfda3b2ae3cc722cfa191b493bfb0e72e873cebe39a629ea908e8080d9d68ce45d8c3de8ec8dd680822c03cfe3b636ea3132a7c1da75cf97a56c4918570c7f3766c7b5da29c04eb6904b4c33ec5118420c3ab7b027d1d6b6cb1422c7d8eafd58d61f34-618144e478003c9e4ca81db572d929fc',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Sdgtf_All_Types': { 
        ticket: 'e96c426ed1b983bb05ceb78145e6da83eaf111e6da9fca3b2c97d8447c3706930df7825932421d14100886f6967059330f25c3c12b08ce47d150bea84ea9fe4f3541ee7b1cbdb16c5735899871155bfddb76d82ff664155530ea143995a317653a5ab2de3799affbcfd3075af2c53cb8e40f26b2eba37d00f71c74c7c1a5ffd8-a23d9dc0e103d57f8ccd89b6f1d1e951',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Test 5': { 
        ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Test model for all supported parameter types': { 
        ticket: 'c9f558e0f553bea84f8e540f1c561aff8fad4015b07d89fab2f2048e8b1fae0a3f61d3538ac8a3966f6827cbe4e4cf867c86f60df63d026a2757db15495ccb99b230337cfb21e03697e14d3593d7a8d7b8fc52fc4f142a686104deb6fb2e884a80a827314097ac1a603bd10065a1129efc28719d93fe0d9760ee83187c4f3012-92b182e5dbe03bc50a6f4e1dabf27def',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
};


(async () => {
    const { ticket, modelViewUrl } = models['Material Test'];
    let session = await api.createAndInitializeSession({ ticket: 'd5b7a2dbb34e54e05dbbd86d5c626b427557636ba743186e3bcbc3103abfda3b2ae3cc722cfa191b493bfb0e72e873cebe39a629ea908e8080d9d68ce45d8c3de8ec8dd680822c03cfe3b636ea3132a7c1da75cf97a56c4918570c7f3766c7b5da29c04eb6904b4c33ec5118420c3ab7b027d1d6b6cb1422c7d8eafd58d61f34-618144e478003c9e4ca81db572d929fc', modelViewUrl: modelViewUrls['eu-central-1'], id: 'mySession'});
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
})();