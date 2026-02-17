export interface ICustomUiElement {
	name: string;
	type: string;
	onInputCallback?: (value: any) => void;
	onChangeCallback?: (value: any) => void;
}

export interface ISliderElement extends ICustomUiElement {
	type: "slider";
	min: number;
	max: number;
	step: number;
	value: number;
}

export interface IDropdownElement extends ICustomUiElement {
	type: "dropdown";
	choices: string[];
	value: number;
}

export interface IStringElement extends ICustomUiElement {
	type: "string";
	value: string;
}

export interface IColorElement extends ICustomUiElement {
	type: "color";
	value: string;
}

export interface IBooleanElement extends ICustomUiElement {
	type: "boolean";
	value: boolean;
}

export const updateCustomUi = () => {};

export const createCustomUi = (
	elements: ICustomUiElement[],
	parent: HTMLDivElement,
) => {
	for (let i = 0; i < elements.length; i++) {
		const menuElement = elements[i];

		// create div for the current element
		const paramDiv = document.createElement("div");
		paramDiv.setAttribute("name", menuElement.name);
		paramDiv.setAttribute("type", menuElement.type);

		// create a label with the name of the element
		const label = document.createElement("label");
		label.textContent = menuElement.name;

		if (menuElement.type === "slider") {
			const sliderElement = menuElement as ISliderElement;

			// create another div that will contain the label and the value input
			const div: HTMLDivElement = <HTMLDivElement>(
				document.createElement("div")
			);
			div.style.justifyContent = "space-between";
			div.style.display = "flex";
			paramDiv.appendChild(div);

			// add the label
			label.classList.value =
				"mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
			div.appendChild(label);

			// the value input
			const valueInputElement = document.createElement(
				"input",
			) as HTMLInputElement;
			valueInputElement.classList.value =
				"mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
			valueInputElement.style.width = "5rem";
			valueInputElement.setAttribute("name", "valueInputElement");
			valueInputElement.setAttribute("type", "text");
			valueInputElement.setAttribute("value", sliderElement.value + "");
			div.appendChild(valueInputElement);

			// the slider
			const sliderInputElement = document.createElement(
				"input",
			) as HTMLInputElement;
			sliderInputElement.classList.value =
				"w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700";
			sliderInputElement.setAttribute("name", "inputElement");
			sliderInputElement.setAttribute("type", "range");
			sliderInputElement.setAttribute("value", sliderElement.value + "");
			sliderInputElement.setAttribute("step", sliderElement.step + "");
			sliderInputElement.setAttribute(
				"min",
				sliderElement.min !== undefined
					? sliderElement.min + ""
					: sliderElement.min + "",
			);
			sliderInputElement.setAttribute(
				"max",
				sliderElement.max !== undefined
					? sliderElement.max + ""
					: sliderElement.max + "",
			);
			paramDiv.appendChild(sliderInputElement);

			// the callbacks
			sliderInputElement.onchange = () => {
				valueInputElement.value = sliderInputElement.value + "";
				if (menuElement.onChangeCallback)
					menuElement.onChangeCallback(sliderInputElement.value);
			};

			sliderInputElement.oninput = () => {
				valueInputElement.value = sliderInputElement.value + "";
				if (menuElement.onInputCallback)
					menuElement.onInputCallback(sliderInputElement.value);
			};

			valueInputElement.oninput = () => {
				if (+valueInputElement.value > sliderElement.max)
					valueInputElement.value = sliderElement.max + "";

				if (+valueInputElement.value < sliderElement.min)
					valueInputElement.value = sliderElement.min + "";

				sliderInputElement.value = valueInputElement.value + "";
				if (menuElement.onInputCallback)
					menuElement.onInputCallback(sliderInputElement.value);
			};

			valueInputElement.onchange = () => {
				if (+valueInputElement.value > sliderElement.max)
					valueInputElement.value = sliderElement.max + "";

				if (+valueInputElement.value < sliderElement.min)
					valueInputElement.value = sliderElement.min + "";

				sliderInputElement.value = valueInputElement.value + "";
				if (menuElement.onChangeCallback)
					menuElement.onChangeCallback(sliderInputElement.value);
			};
		} else if (menuElement.type === "boolean") {
			const booleanElement = menuElement as IBooleanElement;

			// add the label
			label.classList.value =
				"mb-2 mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
			paramDiv.appendChild(label);

			// the toggle
			const booleanInputElement = document.createElement(
				"input",
			) as HTMLInputElement;
			booleanInputElement.classList.value =
				"ml-2 mb-2 mt-2 w-4 h-4 text-gray-600 bg-gray-100 rounded border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
			booleanInputElement.setAttribute("name", "inputElement");
			booleanInputElement.setAttribute("type", "checkbox");
			if (booleanElement.value)
				booleanInputElement.setAttribute("checked", "");
			paramDiv.classList.value = "flex items-center";
			paramDiv.style.justifyContent = "space-between";
			paramDiv.appendChild(booleanInputElement);

			// the callback
			booleanInputElement.onchange = async () => {
				if (menuElement.onChangeCallback)
					menuElement.onChangeCallback(booleanInputElement.checked);
				if (menuElement.onInputCallback)
					menuElement.onInputCallback(booleanInputElement.checked);
			};
		} else if (menuElement.type === "dropdown") {
			const dropdownElement = menuElement as IDropdownElement;

			// add the label
			label.classList.value =
				"block mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
			paramDiv.appendChild(label);

			// the dropdown
			const dropdownInputElement = document.createElement(
				"select",
			) as HTMLSelectElement;
			dropdownInputElement.setAttribute("name", "inputElement");
			for (let j = 0; j < dropdownElement.choices.length; j++) {
				let option = document.createElement("option");
				option.setAttribute("value", j + "");
				option.setAttribute("name", dropdownElement.choices[j]);
				option.textContent = dropdownElement.choices[j];
				option.classList.value =
					"block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-gray-300";
				if (dropdownElement.value == j)
					option.setAttribute("selected", "");
				dropdownInputElement.appendChild(option);
			}
			dropdownInputElement.selectedIndex = dropdownElement.value;

			dropdownInputElement.classList.value =
				"w-full mb-2 mt-2 right-5 text-gray-300 bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-1 py-0.5 text-center inline-flex items-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800";
			paramDiv.appendChild(dropdownInputElement);

			// the callbacks
			dropdownInputElement.onchange = () => {
				if (menuElement.onChangeCallback)
					menuElement.onChangeCallback(dropdownInputElement.value);
				if (menuElement.onInputCallback)
					menuElement.onInputCallback(dropdownInputElement.value);
			};
		} else if (menuElement.type === "string") {
			const stringElement = menuElement as IStringElement;

			// add the label
			label.classList.value =
				"block mb-2 mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
			paramDiv.appendChild(label);

			// the input
			const textInputElement = document.createElement(
				"input",
			) as HTMLInputElement;
			textInputElement.setAttribute("name", "inputElement");
			textInputElement.setAttribute("type", "text");
			textInputElement.setAttribute("value", stringElement.value);
			textInputElement.classList.value =
				"bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
			paramDiv.appendChild(textInputElement);

			// the callbacks
			textInputElement.onchange = () => {
				if (menuElement.onChangeCallback)
					menuElement.onChangeCallback(textInputElement.value);
			};

			textInputElement.oninput = () => {
				if (menuElement.onInputCallback)
					menuElement.onInputCallback(textInputElement.value);
			};
		} else if (menuElement.type === "color") {
			const colorElement = menuElement as IColorElement;

			// add the label
			label.classList.value =
				"block mb-2 mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
			paramDiv.appendChild(label);

			// create another div that will contain the color swatch and the text input
			const div: HTMLDivElement = <HTMLDivElement>(
				document.createElement("div")
			);
			div.style.justifyContent = "space-between";
			div.style.alignItems = "center";
			div.style.display = "flex";
			paramDiv.appendChild(div);

			// the input
			const textInputElement = document.createElement(
				"input",
			) as HTMLInputElement;
			textInputElement.style.width = "5rem";
			textInputElement.setAttribute("name", "inputElement");
			textInputElement.setAttribute("type", "text");
			textInputElement.setAttribute("value", colorElement.value);
			textInputElement.classList.value =
				"bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
			div.appendChild(textInputElement);

			// the callbacks
			textInputElement.onchange = () => {
				colorInputElement.value = textInputElement.value;
				if (menuElement.onChangeCallback)
					menuElement.onChangeCallback(textInputElement.value);
			};

			textInputElement.oninput = () => {
				colorInputElement.value = textInputElement.value;
				if (menuElement.onInputCallback)
					menuElement.onInputCallback(textInputElement.value);
			};

			// the input
			const colorInputElement = document.createElement(
				"input",
			) as HTMLInputElement;
			colorInputElement.style.width = "5rem";
			colorInputElement.style.height = "2.55rem";
			colorInputElement.setAttribute("name", "inputElement");
			colorInputElement.setAttribute("type", "color");
			colorInputElement.setAttribute("value", colorElement.value);
			colorInputElement.classList.value =
				"bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
			div.appendChild(colorInputElement);

			// the callbacks
			colorInputElement.onchange = () => {
				textInputElement.value = colorInputElement.value;
				if (menuElement.onChangeCallback)
					menuElement.onChangeCallback(colorInputElement.value);
			};

			colorInputElement.oninput = () => {
				textInputElement.value = colorInputElement.value;
				if (menuElement.onInputCallback)
					menuElement.onInputCallback(colorInputElement.value);
			};
		}

		parent.classList.value =
			"code-preview rounded-xl bg-gradient-to-r bg-white border border-gray-900 dark:border-gray-700 p-2 sm:p-6 dark:bg-gray-500";
		parent.appendChild(paramDiv);
	}
};
