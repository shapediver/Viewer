export interface IGemMaterialProperties {
	environmentMap?: string;

	refractionIndex: number;
	impurityMap: string | undefined;
	impurityScale: number;
	colorTransferBegin: string;
	colorTransferEnd: string;
	gamma: number;
	contrast: number;
	brightness: number;
	dispersion: number;
	tracingDepth: number;
	tracingOpacity: number;
}

export interface IGemMaterialSettings {
	properties: IGemMaterialProperties;
	parameters: {[key: string]: string};
}

const diamondSettings = {
	properties: {
		refractionIndex: 2.4,
		impurityMap: undefined,
		impurityScale: 0,
		colorTransferBegin: "#ffffff",
		colorTransferEnd: "#ffffff",
		gamma: 1,
		contrast: 2,
		brightness: 0,
		dispersion: 0.3,
		tracingDepth: 8,
		tracingOpacity: 0.8,
	},
	parameters: {
		"03c5b85a-4424-42a5-b9ee-173cb093d700": "0",
	},
};

const blueDiamondSettings = {
	properties: {
		refractionIndex: 2.4,
		impurityMap: undefined,
		impurityScale: 0,
		colorTransferBegin: "#4444ff",
		colorTransferEnd: "#0088cc",
		gamma: 1,
		contrast: 1.2,
		brightness: 0,
		dispersion: 0.3,
		tracingDepth: 8,
		tracingOpacity: 0.9,
	},
	parameters: {
		"03c5b85a-4424-42a5-b9ee-173cb093d700": "0",
	},
};

const rubySettings = {
	properties: {
		refractionIndex: 1.76,
		impurityMap: undefined,
		impurityScale: 0,
		colorTransferBegin: "#880000",
		colorTransferEnd: "#880022",
		gamma: 0.65,
		contrast: 2,
		brightness: 0.25,
		dispersion: 0,
		tracingDepth: 8,
		tracingOpacity: 0.9,
	},
	parameters: {
		"03c5b85a-4424-42a5-b9ee-173cb093d700": "2",
	},
};

const emeraldSettings = {
	properties: {
		refractionIndex: 1.57,
		impurityMap:
			"https://shapediverviewer.s3.amazonaws.com/v3/images/impurity.jpg",
		impurityScale: 0.15,
		colorTransferBegin: "#00aa44",
		colorTransferEnd: "#002201",
		gamma: 1,
		contrast: 1.1,
		brightness: 0,
		dispersion: 0,
		tracingDepth: 8,
		tracingOpacity: 0.8,
	},
	parameters: {
		"03c5b85a-4424-42a5-b9ee-173cb093d700": "1",
	},
};

const sapphireSettings = {
	properties: {
		refractionIndex: 1.76,
		impurityMap: undefined,
		impurityScale: 0,
		colorTransferBegin: "#1111cc",
		colorTransferEnd: "#112266",
		gamma: 1,
		contrast: 1.2,
		brightness: 0,
		dispersion: 0.3,
		tracingDepth: 8,
		tracingOpacity: 0.9,
	},
	parameters: {
		"03c5b85a-4424-42a5-b9ee-173cb093d700": "0",
	},
};

export const gems = {
	Diamond: diamondSettings,
	"Blue Diamond": blueDiamondSettings,
	Ruby: rubySettings,
	Emerald: emeraldSettings,
	Sapphire: sapphireSettings,
};
