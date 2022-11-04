/**
 * The general interface for a custom UI element.
 */
 export interface ICustomUiElement {
  name: string;
  type: string;
  onInputCallback?: (value: any) => void;
  onChangeCallback?: (value: any) => void;
}

/**
 * The interface for a slider UI element.
 */
export interface ISliderElement extends ICustomUiElement {
  type: "slider";
  min: number;
  max: number;
  step: number;
  value: number;
}

/**
 * The interface for a dropdown UI element.
 */
export interface IDropdownElement extends ICustomUiElement {
  type: "dropdown";
  choices: string[];
  value: number;
}

/**
 * The interface for a string UI element.
 */
export interface IStringElement extends ICustomUiElement {
  type: "string";
  value: string;
}

/**
 * The interface for a boolean UI element.
 */
export interface IBooleanElement extends ICustomUiElement {
  type: "boolean";
  value: boolean;
}

// NOTE UI: This is one of the main files where you need to do adjustements.
// It should be pretty clear what kind of hierarchy and inputs are created here.
// The styling can completely be changed.

export const createCustomUi = (
  elements: ICustomUiElement[],
  parent: HTMLDivElement
) => {
  for (let i = 0; i < elements.length; i++) {
    const menuElement = elements[i];

    // create div for the current element
    const paramDiv = document.createElement("div");
    paramDiv.setAttribute("name", menuElement.name);
    paramDiv.setAttribute("type", menuElement.type);

    // create a label with the name of the element
    const label = document.createElement("label");
    label.innerHTML = menuElement.name;

    if (menuElement.type === "slider") {
      const sliderElement = menuElement as ISliderElement;

      // create another div that will contain the label and the value input
      const topDiv: HTMLDivElement = <HTMLDivElement>(
        document.createElement("div")
      );
      topDiv.style.justifyContent = "space-between";
      topDiv.style.display = "flex";
      paramDiv.appendChild(topDiv);

      // create another div that will contain the min and max input
      const bottomDiv: HTMLDivElement = <HTMLDivElement>(
        document.createElement("div")
      );
      bottomDiv.style.justifyContent = "space-between";
      bottomDiv.style.display = "flex";
      paramDiv.appendChild(bottomDiv);

      // add the label
      label.classList.value =
        "mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      topDiv.appendChild(label);

      // the value input
      const valueInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      valueInputElement.classList.value =
        "mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      valueInputElement.style.width = "5rem";
      valueInputElement.setAttribute("name", "valueInputElement");
      valueInputElement.setAttribute("type", "text");
      valueInputElement.setAttribute("value", sliderElement.value + "");
      topDiv.appendChild(valueInputElement);

      // the slider
      const sliderInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      sliderInputElement.classList.value =
        "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700";
      sliderInputElement.setAttribute("name", "inputElement");
      sliderInputElement.setAttribute("type", "range");
      sliderInputElement.setAttribute(
        "min",
        sliderElement.min !== undefined
          ? sliderElement.min + ""
          : sliderElement.min + ""
      );
      sliderInputElement.setAttribute(
        "max",
        sliderElement.max !== undefined
          ? sliderElement.max + ""
          : sliderElement.max + ""
      );
      sliderInputElement.setAttribute("value", sliderElement.value + "");
      sliderInputElement.setAttribute("step", sliderElement.step + "");
      paramDiv.appendChild(sliderInputElement);

      // the min input
      const minLabel = document.createElement("input");
      minLabel.classList.value =
        "mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      minLabel.style.width = "5rem";
      minLabel.setAttribute("name", "valueLabel");
      minLabel.setAttribute("type", "text");
      minLabel.setAttribute("value", sliderElement.min + "");
      bottomDiv.appendChild(minLabel);

      minLabel.onchange = () => {
        (<HTMLInputElement>sliderInputElement).setAttribute(
          "min",
          minLabel.value + ""
        );
      };

      // the max input
      const maxLabel = document.createElement("input");
      maxLabel.classList.value =
        "mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      maxLabel.style.width = "5rem";
      maxLabel.setAttribute("name", "valueLabel");
      maxLabel.setAttribute("type", "text");
      maxLabel.setAttribute("value", sliderElement.max + "");
      bottomDiv.appendChild(maxLabel);

      maxLabel.onchange = () => {
        (<HTMLInputElement>sliderInputElement).setAttribute(
          "max",
          maxLabel.value + ""
        );
      };

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
    } else if (menuElement.type === "boolean") {
      const booleanElement = menuElement as IBooleanElement;

      // add the label
      label.classList.value =
        "mb-2 mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      paramDiv.appendChild(label);

      // the toggle
      const booleanInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      booleanInputElement.classList.value =
        "ml-2 mb-2 mt-2 w-4 h-4 text-gray-600 bg-gray-100 rounded border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
      booleanInputElement.setAttribute("name", "inputElement");
      booleanInputElement.setAttribute("type", "checkbox");
      if (booleanElement.value) booleanInputElement.setAttribute("checked", "");
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
        "select"
      ) as HTMLSelectElement;
      dropdownInputElement.setAttribute("name", "inputElement");
      for (let j = 0; j < dropdownElement.choices.length; j++) {
        let option = document.createElement("option");
        option.setAttribute("value", j + "");
        option.setAttribute("name", dropdownElement.choices[j]);
        option.innerHTML = dropdownElement.choices[j];
        option.classList.value =
          "block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-gray-300";
        if (dropdownElement.value == j) option.setAttribute("selected", "");
        dropdownInputElement.appendChild(option);
      }
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
        "input"
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
    }

    parent.classList.value =
      "code-preview rounded-xl bg-gradient-to-r bg-white border border-gray-900 dark:border-gray-700 p-2 sm:p-6 dark:bg-gray-500";
    parent.appendChild(paramDiv);
  }
};
