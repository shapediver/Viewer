import "reflect-metadata"
import { api, RENDERERTYPE, CAMERATYPE, LIGHTTYPE, LOGGINGLEVEL } from "@shapediver/viewer"

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;
