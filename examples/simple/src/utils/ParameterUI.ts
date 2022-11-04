import { PARAMETER_TYPE, ISessionApi } from "@shapediver/viewer";

// NOTE UI: This is one of the main files where you need to do adjustements.
// It should be pretty clear what kind of hierarchy and inputs are created here.
// The styling can completely be changed.

export const updateParameterUi = (
  parameters: { [key: string]: string },
  parent: HTMLDivElement
) => {
  for (let p in parameters) {
    const paramDiv = <HTMLDivElement>parent.querySelector('[name="' + p + '"]');
    const paramType = paramDiv.getAttribute("type");

    if (
      paramType === PARAMETER_TYPE.INT ||
      paramType === PARAMETER_TYPE.FLOAT ||
      paramType === PARAMETER_TYPE.EVEN ||
      paramType === PARAMETER_TYPE.ODD
    ) {
      const inputElement = <HTMLInputElement>(
        paramDiv.querySelector('[name="inputElement"]')
      );
      inputElement.value = parameters[p] + "";
      inputElement.onchange!(new Event("custom"));
    } else if (paramType === PARAMETER_TYPE.BOOL) {
      const inputElement = <HTMLInputElement>(
        paramDiv.querySelector('[name="inputElement"]')
      );
      if (parameters[p] === "true") inputElement.setAttribute("checked", "");
      inputElement.onchange!(new Event("custom"));
    } else if (
      paramType === PARAMETER_TYPE.STRING ||
      paramType === PARAMETER_TYPE.COLOR
    ) {
      const inputElement = <HTMLInputElement>(
        paramDiv.querySelector('[name="inputElement"]')
      );
      inputElement.value = parameters[p] + "";
      inputElement.onchange!(new Event("custom"));
    } else if (paramType === PARAMETER_TYPE.STRINGLIST) {
      const inputElement = <HTMLSelectElement>(
        paramDiv.querySelector('[name="inputElement"]')
      );
      inputElement.value = parameters[p];
      (<HTMLOptionElement>inputElement.childNodes[+parameters[p]]).setAttribute(
        "selected",
        ""
      );
      inputElement.onchange!(new Event("custom"));
    }
  }
};

export const createParameterUi = (
  session: ISessionApi,
  parent: HTMLDivElement,
  group?: string,
  names?: string[]
) => {
  for (let p in session.parameters) {
    if (session.parameters[p].hidden) continue;
    if (group) {
      if (!session.parameters[p].group) continue;
      if (session.parameters[p].group!.name !== group) continue;
    }
    if (names && !names.includes(session.parameters[p].name)) continue;

    const parameterObject = session.parameters[p];

    // create div for the current parameter
    const paramDiv = document.createElement("div");
    paramDiv.setAttribute("name", p);
    paramDiv.setAttribute("type", parameterObject.type);

    // create a label with the name of the parameter
    const label = document.createElement("label");
    label.innerHTML = parameterObject.name;

    if (
      parameterObject.type === PARAMETER_TYPE.INT ||
      parameterObject.type === PARAMETER_TYPE.FLOAT ||
      parameterObject.type === PARAMETER_TYPE.EVEN ||
      parameterObject.type === PARAMETER_TYPE.ODD
    ) {
      // create another div that will contain the label and the value input
      const div: HTMLDivElement = <HTMLDivElement>document.createElement("div");
      div.style.justifyContent = "space-between";
      div.style.display = "flex";
      paramDiv.appendChild(div);

      // add the label
      label.classList.value =
        "mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      div.appendChild(label);

      // the value input
      const valueInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      valueInputElement.classList.value =
        "mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      valueInputElement.style.width = "5rem";
      valueInputElement.setAttribute("name", "valueInputElement");
      valueInputElement.setAttribute("type", "text");
      valueInputElement.setAttribute("value", parameterObject.value + "");
      div.appendChild(valueInputElement);

      // the slider
      const parameterInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      parameterInputElement.classList.value =
        "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700";
      parameterInputElement.setAttribute("name", "inputElement");
      parameterInputElement.setAttribute("id", parameterObject.id);
      parameterInputElement.setAttribute("type", "range");
      parameterInputElement.setAttribute("min", parameterObject.min + "");
      parameterInputElement.setAttribute("max", parameterObject.max + "");
      if (parameterObject.type === PARAMETER_TYPE.INT) {
        parameterInputElement.setAttribute("step", "1");
      } else if (
        parameterObject.type === PARAMETER_TYPE.EVEN ||
        parameterObject.type === PARAMETER_TYPE.ODD
      ) {
        parameterInputElement.setAttribute("step", "2");
      } else {
        parameterInputElement.setAttribute(
          "step",
          1 / Math.pow(10, parameterObject.decimalplaces!) + ""
        );
      }
      parameterInputElement.setAttribute("value", parameterObject.value + "");
      paramDiv.appendChild(parameterInputElement);

      // the callbacks
      valueInputElement.onchange = () => {
        if (+valueInputElement.value > parameterObject.max!)
          valueInputElement.value = parameterObject.max + "";

        if (+valueInputElement.value < parameterObject.min!)
          valueInputElement.value = parameterObject.min + "";

        parameterInputElement.value =
          (<HTMLInputElement>valueInputElement).value + "";
        parameterInputElement.onchange!(new Event("text field update"));
      };
      parameterInputElement.onchange = async () => {
        valueInputElement.value = parameterInputElement.value;
        parameterObject.value = parameterInputElement.value;
        await session.customize();
      };
    } else if (parameterObject.type === PARAMETER_TYPE.BOOL) {
      // add the label
      label.classList.value =
        "mb-2 mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      paramDiv.appendChild(label);

      // the toggle
      const parameterInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      parameterInputElement.classList.value =
        "ml-2 mb-2 mt-2 w-4 h-4 text-gray-600 bg-gray-100 rounded border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
      parameterInputElement.setAttribute("name", "inputElement");
      parameterInputElement.setAttribute("id", parameterObject.id);
      parameterInputElement.setAttribute("type", "checkbox");
      if (parameterObject.value)
        parameterInputElement.setAttribute("checked", "");
      paramDiv.classList.value = "flex items-center";
      paramDiv.style.justifyContent = "space-between";
      paramDiv.appendChild(parameterInputElement);

      // the callback
      parameterInputElement.onchange = async () => {
        parameterObject.value = (<HTMLInputElement>(
          parameterInputElement
        )).checked;
        await session.customize();
      };
    } else if (parameterObject.type === PARAMETER_TYPE.STRING) {
      // add the label
      label.classList.value =
        "block mb-2 mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      paramDiv.appendChild(label);

      // the input
      const parameterInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      parameterInputElement.setAttribute("name", "inputElement");
      parameterInputElement.setAttribute("id", parameterObject.id);
      parameterInputElement.setAttribute("type", "text");
      parameterInputElement.setAttribute("value", parameterObject.value);
      parameterInputElement.classList.value =
        "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
      paramDiv.appendChild(parameterInputElement);

      // the callback
      parameterInputElement.onchange = async () => {
        parameterObject.value = parameterInputElement.value;
        await session.customize();
      };
    } else if (parameterObject.type === PARAMETER_TYPE.COLOR) {
      // create another div that will contain the label and the color input
      const div: HTMLDivElement = <HTMLDivElement>document.createElement("div");
      div.style.justifyContent = "space-between";
      div.style.display = "flex";
      paramDiv.appendChild(div);

      // add the label
      label.classList.value =
        "block mb-2 mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      div.appendChild(label);

      // the input
      const parameterInputElement = document.createElement(
        "input"
      ) as HTMLInputElement;
      parameterInputElement.setAttribute("name", "inputElement");
      parameterInputElement.setAttribute("id", parameterObject.id);
      parameterInputElement.setAttribute("type", "color");
      parameterInputElement.setAttribute(
        "value",
        (<string>parameterObject.value).replace("0x", "#").substring(0, 7)
      );
      parameterInputElement.classList.value =
        "bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:ring-gray-500 focus:border-gray-500 block dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
      div.appendChild(parameterInputElement);

      // the callback
      parameterInputElement.onchange = async () => {
        parameterObject.value = parameterInputElement.value;
        await session.customize();
      };
    } else if (parameterObject.type === PARAMETER_TYPE.STRINGLIST) {
      // add the label
      label.classList.value =
        "block mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      paramDiv.appendChild(label);

      // the dropdown
      const parameterInputElement = document.createElement(
        "select"
      ) as HTMLSelectElement;
      parameterInputElement.setAttribute("name", "inputElement");
      parameterInputElement.setAttribute("id", parameterObject.id);
      for (let j = 0; j < parameterObject.choices!.length; j++) {
        let option = document.createElement("option");
        option.setAttribute("value", j + "");
        option.setAttribute("name", parameterObject.choices![j]);
        option.innerHTML = parameterObject.choices![j];
        option.classList.value =
          "block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-gray-300";
        if (+parameterObject.value == j) option.setAttribute("selected", "");
        parameterInputElement.appendChild(option);
      }
      parameterInputElement.classList.value =
        "w-full mb-2 mt-2 right-5 text-gray-300 bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-1 py-0.5 text-center inline-flex items-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800";
      paramDiv.appendChild(parameterInputElement);

      // the callback
      parameterInputElement.onchange = async () => {
        parameterObject.value = parameterInputElement.value;
        await session.customize();
      };
    }

    parent.classList.value =
      "code-preview rounded-xl bg-gradient-to-r bg-white border border-gray-900 dark:border-gray-700 p-2 sm:p-6 dark:bg-gray-500";
    parent.appendChild(paramDiv);
  }
};
