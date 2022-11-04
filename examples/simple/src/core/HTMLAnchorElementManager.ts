import {
  HTMLElementAnchorCustomData,
  HTMLElementAnchorData,
  IAnchorDataImage,
  IHTMLElementAnchorData,
  TreeNode
} from "@shapediver/viewer";
import {
  DragManager,
  InteractionData
} from "@shapediver/viewer.features.interaction";
import { vec2, vec3 } from "gl-matrix";

export const anchorData: HTMLElementAnchorCustomData[] = [];
let dragManager: DragManager;

export const enableImageInteraction = () => {
  for (let i = 0; i < anchorData.length; i++) {
    anchorData[i].data.imageElement.style.userSelect = "";
    anchorData[i].data.imageElement.style.cursor = "";
    anchorData[i].data.imageElement.style.pointerEvents = "";
  }
};

export const disableImageInteraction = () => {
  for (let i = 0; i < anchorData.length; i++) {
    anchorData[i].data.imageElement.style.userSelect = "none";
    anchorData[i].data.imageElement.style.cursor = "default";
    anchorData[i].data.imageElement.style.pointerEvents = "none";
  }
};

const createDraggable = (properties: {
  anchor: HTMLElementAnchorData;
  parent: HTMLDivElement;
}) => {
  const img = document.createElement("img");
  img.style.position = "absolute";
  img.style.zIndex = "100";
  document.getElementById("canvas")!.parentElement!.appendChild(img);
  properties.anchor.data.imageElement = img;

  const imageData: IAnchorDataImage = properties.anchor.data.image;
  img.src = imageData.src;
  if (imageData.height) img.height = imageData.height;
  if (imageData.width) img.width = imageData.width;
  if (imageData.alt) img.alt = imageData.alt;

  const clickCallback = () => {
    dragManager.setNode(properties.anchor.data.node);
    disableImageInteraction();
    return false;
  };

  img.ontouchstart = clickCallback;
  img.ondragstart = clickCallback;
  img.onclick = clickCallback;
};

const create = (properties: {
  anchor: HTMLElementAnchorData;
  parent: HTMLDivElement;
}) => {
  const img = document.createElement("img");
  img.style.position = "absolute";
  img.style.opacity = "0.5";
  document.getElementById("canvas")!.parentElement!.appendChild(img);
  properties.anchor.data.imageElement = img;

  const imageData: IAnchorDataImage = properties.anchor.data.image;
  img.src = imageData.src;
  if (imageData.height) img.height = imageData.height;
  if (imageData.width) img.width = imageData.width;
  if (imageData.alt) img.alt = imageData.alt;
};

const update = (properties: {
  anchor: IHTMLElementAnchorData;
  page: vec2;
  container: vec2;
  client: vec2;
  scale: vec2;
  hidden: boolean;
}) => {
  const image = properties.anchor.data.imageElement;
  image.style.display = "";
  if (properties.anchor.hideable && properties.hidden)
    image.style.display = "none";

  let x = properties.client[0] / properties.scale[0] - image.offsetWidth / 2;
  let y = properties.client[1] / properties.scale[1] - image.offsetHeight / 2;
  image.style.left = x + "px";
  image.style.top = y + "px";
};

export const createHTMLAnchor = (
  location: vec3,
  imageSrc: string,
  imageAlt: string
) => {
  const dragNode = new TreeNode();

  const anchorData = new HTMLElementAnchorCustomData({
    location,
    data: {
      name: imageAlt,
      image: <IAnchorDataImage>{
        alt: imageAlt,
        src: imageSrc,
        width: 50,
        height: 50
      },
      node: dragNode
    },
    hideable: false,
    create,
    update
  });

  dragNode.data.push(anchorData);
  return {
    dragNode,
    anchorData
  };
};

export const createDraggableHTMLAnchor = (
  location: vec3,
  imageSrc: string,
  imageAlt: string
) => {
  const dragNode = new TreeNode();
  const iData = new InteractionData({ drag: true });
  iData.dragOrigin = vec3.create();
  dragNode.addData(iData);

  const anchorData = new HTMLElementAnchorCustomData({
    location,
    data: {
      name: imageAlt,
      image: <IAnchorDataImage>{
        alt: imageAlt,
        src: imageSrc,
        width: 50,
        height: 50
      },
      node: dragNode
    },
    hideable: false,
    create: createDraggable,
    update
  });

  dragNode.data.push(anchorData);
  return {
    dragNode,
    anchorData
  };
};

export const setDragManager = (d: DragManager) => {
  dragManager = d;
};
