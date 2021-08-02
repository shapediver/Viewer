import 'reflect-metadata'

import { api } from '@shapediver/viewer'

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
    'Bracket': { 
        ticket: 'a6706408ad551e105d3c1f026fd735db6e341637d1f0161b86a01db3d61328ce8252976641745030df0757767f38524c95daa92e96383a9a61c53f9cc1011430dcaecc27a0be1091cb384e83ff5178b5b8ad6baf27a9eb733c5706397bc9240e0d0249d3bb2d30ae7575b59c3bd57b075c5f9552d300fd4499b223aea5d99419-0bb47d77082189b06d3500b4c329be52',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Coral': { 
        ticket: 'b66e4927343abbfe6f18c38eb160c2120a7b9012e7e10bab4b6666137f1e37ac219c151ce457ec0a896b52fc838c0f9a10c1b36d597c7ff138e0f6ec4179cdf108a56fb1fc802164e74fa3550a03909f38dbb97c7d71fa62cbac58021419889ab819ea122edc59d94b759483824de6d016b6e32087fa06b1ac9a8bdb2c40d321-1f039bfad2e2af6ac84da5c7916c5f71',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'CubeMizator': {
        ticket: 'b9deea346b988b90b45ef359be0e57d3325fb8e089c33008a5c7e41b5a3020b1ba16b5f4926c9d487037cf128455653573096649deee8415afa220b4ec27565e28178f2193c9f66366361de05e866e9c91e0c44f278261692f7c778dbf3ee3c53a139526fded5aea8aa8a52f19a9fc20aed1eab5f6da22eac8e0eff4b8ca4ddd-df2cbd31660c1cd9d38673d8362b9466', 
        modelViewUrl: modelViewUrls['eu-central-1'], 
    },
    'Donau City': { 
        ticket: 'c5a3d0e56b3cae3d3cd8aef1a4f4c6e2faf2ad949173676d1fa85a3565a9b0ec062f07fc780ba8df27d162ca2796fc31f381f204ccfab89f223cd259d2ca8f1ce13f8aeaddc49c6b710d40c072a114c77815f19c3b2d8ca7aa8eb7848c6a06ef756b4e302cd19811c08eef298f216bcac2dfa59a34-c5b926b079fb1e63e38a576edf2a7838',
        modelViewUrl: modelViewUrls['eu-central-2']
    },
    'Material Test': { 
        ticket: '1e8922035033c9be1e33706b0f57e8b0049387c0a7f6c328b0e9a60de60c77934dc71ecce2efca2c64f24e765e0e56f9bfc18eadcb176e823c51434474997791b4b73615981c685ab1c75d08e986fd7d83763c3021ffaa7b399c8a9bd8de4010542cf9f45a5b525ceeb2b3b63654fe9d6a9310c006-2f92cac8002b6a3ab84643205ee94dcf',
        modelViewUrl: modelViewUrls['eu-central-2']
    },
    'Pointillist': { 
        ticket: 'd5b7a2dbb34e54e05dbbd86d5c626b427557636ba743186e3bcbc3103abfda3b2ae3cc722cfa191b493bfb0e72e873cebe39a629ea908e8080d9d68ce45d8c3de8ec8dd680822c03cfe3b636ea3132a7c1da75cf97a56c4918570c7f3766c7b5da29c04eb6904b4c33ec5118420c3ab7b027d1d6b6cb1422c7d8eafd58d61f34-618144e478003c9e4ca81db572d929fc',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Perforated Panel': { 
        ticket: '96397ab9f94076b64885c3ff3a83cf23178bec2263fffa1dd1766a6778b25090a1a9caef95f267d22309d0c96438075246395b835991d4305fe534f53953153f164b872714e1bed6a004e99fe768c561a1efd3d4eff83cf2cfea1e3b37b03e5a9860102741e7819d97dc37249827c421dd0562415c5bde10eb5eb033b3e07fc1-5575b7a8fe6e3a53825ed5d052675142',
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
    'Test Texture': { 
        ticket: '1eea8b3f90167ec21f51d020b74185af24ffb458c92b0169cef937046669cde4ac5fcab314a89ecb9014ba2320ba23d9da69c005d4083bd6982f66cd1b4d45a5241b3a123d5013c64f562fb16c2168575c318e6a8017c6b49e1e7a63e0936830042ffd92d2ead06e6db0c899eaf4ac30ae2fa0927f3d932b610df8bf286093d1-b0adeb03344a0179fd05f99f42303d52',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
};


(async () => {
    const { ticket, modelViewUrl } = models['Bracket'];
    let session = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession'});
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
})();