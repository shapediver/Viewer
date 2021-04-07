import "reflect-metadata"
import { api, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, VISIBILITYMODE, LOGGINGLEVEL, EVENTTYPE } from "@shapediver/viewer"

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).VISIBILITYMODE = VISIBILITYMODE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;
(<any>window).EVENTTYPE = EVENTTYPE;
