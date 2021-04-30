import "reflect-metadata"
import * as SD from "@shapediver/viewer"

(<any>window).RENDERERTYPE = SD.RENDERERTYPE;
(<any>window).CAMERATYPE = SD.CAMERATYPE;
(<any>window).LIGHTTYPE = SD.LIGHTTYPE;
(<any>window).VISIBILITYMODE = SD.VISIBILITYMODE;
(<any>window).LOGGINGLEVEL = SD.LOGGINGLEVEL;
(<any>window).EVENTTYPE = SD.EVENTTYPE;
(<any>window).EXPORTTYPE = SD.EXPORTTYPE;
(<any>window).PARAMETERTYPE = SD.PARAMETERTYPE;
(<any>window).PARAMETERVISUALIZATION = SD.PARAMETERVISUALIZATION;

(<any>window).api = SD.api;
(<any>window).sceneTree = SD.api.sceneTree;
