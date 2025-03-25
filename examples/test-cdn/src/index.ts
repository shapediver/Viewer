import * as SDV from "@shapediver/viewer";
import * as SDVAttributeVisualization from "@shapediver/viewer.features.attribute-visualization";
import * as SDVDrawingTools from "@shapediver/viewer.features.drawing-tools";
import * as SDVGumball from "@shapediver/viewer.features.gumball";
import * as SDVInteractions from "@shapediver/viewer.features.interaction";

(<any>window).SDV = SDV;
(<any>window).SDVInteractions = SDVInteractions;
(<any>window).SDVAttributeVisualization = SDVAttributeVisualization;
(<any>window).SDVDrawingTools = SDVDrawingTools;
(<any>window).SDVGumball = SDVGumball;
