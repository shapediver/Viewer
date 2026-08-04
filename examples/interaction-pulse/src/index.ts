import {createSession, createViewport} from "@shapediver/viewer";
import {
	HoverManager,
	InteractionData,
	InteractionEngine,
	SelectManager,
} from "@shapediver/viewer.features.interaction";

type PulseSettings = {
	color: string;
	pulseSpeed: number;
	intensity: number;
};

const createPulseControls = (
	hoverManager: HoverManager,
	selectManager: SelectManager,
) => {
	const settings: Record<"hover" | "selection", PulseSettings> = {
		hover: {
			color: "#00ff78",
			pulseSpeed: 1.4,
			intensity: 0.2,
		},
		selection: {
			color: "#ff6b35",
			pulseSpeed: 1.1,
			intensity: 0.45,
		},
	};
	const effects = {
		hover: {type: "pulse" as const, ...settings.hover},
		selection: {type: "pulse" as const, ...settings.selection},
	};
	hoverManager.interactionEffect = effects.hover;
	selectManager.interactionEffect = effects.selection;

	const apply = (kind: "hover" | "selection") => {
		Object.assign(effects[kind], settings[kind]);
	};

	const panel = document.createElement("div");
	panel.id = "pulse-controls";
	panel.style.cssText = [
		"position:absolute",
		"top:1rem",
		"right:1rem",
		"z-index:1",
		"width:16rem",
		"padding:1rem",
		"border-radius:0.5rem",
		"background:rgba(20, 24, 30, 0.9)",
		"color:#fff",
		"font:13px/1.4 system-ui, sans-serif",
		"box-shadow:0 0.5rem 1.5rem rgba(0, 0, 0, 0.25)",
	].join(";");

	const heading = document.createElement("h1");
	heading.textContent = "Material pulse";
	heading.style.cssText = "font-size:1.1rem;margin:0 0 0.25rem";
	panel.appendChild(heading);

	const note = document.createElement("p");
	note.textContent =
		"Move the pointer over a part or select one to see changes.";
	note.style.cssText = "margin:0 0 1rem;color:#cbd5e1";
	panel.appendChild(note);

	for (const kind of ["hover", "selection"] as const) {
		const section = document.createElement("fieldset");
		section.style.cssText =
			"margin:0 0 0.75rem;padding:0.6rem;border:1px solid #475569";
		const legend = document.createElement("legend");
		legend.textContent = kind === "hover" ? "Hover" : "Selection";
		section.appendChild(legend);

		const addControl = (
			labelText: string,
			input: HTMLInputElement | HTMLSelectElement,
		) => {
			const label = document.createElement("label");
			label.textContent = labelText;
			label.style.cssText = "display:grid;gap:0.2rem;margin:0.45rem 0";
			input.style.width = "100%";
			label.appendChild(input);
			section.appendChild(label);
		};

		const color = document.createElement("input");
		color.type = "color";
		color.value = settings[kind].color;
		color.oninput = () => {
			settings[kind].color = color.value;
			apply(kind);
		};
		addControl("Color", color);

		for (const [label, property, min, max, step] of [
			["Intensity", "intensity", "0", "1", "0.05"],
			["Pulse speed", "pulseSpeed", "0.2", "4", "0.1"],
		] as const) {
			const range = document.createElement("input");
			range.type = "range";
			range.min = min;
			range.max = max;
			range.step = step;
			range.value = String(settings[kind][property]);
			const value = document.createElement("output");
			value.textContent = range.value;
			range.oninput = () => {
				settings[kind][property] = Number(range.value);
				value.textContent = range.value;
				apply(kind);
			};
			addControl(label, range);
			section.appendChild(value);
		}

		panel.appendChild(section);
	}

	document.body.appendChild(panel);
};

(async () => {
	const viewport = await createViewport({
		canvas: document.getElementById("canvas") as HTMLCanvasElement,
		id: "materialPulseViewport",
	});

	const interactionEngine = new InteractionEngine(viewport);
	const hoverManager = new HoverManager();
	interactionEngine.addInteractionManager(hoverManager);

	const selectManager = new SelectManager();
	interactionEngine.addInteractionManager(selectManager);
	createPulseControls(hoverManager, selectManager);

	const session = await createSession({
		ticket: "319f14f08c1e67a874fd843acecfd321049772deb0cdb5a0dbb39385592a156e83730e45c5e7af5eab52e15b1e36d44a092f71ada1331e1935b0f25d9448af34d0add0bd5abf8984325b97ee9e6106b25216446d15a86bb18b40114df89d2f5909b08e8c8b9eeb-7516be37cb2d968a0b3c545baf3ae51e",
		modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
		id: "materialPulseSession",
	});

	for (const node of session.node.children) {
		node.data.push(new InteractionData({hover: true, select: true}));
		node.updateVersion();
	}
})();
