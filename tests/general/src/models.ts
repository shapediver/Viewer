interface IModelDescription {
    name: string,
    backend: string,
    models: {
        [key: string]: { 
            ticket: string, 
            slug: string 
        }
    }
}

export const sdeuc1: IModelDescription = {
    name: 'sdeuc1',
    backend: 'https://sdeuc1.eu-central-1.shapediver.com',
    models: {
        'Shelf': {
            ticket: '7d6061acf274727aff4710230595ff9e58fbd019a1e173ccd5f2342ecc697fd2397ab08cadc3014b2760f858d18b4aade0aade39fd73a5c1b44fef4d5a457739c1fe28ec6b44ef593a41f6c0cccc78fb3f62234080db167d60c23886b32c759068cdff6af5a8e3-853d465964df80e5db72abe9655cedee',
            slug: 'shelf-47'
        },
        'Donau City': {
            ticket: '13b962f6d60cf99dc006dfe8c8c5aea94603877747f828f3b0839f93b10dc83ef1207405e9cd907b76a42418e90a518c6b5f7b57f4f6ee67678449e32d8a030311376f1e56ba9e8ab5e7649d732e8eaf007b62b74dfe83a9611d885f9dc9db7f39cf67a4da6637-e766de4e64f3a5f08f7b4840e383af88',
            slug: 'donau-city-6'
        },
        'Shades B3 - External Geometry': {
            ticket: '8e0effb78ceff1283713e51214dca028028868210da050c6c82717e888f779e0f900bd1dd86cb51314a4ec340d29d58281947505978bc9dc83dcba10d208460ef8e819062c56e9a51f9febebe433971479a7e7b10901dca46fc2af07258086057e23655f2360c9-4d0a2bd84d1a59becfc8af5ed98c95ce',
            slug: 'shades-b3-2'
        },
        'Pointillist': {
            ticket: '19ac426fe331fe3f20f083f16806d6435a6c3b085cc7f127c2d5f75ee7093cfcc73cf2b99e59439743be6b76c621029a670833c65e3276bfe0d75d3753490687dc7cd7eed8d8c23d357ecfae607ca49f4ed48fc16d29dbfe2af7c850a17b97b48b7b52d2cde2c5-b18fe889725652a81e040ec56f5f5a3b',
            slug: 'pointillist-d-4'
        },
        'Solar System - GH Plugins': {
            ticket: 'ea2dffca2ad7412f78bde8a30f7672396bc38e588eae0eb9eb16695beeae9c63f354824fccc5426e11134eaa2aef81b85f199afc013ae2d198738340c850296d3ac55bd6056fed3a942b5c425cb1d786ece1eecbec7f2dbbc2def73b3d0d09760d778f0b62debb-af7cd636340cee141b985d430e2eb99d',
            slug: '10-solar-system-plugins-r6-2'
        },
        'SDGTF Test': {
            ticket: '3d93314a5fc00e54625e4cee318f4934ac57c651be4872146b8b70cc1fbbfd4a14850f3b9df37da0af9ca2146d25cc971a482efc18bc894efe726751d1d1ec0b8aac5a23479936acc98783d12148b8e5ce9db992a1002afc27a18186f0fcd6fcc76aab7029b9c6-cc48244b646031def24544f714022efa',
            slug: 'sdgtf-all-types-5'
        },
        'Kitchen Configurator': {
            ticket: '6b62e6113f8f00ebc59b2a95acf2c5ee65da13db4d70814d7fccc4f0f33c27a83f818371c35cefa75ba592d7bfff2392883d26d81746abcd6f55f820592324d61b9352e12f2c4c4c7271e4fa7df6bfb87afafac6479f8f516dc980ac609d4f2ea828c3bb934899-19eb1a397d4995ad6d150c3efeb9bf4d',
            slug: 'kitchenconfigurator-32'
        },
        'Opacity Test': {
            ticket: '9248f6be2756b692c741e04c142dc76e5799399cda5d176d84654c77620560a02b67a9d9166ff9706d7da9483c1a0448f1ff07055b1c8babbf90e4fd6ce5651bd72881d6964796b1af64ba484cc3284e9d6df0266acecc5d13e980bc366c71116b0caed6efe852-832bb196dbbe7396aaf250b684515676',
            slug: 'testmissingfaces-12-6'
        },
        'Material Presets': {
            ticket: 'd5a352ab2a1c23aaa31061220698c5fb364dc2b6345390ac08335dad19df27fb688d557234dc1ee054ba62ee0371c274de3b3df3ecbb1158007f5fdb1c15e0cf7e22639c52eac20bad487febdcd9bdd946d579c44c1a39d86bf6389925ad887d312829f9848482-8b202fa76dea307a1bd57fdc2eb54654',
            slug: '4a-materialpresets-6'
        },
        'Bookshelf - Anchors': {
            ticket: '06b6496ded7b516a391a5124cd8c6dc8831fde40bc04d92642e55a56b073bba5a4a04ec061829a5ad8004155233aef3770737199e44617edc132dfb65c7073566ed533718a0acd5af9abdc99da12986f0f5f21658b8ed3b06d2caccd48724d67e4d0ba64c92950-9c0c9629de902670370d8ce806543985',
            slug: 'arrs-texturized-1-6'
        },
        'Coral': {
            ticket: '2a98a50b98fc37a65612e19ddc1c660a1335d1eaebc09a595e1e1cef4402ea7f24325c840bba11e69cf5596347229a164e2eca14f39041cae6146bdfdab320b31acd7a077099d600805e215f79bf4cd0880ced268290385b6d9a4dda82e9bac52738734b4defca-4c3aab65c18be4a6c6f42a3cb97f347f',
            slug: 'coral-21'
        },
        'Cube - Vertex Colors': {
            ticket: '6902b96eef4489afa8279ed9550bc7782836ea5b717e5b86f61bf0b12f330d90e09388f30b5453c333694dca359d4d92c38cd86d74d3375f70689d16c75ce76cbe80618f71210e0dad24dfcab7cb7948a71715b14bbb6e4106cb92d752cca8d4123920ea59377a-d56485cca7825b3948d96d8ee61ad45c',
            slug: 'cube-simple-2-2'
        },
        'Modules Concept': {
            ticket: '1d133e14074f640fbd5fb0c9b0dc89e4cf7bb157bdf7ff4f74106069f6b54d45f33f9edda71cd1361d5f4b642ad807aaae0d2fe492348b1979f745488b7f0cb8db13084b38abefc60cc057c7f127025dd5dff250a6e97a91d1a42df7396f1077a704076298ea2f-b3af6bed254e4a3337580e85b6a2ddaf',
            slug: 'ad-s-expert-modules-concept-2-6'
        },
        'Office - Opacity': {
            ticket: 'ca3ccaabc883cee98f8c1012000691dfe2291f98e578aebf0404a832100acd242a272a45865f1a43212b5f3d8448337ffb2a1c5aaf78b29c0d1437b43d77f5ac7219c30f805db24ac57857f77c211264266d0ac7a6da4c541275fa8bfdb58863eb35a7c3f9a1c4-7434dd81f8d0737a6b7c21269cb50c2a',
            slug: 'scene1-3'
        },
        'Cage': {
            ticket: '298f2fd3c1ea9d9e0b3cbb831f137300ee3ce730855b5e9442823bb16e94204a86839bdabda5b3b46bff8eba13844df53eddb15960bee0c322346d0f70d61a3ca980b06c729b45f1786de1808a1acb26f9c5c2010fb61489fd50d0902adedf2fcf21778a33ed77-f1b615e0041648e43546b15f5e1e84c4',
            slug: 'mansion-1b-v2-1-5'
        },
        'Structure': {
            ticket: '304440147b4775e8e2de792ff09aac49010a9ada31ab4dd94d48315c30db9c8fa0a3b824e5f72700efde4b9da67b86afa09bca0597e22fea578ff29a97d9f75dca8d8576cad82413ab7d2a0361575bae667c05a76f39740d9304fa05b607c5e86e976ec4cc2ca5-3dbe8f9042bb0e467d16824dad4b51b1',
            slug: 'structure-jonas-voiles-4'
        },
        'Panels': {
            ticket: 'ef7e719b87cd46aee5fdae85d0e9d3456ae6884acd075d1acb242524bc3d518edb77f4c3848994edd68337b9f93e04b0424f6a09ee340f2cd225c903ac788b4fcbe703e7a92666872aa6d728954aa253ed48e7d2dc8916b0a9c5fbe05a873283bbda97a32cfe17-1f0e7871e552b6c5464fe184c2c23754',
            slug: '696cf005-1d83-4b00-aa84-e667de6cd164-5'
        },
        'Material Assignment': {
            ticket: 'd8d1ad190a88db4d6e35189a76d945a5a7b4e5261fc5335c197df814ca5f5f97a7bf236f0a10d0788aa7b24bfd4d0c33eaf507028f50449000ce42dafa50dd2512dce227603808eb732e77991ef8cea6d85128373256005295ac277804e0b7699c42de5e911dfb-a6c1b0fead32f1acc39ef20f21821bf6',
            slug: 'material-test-1-3'
        },
        'glTF2ShapeDiverMaterialExtension': {
            ticket: '7526235f93d63c80bc5a2a08d6220078e332bf35f1ca034e639febb2cec81bac8fa8b754ee9877682e2cc815df08900e62ce725cee923f9903171cc3a1959996d86ec6d5efa2eaccbba6069027cb5098dae70e5ba1d0a7b0e17483924affcd67b17bb20138410e-d1ba4ebd3c91bfc3d56fa4aed174fa0e',
            slug: 'gltf2shapedivermaterialextension-3'
        },
        'Ring': {
            ticket: '246a9a68491d17cef7646019b602adea2939f67a8341f2ae97f8ed90fc4b027aeac3b1eba692f5cdae6be048696050ce89f23bf210464a04b8d9e2344dbd7014a08349cf286c2b5bf2be471c2e3553a542f0221d1b509038a654cc3fafc8f095472a8a1b21e144-6fce3acfefff4e9e2642c06a252fe139',
            slug: 'test-2334-3'
        },
        'Inputs and Outputs': {
            ticket: '9e351f8c9105c10b8bd007d0bd093d65795e0985905336887ecb9e416b44d2cc6ae85d41b1e8d5adeabdcdc2af6141e7e4c46c7e8360e6f3ab5b3d6b19d9030a7dc4cb350b1ed7f320997b91549288fbb81e7531f266df0a9f6554da60de6d373dfcc3dfe2c847-cad3944e0a3f6254b2384292e9587515',
            slug: 'exampleallsupportedinputsandoutputsandexports-3'
        }
    }
}

export const sdtest: IModelDescription = {
    name: 'sdtest',
    backend: 'https://sdtest.us-east-1.shapediver.com',
    models: {
        'Shelf': {
            ticket: 'dacba01c47aea4554cd655ce3c1122a9a0965c65d9bcfaf31565fccea67ff80348d6ed7b18b9bb566351bc27f96c52c3c61d0998b8beb153378f18e650e200d3f703c30ec04c21cad98aff32f369d769ec9ab29c2d2b2180ded9ebe742cafb7c5ce0e8593c3870-32954b5548617b30605a635a8be8aa13',
            slug: 'shelf-46'
        },
        'Donau City': {
            ticket: 'af9d1f73617089afb3152ace2ea04dc199a2dc3e16dac653e051513294760596d6669d4a31b68b7041b605fa4ac2e24f96357e89fa44e8d7597d0f23f438712a2ffb57c3ad850f3d53a1649ce3b13550365fe5d41ade33b70bfe25e40ac8244f54bd6edb144c6e-7ca880b31a0cc3bb2ed53b165cc8a357',
            slug: 'donau-city-5'
        },
        'Shades B3 - External Geometry': {
            ticket: 'dcc3606566d19f3cc3b04302606a6225b57b5d99fd2acd997e03273a1cdc573cd2f534d60ef4f87bc5a9f201db6e2583f73fe7ade32dc11fb1544c9e856347ba474d1fdc07e05a296d68ec795953ddf3c6ce532f0249c1bd62abd2db12695e4a3c5ef4c1667806-68963fbe3eae98f90d054d8b808e9776',
            slug: 'shades-b3-1'
        },
        'Pointillist': {
            ticket: 'd1c30c7db1c97fa511e5851fa970321cdc4e607992acc9cb0936cc8519125529a0a1a484b0a35100d40ec122859041b7dc45482d365e4f1071a91f516e73c4144ee544dcc4ba32f888e8155e01e35d3f68f5050cc4b3cffb5c911742c53e39f881cb817043324b-d45999de94e1376fa93b57990e513f10',
            slug: 'pointillist-d-3'
        },
        'Solar System - GH Plugins': {
            ticket: '85d8c306230ee1e4573d889970704057755ba976d6ac0943940db2b9abc9b7ba4d7a6ce092d2b1eb14bb986c18a09c7a0b509eb4b1de54f97b7039e66afcc4d3d9e2b6f2917e0c67b97eabff1286b128baa3900dd1ddb5bc1cf0ce8c5707c85cb5f56a6cc73299-846e688948ad645436abe6a7faade8af',
            slug: '10-solar-system-plugins-r6'
        },
        'SDGTF Test': {
            ticket: 'e1a4b8762ba0012d784274c0c77cb292f9586c09dac6267f3e2e4589546b172cc9d2691ccfcfeebbccc1bbf25c7ac409454bae6b227e24b34eed7618e05d6d84c584d427ac69f05a87defd6af2e7e9b55adf05780ebb838ede0bf6b1dcec7727ef54f87088f674-b43e98dec079f07f47f7510bd53da801',
            slug: 'sdgtf-all-types-4'
        },
        'Kitchen Configurator': {
            ticket: 'ecd55fa7ac2a441f0c5cfeabfb10282018271a33141a13b9b49230214b6309dd970c175269ca4901c1cb2bdea024c674f6b10b9e19cc800812d495c15d747a35169143a4d3c6ee03ec65dcdf53effdb00c8ff751bbd8bb01d0d2ccf88a1f341df4743d3664db37-23e463180e78196f170720e13924b1c9',
            slug: 'kitchenconfigurator-31'
        },
        'Opacity Test': {
            ticket: '85896fad1bcd87c5bba23b1a671037187c66fbfb3242bbf0ca8c84149c14401f3859859adf76e51cc4c3227b91d45bd411f6dae244382d57b2349ec5f75ba11936439ed07286cf0b489de3e2a334f0655cca2e2cf88db8e76a56be8db1f211ac3a8aa53513bd25-8df56a7c8fa1ff6ea8c6fcf49def8eb4',
            slug: 'testmissingfaces-12-5'
        },
        'Material Presets': {
            ticket: '284ff7f9b1c24b15ed4a0fc3a6ba4ef1205f91ef1f58032cec76ae3962ab55590d7b9b550868786105d265e7664b8f8e916a212cfe7cb1c26d8008566e4d595382c9042597be763a9ff4f6818f699660faa2f093757f852cf865d97e14726aa2e7cb45672835ae-6d33870a127b63043cffa3ffc261d55c',
            slug: '4a-materialpresets-5'
        },
        'Bookshelf - Anchors': {
            ticket: 'afe998da25d05facbfdf857f5bc4491c58070cfa89cbba1805a02c635777725f160ccee6c5932c87bf84b1d839c4a55be5225bbab853b954b35dbc7de2116e6a66212f52b2d13975a1e6e696a3324cf1d274c8b881d4f4e368dcd9c06c3ec1ddad1275e5741f4a-7425d3696f8c05047241d2896e899599',
            slug: 'arrs-texturized-1-5'
        },
        'Coral': {
            ticket: '3b813313f500f409d9ff7079910476cf5d741959abd3d0519cfadf14b2ed6a4d115e28a7316ed7f0283a606df643d955310be2be4121386cb0c4c3214069018d6cd168b292a43626f5cf61fa073fd0c9da047bd8b6803a52609831604071d158621a3b35a584d0-44da1336e4637960aaef5cc593e47cc2',
            slug: 'coral-20'
        },
        'Cube - Vertex Colors': {
            ticket: '510514fac150e4c0484f77d337f3cf1c64060086e3cada14dbfc48b27d98f6fa99bd81440805115511a155b01f6caff6d8867f70c182caa240ed05955bc2ea0e872dbe9641d321edd92f70ce63d6d27cfe84c2a39828b1344ee3978c430c74fc730fdfd61f891d-3ef701232f21bc78f46057a46d55dfd6',
            slug: 'cube-simple-2-1'
        },
        'Modules Concept': {
            ticket: 'bfc06113d4603ce54b158f03d4279ab47ae350a35c92c1d8486b065a677b09816ce7bfdc14db753d714827fe9d32867ba2ff1f8eea70fb175364362361664d39878319691a79467c6675ce1c5985d495f7746eec0c9c97e686cd6a8d6ec9c553164a4206a4af9e-910115a72572923927720954647b47ec',
            slug: 'ad-s-expert-modules-concept-2-5'
        },
        'Office - Opacity': {
            ticket: 'ec1eea27bbcd1849d19100853c8ad3a29be7218601b09604bce5ffe4f0b6cd175ee9999c079a74e8cb268ca99ff140252994f4e0eb4b776758818540713e5c87db64bb33ec3bba4158eb5fdeb3f1912ced1c6950e847a70ddf15869ddb10cec6d11abe7df9b3c3-13811fe5656c175bfe0ac652bdfa3893',
            slug: 'scene1-2'
        },
        'Cage': {
            ticket: '4b6f65eacba58d03aff1f4ddddf5fbb04aff3319f3ef8d39bab4e90c4c38919c37608dfc6cd7ef0d2ead3c72cea2aaf3d473ae95f44a529e8ab7894e7c045232bb3f8c79adaf208be874db5a075e6d68fa0f64247ec289b84949cc9bcabac6a7a681b7c4132f34-19dc2068b65bf441a46688a23acd51fe',
            slug: 'mansion-1b-v2-1-4'
        },
        'Structure': {
            ticket: 'dc4bdeb152d161df372359ee21942acf9c6e511c8e571535cb6390da0bf257d8d6004f13ec4154b037969bced689e2cbe0b6bf211739c5233ec0090f93dab8981fb610d785901cd479075c17e6f845a03db724a72c1e5aea222d719e6bb237f59ba7a44b72d364-23b6e12255c9141f5a13cd9e34faf405',
            slug: 'structure-jonas-voiles-3'
        },
        'Panels': {
            ticket: 'f1bc82867a64573550c5dc04dade3de26addd249608ebe000b0a4b6d52b7793a510b8bc86a3807f0bcb8c756614bb28b7444cfba35b4f42207ae40589453b9a7246856bb87d0f0c6bbfeff7b9d961481d000a0f163e3328f812330c311e388379385c864828604-c79d9a78adc9317689526f181fed5819',
            slug: '696cf005-1d83-4b00-aa84-e667de6cd164-4'
        },
        'Material Assignment': {
            ticket: '8ae1b7546b36ebfa3897c3f7dae9d31ee63aae9fdfb03acc04ee94dbe9d4ce7c0b2a3bbb0e3bf5cf802fa7ce29c1238643a2ac6c6b3d40f3cb50d476a57d9a07b973e112edfc32d7a3cffac0e8ee75b926a67377e54a37c6577c385a9c4e31b439ef88000330cb-8eae49f2665e290988b4716d64accbc6',
            slug: 'material-test-1-4'
        },
        'glTF2ShapeDiverMaterialExtension': {
            ticket: 'e20ce4eabe2d0cd8ea1349a562ba6840107bba119d3177de20061be4d8962a9ad14c4bacfe8a7fffb5f9895cb0ccfb430a1043aae84833face0f56f49abe3b76575e0d45312387efa3f90ba95d4d1b19b1741be87b7118cd22201dddccfa9e8ce5cab894b0f6a2-86abfcc3ab74fe9e08b84313b51f336b',
            slug: 'gltf2shapedivermaterialextension-4'
        },
        'Ring': {
            ticket: 'fe8c7b32b90f0c5f1a8bdcb289da6752afd0ca02e62a6399e099bfb6534e1b7a1540338184406d7dd445dfc359b2c7046039d505bb1b395c55ce4183e518d7681fa708fca9f5ba410193e5cd4ae819c6ff1f9f5c58ae0b347ad8b882199b2e4ba340159df6d7e0-aacf3a823f49eccaad490614e75f7f1d',
            slug: 'test-2334-2'
        },
        'Inputs and Outputs': {
            ticket: '769689ee152bb0bd4cd216a1248ba524464de5e98becb80012f3b3516dd5477ee859054cc0226c94c7ab1cce0e53ace0cb51a098ace991e5af34ef73f738d4bab49348c6f0cef2719c97c00f9d8131bf878f349412b0dfb803555c207f4cde0d0955a322072115-e04bf30122002b1279fcd646a1e15cfa',
            slug: 'exampleallsupportedinputsandoutputsandexports-2'
        },
    }
}

export const sddev2: IModelDescription = {
    name: 'sddev2',
    backend: 'https://sddev2.eu-central-1.shapediver.com',
    models: {
        'Shelf': {
            ticket: '8d3a5eca79254e533f11ccc34b28b0cd90c1e69c829d3cb73b06d35017cd6c7b740ccab7ffe5dbdae7ba8e27060ce5caa65e42e68551856b79dfff4bba9dbc35108532c7877d6f9682c1cf98d58b142ab94bdaef256e729c62a2110cb2af26b51efb1918037082-d32d48c1838e63ec755b6d09679b90c2',
            slug: 'shelf-48'
        },
        'Attribute Visualization': {
            ticket: '89720c95b6fa5cc21d7e0da1e47fd1b8fcba4a28c7399bc41c8e02205b345188590e0aa7095cb58f94956deebea5766107aac39751a2d88120d9f94e6821cb9ba500258da6edcf754a756b69d65a1eaa548d2b94b334661cd6a20d59e81ff5280d6c6bbd5deb69-04ddbee13b9ea42b58d460d46b5949bc',
            slug: 'attributevisualisationexample-3',
        },
        'Donau City': {
            ticket: 'ddee9c3c92d901f194e1af4d6a2dba5296cda81430ead028900025705a4be4c2a2ffbaff73db017514ac0e44839248bfcf29e4ec27d5a79a4172ebe54bdb48c545f20f8bd577005686ecdbfab7b850127002143086853b7c4a31d50caad405fbfaa83fa44230fe-935bf87b27c4ce4c7c577388d3f7cc7f',
            slug: 'donau-city-7'
        },
        'Shades B3 - External Geometry': {
            ticket: '6f246193a8b709e06faa1f6b85504df1371c83edbca2742e8acbe4211cfe30a7e95de3dada7232595f9f8e2500e91a7c972edb0a37310906de54ef02ccfc494c5168be0842042a39b7fb6627f3ffc8667fe63eabb66b509e4b2a9a4335e464f768041e067a9503-46f9fa1255112f30bcb7a8598b507ff3',
            slug: 'shades-b3'
        },
        'Pointillist': {
            ticket: '7fafd048800557f9a6f137e1122a0f768b47373607e71e5bcf45c4b53ceef540c0a42bf18dbbf9f3ecdb7f5da8b42af859f3fea8191cc734a9525248042b82239494b29afc8410441cb69e5f7a2a52b146934004cbb13fe93f9b3e4359762910f00b01e88e0530-1d4d936e928f1a6ea30b983cf3222989',
            slug: 'pointillist-d'
        },
        'Solar System - GH Plugins': {
            ticket: 'fb26e7e1031a4eff29657ba28188db6b331d0853de896d3c91b22a811256f95bd6503a17d5b83ca6fda10c48363b29d92da8656526b195bf5f8c99313effd57ce8392499ef63de6c426320f399696c3cf47f31e7bdce6d1a29dbc25a1e467a902beda9eaef407d-fa4bd0bc7980ce01a7f19c9f5f9dac24',
            slug: '10-solar-system-plugins-r6-3'
        },
        'SDGTF Test': {
            ticket: '158d7fd116c61b6d22cad08db9b80d59db736b41525fc70414e43913fa47de790e0b0ca273dafe234fa141d3b73b8413abaf463d3fc4674c1a28e59ed657cc1543bab4050572c31e05bab07f91932ae0309f32203b0da52dcebaa69bdd54151999c7316f14dd26-2c26713ff70f7c27ec447cddd83e70b0',
            slug: 'sdgtf-all-types-6'
        },
        'Kitchen Configurator': {
            ticket: 'feec25496e29b48b2c9a5f10eb6168aafbe990974831c5b438fd7b6eb5f17d53df04ffa4cd61524f31837bd1a0ed51e362db4e9375a18457ee3e77b6284e336845ddf4dfebd9bcab1fe6edef9bc421c1dd79ae53a9620c68d1bb526cb742e802ebbd7828311d7d-15a2c19c3e2d6405b7063c5d99e0223b',
            slug: 'kitchenconfigurator-33'
        },
        'Opacity Test': {
            ticket: 'a1735b4be588b76e9daf2ae7da448ed7ea59105ecd3fe39e40e9d26812ce5a7a6068403dff77df9a72087ccedb7859abbac954223e9769d3ec4201bd5e55180443fb638f5b6bcd3b3740f1027e7eb4fca8e3991cc5c2610e146af7de4dff0047eb8ae68442f077-96f38f77b4935724a000601881e41d29',
            slug: 'testmissingfaces-12-7'
        },
        'Material Presets': {
            ticket: '082add0743b5a50024fc7f5bca120a78343d662b1c5f3d651fafcbdbcc1b07574a8089b766f48d4c461c934d83edd85ce936678710c23491a81b9a6780ec08487295bbac3d151f989d5fc656324aef28de967be4278e2e21bd54308a9f88d55b2a1c3782d51444-c7ac3cac97750547e0336923b13e337f',
            slug: '4a-materialpresets-7'
        },
        'Bookshelf - Anchors': {
            ticket: 'c61949b91fa664ec6b8aab6f2227aea06a57f599558f2981c9e743cc09a0caeccdd13d2b90338a68b914467c165a0d500ad350cab17dcf89935731715ceaef044f033a7c0f6063d0685bbec53277cd23273f43b4ef7548818c8db654d36cbf50e605663a957d14-39fcaccd5ee7acab2b833a74e2c677f0',
            slug: 'arrs-texturized-1-7'
        },
        'Coral': {
            ticket: 'f34d5226c9d2667241f9e6f704a44c7ed59fe9313431a7f9c7780e633f408ba71f6953431141286d581f7480bdd5657db9391dca5bf0e285e9a81cc14c1114e89dc15c6c832d30ff78d54c578bdf26bdd2058b1e8034eb833f3aa89d480c151daed340582c98c5-990befe16dd6c24f0d8e5dd1f9bba3b3',
            slug: 'coral-22'
        },
        'Cube - Vertex Colors': {
            ticket: 'c4c6348ea8e8d4d8000671a4df6b199c2d5175b41f184d36e02be0af02d790a5a87625bcb97955d1c90fae87ea391cfc78ab666eb8284234124ee052f207f41983b2a0a2b7300ec3b285ce08a9c93a09934450954de39e112e6cc8d894ae7df968b2e150aa9caa-9c043a1bdd3ee1ec5c7c656d9f221cde',
            slug: 'cube-simple-2'
        },
        'Modules Concept': {
            ticket: 'c5ecf99eb1b4806a56f0d6f5dbe3a8474d1e2307237b209bf6886e135aafc1bc0e39928f6cfe621618921d36e5b28db226fd71649c57a762b9aa204903b4b845493a72932ad47597c12ec52a605f58307e47eb1b03fd06e7275db45fb58921de854f9855059438-259cb4ce0dd258c5afe3c4d1039c400b',
            slug: 'ad-s-expert-modules-concept-2-7'
        },
        'Office - Opacity': {
            ticket: '1196d76234206790ca3647c03a807a0c129182e0471b359d10ff99f9eee6a82738e8a92f43b987034ac0b0734bf0c1b95abcd6c39865603ee4f4529155dd0af76efeeb6525cf98e6e1a4a48a11e855e31537050ab9f93212d6aa827a7791f58d0fd5a0b27c43ec-cdacd3662d3fd7ce059474f096f01bfa',
            slug: 'scene1-4'
        },
        'Cage': {
            ticket: 'f678ce1301ed9dd6acfaca4ae86b9dbc0b69280b380ff9f3e982728cbb545a4eabc7326c38595aed8943a5c4b992ce00bd3c1a599eb0f37c16e65b5ef3cf5501d977f8023be20c027676564eaf76b3a102aa59a3475134f94a015fa47617ada4f4d15f5480e87c-fb3b97cf9503957035dd21a99ec8b1c1',
            slug: 'mansion-1b-v2-1-6'
        },
        'Structure': {
            ticket: '398c43ce8854920fc2fd29b49966e4fe805b5eed73e6920eb59dfdd69451feec321c5024b2b9d4c41bd70c7a757f36486e438644fd03961e4acc04338b9c0fde084af9c3e9b946cf99a67ef96d2f300da83dc9964d403e7e4db4177ed6a5c432aa2a75ffe0e076-64620ca392be916de1c9898c3844933d',
            slug: 'structure-jonas-voiles-5'
        },
        'Panels': {
            ticket: '479354d42fd5f920de71f772eadd0e8b4885865163f8865773df25bd164d41b4267aa595409af1063f7f81c65618f8441d6abf29c555181bf4f8d85540f254ef3c11c7edcbc2e47b7b0db9a18b2c6f5347517399d8daea355e16311de864325b2f0c2b1f8e6664-85d89ef162401bf4c11e1ac14781746b',
            slug: '696cf005-1d83-4b00-aa84-e667de6cd164-6'
        },
        'glTF2ShapeDiverMaterialExtension': {
            ticket: 'de10f98d65dc911218545638a6a0ccd7315029b419124a0de96f662510f55d69039402e5b77c7be255b11f0e3a60f8ff9b04298e6ffe362ee1926b8ae75206a5c4486fb3ce6cff476461d0fa788da6e19275f1665da600f00dc52815ef1ec6650f3af38093c234-51f2b6a56142e9e8d03c6072e0b586ae',
            slug: 'gltf2shapedivermaterialextension'
        },
        'Material Assignment': {
            ticket: '71050c77c6c9ee2ed72a1e0459a1d7aa53c66c71737d597ce92ace8d0ee30cd20348b32e1dd66fa738e4614120514f0ca8c7bac2dfdfd167af6175aff9084e3846b9dd154500940087488867d8a1c08bd8a1104687438b38114c52522a5168740d4ec9346962ce-2f97599726cb20999ef0dd0a277711aa',
            slug: 'material-test-1'
        },
        'Material Assignment - Clark Pacific': {
            ticket: '11de42a12ee4f87daf5fc3fb1d2cd9dc41c80cda8be2be4ad9e1e3a106c1a43d794178296c19251ddc3740244dbba2469d7b4306bccc1745473db97da80f935d82c5fa8ea0af6ea6a80df8e77824c815995082826deff47db395db8ced250c8e5419d9d461aae3-4d69d43a880da79eaaabb4fab387dbd4',
            slug: '211118-clarkpacific-8'
        },
        'Ring': {
            ticket: '84238d1c3d96358b6dbb0a7c42f16583a2c2e3f4a97f10e5c12780af718f23fbe6754eb890da9f7135078c7d19c114c2de23250e41f91958b476effd0294b722ead2e1d44d169733640dd780610f2353462e073cfd9336013230e0cfe16c98303b39b6305099ac-30b178012e43675a5569da54fa6a6897',
            slug: 'test-2334-1'
        },
        'Inputs and Outputs': {
            ticket: '283364d960ceb3d95c8bbda77ea9d0186e9ac2ad26b177b41bd06ecc1601bb6c14da10994886ab2f36e1b4c0c8537a07e636f1eceb23a824877cc7858633182541a165dd431f67cc1fcf1e9ae82359de62edabaacfec1447c622f16d088c9c13cc39becc8623af-7a95a07f6d94215329ce13927d7ca70c',
            slug: 'exampleallsupportedinputsandoutputsandexports-1'
        },
    }
}