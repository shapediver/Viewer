import 'reflect-metadata'
import * as SDV from '@shapediver/viewer'
import * as SDVInteractions from '@shapediver/viewer.features.interaction'
import * as SDVDataEngine from '@shapediver/viewer.data-engine.data-engine'
import * as GL_MATRIX from 'gl-matrix'
import { container } from 'tsyringe';

(<any>window).sdv = SDV;
(<any>window).sdvInteractions = SDVInteractions;
(<any>window).dataEngine = container.resolve(SDVDataEngine.DataEngine);
(<any>window).GL_MATRIX = GL_MATRIX;
