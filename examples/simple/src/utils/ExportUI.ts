import { ISessionApi, IViewportApi } from "@shapediver/viewer";
import { IOutput } from "../interfaces/parameterDefinitions";

export const createExportUi = (
  session: ISessionApi,
  viewport: IViewportApi,
  parent: HTMLDivElement,
  names?: IOutput[]
) => {
  if (names) {
    const exportNames = Object.values(session.exports).map((e) => {
      return e.name;
    });
    const outputs = Object.values(session.outputs);
    for (let i = 0; i < names.length; i++) {
      if (typeof names[i] === "string") continue;

      // if the name is not an export name
      if (!exportNames.includes(names[i].name)) {
        const output = outputs.find((o) => o.name === names[i].name);
        if (!output) continue;

        // create div for the current parameter
        const exportDiv = document.createElement("div");
        exportDiv.setAttribute("name", names[i].name);

        // create a label with the name of the parameter
        const label = document.createElement("label");
        label.innerHTML = names[i].name;

        // create another div that will contain the label and the value input
        const div: HTMLDivElement = <HTMLDivElement>(
          document.createElement("div")
        );
        div.style.justifyContent = "space-between";
        div.style.display = "flex";
        exportDiv.appendChild(div);

        // add the label
        label.classList.value =
          "block mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
        div.appendChild(label);

        const buttonElement = document.createElement(
          "button"
        ) as HTMLButtonElement;
        buttonElement.classList.value =
          "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800";
        buttonElement.innerHTML = "Download";
        div.appendChild(buttonElement);

        buttonElement.onclick = async () => {
          const currentValues: { [key: string]: string } = {};
          if (names[i].parameters) {
            for (let j = 0; j < names[i].parameters!.length; j++) {
              const paramDef = names[i].parameters![j];
              const sessionParameter = session.getParameterByName(
                paramDef.name
              )[0];
              currentValues[sessionParameter.id] = sessionParameter.stringify();
              session.parameters[sessionParameter.id].value = paramDef.value;
            }
            await session.customize();
            viewport.update();
          }

          const currentVisibility = output.node!.visible;
          output.node!.visible = true;
          const blob = await viewport.convertToGlTF(output.node);

          let a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = output.name + ".gltf";
          a.click();

          output.node!.visible = currentVisibility;

          if (names[i].parameters) {
            for (let p in currentValues)
              session.parameters[p].value = currentValues[p];
            await session.customize();
            viewport.update();
          }
        };

        parent.classList.value =
          "code-preview rounded-xl bg-gradient-to-r bg-white border border-gray-900 dark:border-gray-700 p-2 sm:p-6 dark:bg-gray-500";
        parent.appendChild(exportDiv);
      }
    }
  }

  for (let e in session.exports) {
    if (session.exports[e].hidden) continue;
    if (names) {
      const allNames = names?.map((n) => n.name);
      if (!allNames.includes(session.exports[e].name)) continue;
    }
    const exportObject = session.exports[e];
    const definition = names?.find((n) => n.name === exportObject.name)!;

    // create div for the current parameter
    const exportDiv = document.createElement("div");
    exportDiv.setAttribute("name", e);

    // create a label with the name of the parameter
    const label = document.createElement("label");
    label.innerHTML = exportObject.name;

    if (exportObject.type === "email") {
      // create another div that will contain the label and the value input
      const div: HTMLDivElement = <HTMLDivElement>document.createElement("div");
      div.style.justifyContent = "space-between";
      div.style.display = "flex";
      exportDiv.appendChild(div);

      // add the label
      label.classList.value =
        "block mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      div.appendChild(label);

      const buttonElement = document.createElement(
        "button"
      ) as HTMLButtonElement;
      buttonElement.classList.value =
        "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800";
      buttonElement.innerHTML = "Send";
      div.appendChild(buttonElement);

      buttonElement.onclick = async () => {
        await exportObject.request();
      };
    } else if (exportObject.type === "download") {
      // create another div that will contain the label and the value input
      const div: HTMLDivElement = <HTMLDivElement>document.createElement("div");
      div.style.justifyContent = "space-between";
      div.style.display = "flex";
      exportDiv.appendChild(div);

      // add the label
      label.classList.value =
        "block mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
      div.appendChild(label);

      const buttonElement = document.createElement(
        "button"
      ) as HTMLButtonElement;
      buttonElement.classList.value =
        "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800";
      buttonElement.innerHTML = "Download";
      div.appendChild(buttonElement);

      buttonElement.onclick = async () => {
        const parameters: { [key: string]: string } = {};
        if (definition.parameters) {
          for (let i = 0; i < definition.parameters!.length; i++) {
            const sessionParameter = session.getParameterByName(
              definition.parameters[i].name
            )[0];
            parameters[sessionParameter.id] =
              definition.parameters[i].value + "";
          }
        }
        const exportResponse = await exportObject.request(parameters);

        if (
          exportResponse.content &&
          exportResponse.content[0] &&
          exportResponse.content[0].href
        ) {
          let a = document.createElement("a");
          a.href = exportResponse.content![0].href;
          a.download = "export";
          a.click();
        } else {
          if (exportResponse.msg) alert(exportResponse.msg);
        }
      };
    }

    parent.classList.value =
      "code-preview rounded-xl bg-gradient-to-r bg-white border border-gray-900 dark:border-gray-700 p-2 sm:p-6 dark:bg-gray-500";
    parent.appendChild(exportDiv);
  }
};
