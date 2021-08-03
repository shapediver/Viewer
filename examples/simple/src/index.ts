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
    'Coral': { 
        ticket: '3017a44322f7cd5dc4e1bfbe4d3e8bfdd9a265fd00c6bf2415f345c28ec76cda9a60a41f41c16af7ddc429ab1d19967469c8a5c3fb73ac8c45288a2a0387a4566ae3d45d2ff44e21493b36be5138e6b7ca92b250b4c7b6f01f7efe120d1e990df4b0237478023040c1965ad40f85043e1c4b1553bb2bc8b45777d9b5fde21f-3655c2562cc577697d3bff8bf250a6fb',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'CubeMizator': {
        ticket: 'b9deea346b988b90b45ef359be0e57d3325fb8e089c33008a5c7e41b5a3020b1ba16b5f4926c9d487037cf128455653573096649deee8415afa220b4ec27565e28178f2193c9f66366361de05e866e9c91e0c44f278261692f7c778dbf3ee3c53a139526fded5aea8aa8a52f19a9fc20aed1eab5f6da22eac8e0eff4b8ca4ddd-df2cbd31660c1cd9d38673d8362b9466', 
        modelViewUrl: modelViewUrls['eu-central-1'], 
    },
    'Donau City': { 
        ticket: 'e479c043c7907965e28c5bc422aad1827cbb9a77dde01c72b62b6d9ca8d7d211a9f74ac6c53c21a6029cb1ebc828605721c6bad4734ede24a3a66bc6d60ba8ab39da0a500539e3e182e527df7f8c1c599b2400cdf620168213460239a3034f8dd00f9a4d9cd42dc7b9665b20a4f6e8af51f102a0d414746deeead0984327c9-435d1f500d1f04b76ac49fa7cab2cf4d',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Material': { 
        ticket: '75f6f416a8200ed5d64f9c15f39320df0c9a630878d235332451657e1a1524fa7a39ef96d4a0b866c6ebacbf202b32e5fad90f4fe6a54276d892831f5aa4bc2cbd4cdd73231a2db23055c7a9d6d2707eb329315ab0f8d5a489cdff33b99e9b49ed68af70f4b139c941000063d19fff574b7c3b2b55460eac6ec23a86f3fd0d-a2beded2e997ea7d1d6e9b03cd3c86d1',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Pointillist': { 
        ticket: '3a5d1cb085437aafeafa44dceedb09417b5c82bccfd355f12cf23abc5546b7f697dd7b150b7abd5ee1288e4ef31dc67b7498a6459babaeae4f63ca39afff6b72235052ba0728f785dd36dc55569a0846df3d8162fc29bffbad9fdc0204f7b43c36ca7c7eb44d4ce67a62000ec68bac4c0960c0e360f06ea82b600f895deb6f-ce913db01b16300d5112a5a484cc56a6',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Perforated Panel': { 
        ticket: '1b140110fb009946286d9706db7b576bba76894025ac57b1d3aad48cd34eb58757975053ff1ea08c4cb8dd8b0bf1b526507b981edaf5bf4bf1bdeaec7824f83c2bfb29a21487304eb1a34936d9eb1dc1e90aa45c886b07b1eac73804a021c19e09a1ba52b3217d26d6c191f10090ffef3c46b8eeafa83f2a8b1cfe7a10bc87-978d3eb5e574310fe7d40741623f8a26',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Sdgtf_All_Types': { 
        ticket: 'e96c426ed1b983bb05ceb78145e6da83eaf111e6da9fca3b2c97d8447c3706930df7825932421d14100886f6967059330f25c3c12b08ce47d150bea84ea9fe4f3541ee7b1cbdb16c5735899871155bfddb76d82ff664155530ea143995a317653a5ab2de3799affbcfd3075af2c53cb8e40f26b2eba37d00f71c74c7c1a5ffd8-a23d9dc0e103d57f8ccd89b6f1d1e951',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Ring': {
        ticket: '61dff41abe9166b08ac7e54e519b71732d001149f139763c5dd8fae91c622811e02ea25f77e9eb89195e720b35c76e320c3f8671336566d9434314deab152aa03b68df31367c949dc03b9d0cd4477dd0a078fe643d35c8997c98af55dc51ee86017c8c513a1ab0840435c6712175dae504cf48eca8f436b134910671d10026-39804597edf047fb68da6d937cd58262',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Shelf': { 
        ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
    'Test model for all supported parameter types': { 
        ticket: 'c9f558e0f553bea84f8e540f1c561aff8fad4015b07d89fab2f2048e8b1fae0a3f61d3538ac8a3966f6827cbe4e4cf867c86f60df63d026a2757db15495ccb99b230337cfb21e03697e14d3593d7a8d7b8fc52fc4f142a686104deb6fb2e884a80a827314097ac1a603bd10065a1129efc28719d93fe0d9760ee83187c4f3012-92b182e5dbe03bc50a6f4e1dabf27def',
        modelViewUrl: modelViewUrls['eu-central-1']
    },
};


(async () => {
    const { ticket, modelViewUrl } = models['Shelf'];
    let session = await api.createAndInitializeSession({ ticket, modelViewUrl, id: 'mySession'});
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
})();