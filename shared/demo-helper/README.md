# `@shapediver/viewer.utils.demo-helper`

This package can be used with the [`@shapediver/viewer`](https://www.npmjs.com/package/@shapediver/viewer) to easily create UIs for testing.

Additionally, this package includes logic that can be used to create simple demo-helpers with multiple stages.

## Install

```
npm install @shapediver/viewer.utils.demo-helper
```

## Usage

### Initial Setup

We are using [Flowbite](https://flowbite.com/) for the styling so first, please add

```html
<link
	rel="stylesheet"
	href="https://unpkg.com/flowbite@1.4.7/dist/flowbite.min.css"
/>
```

in the `head` of your html-file and

```html
<script src="https://unpkg.com/flowbite@1.4.7/dist/flowbite.js"></script>
```

at the end of the `body`.

### Dark Mode

If you want to use the dark mode, simply add the class `dark` to the `html` root element.

### Code Usage

After creating a viewport and a session, you can simply call `createUI` to create an UI in the specified element. This will read out all visible parameters of the scene and add them to the div.

```typescript
import {createViewport, createSession} from "@shapediver/viewer";
import {createUi} from "@shapediver/viewer.utils.demo-helper";

// create a viewport
const viewport = await createViewport({
	canvas: document.getElementById("canvas") as HTMLCanvasElement,
});

// create a session
const session = await createSession({
	ticket: INSERT_YOUR_TICKET_HERE,
	modelViewUrl: INSERT_YOUR_MODELVIEWURL_HERE,
});

// create the UI
createUi(session, document.getElementById("menu") as HTMLDivElement);
```

To create a custom UI, this can be done as follows:

```typescript
createCustomUi(
	[
		<ISliderElement>{
			name: "slider test",
			type: "slider",
			min: 0,
			max: 10,
			step: 0.01,
			value: 2,
			onInputCallback: (value: any) => {
				console.log(value);
			},
			onChangeCallback: (value: any) => {
				console.log(value);
			},
		},
		<IDropdownElement>{
			name: "dropdown test",
			type: "dropdown",
			choices: ["A", "B", "C"],
			value: 1,
			onInputCallback: (value: any) => {
				console.log(value);
			},
			onChangeCallback: (value: any) => {
				console.log(value);
			},
		},
		<IBooleanElement>{
			name: "bool test",
			type: "boolean",
			value: false,
			onInputCallback: (value: any) => {
				console.log(value);
			},
			onChangeCallback: (value: any) => {
				console.log(value);
			},
		},
		<IStringElement>{
			name: "string test",
			type: "string",
			value: "my default",
			onInputCallback: (value: any) => {
				console.log(value);
			},
			onChangeCallback: (value: any) => {
				console.log(value);
			},
		},
	],
	document.getElementById("menu") as HTMLDivElement,
);
```
