import "reflect-metadata"
import { container } from "tsyringe";
import {Api} from '../src/index'

describe('api', () => {
    let api: Api;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    
    beforeEach(() => {
        container.clearInstances();
        api = <Api>container.resolve(Api)
        api.showMessages = false;
    });

    it('createSession - no input', async () => {
        try{
            await (<any>api).createSession()
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('createSession - wrong input', async () => {
        try{
            await (<any>api).createSession({})
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createSession - typo input', async () => {
        try{
            await (<any>api).createSession({tckt: 'asd', modelViewUrl: 'asd'})
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createSession - valid ticket and modelViewUrl, invalid id', async () => {
        try{
            await (<any>api).createSession({id: true, ticket: 'c779ad9d41eb135de16cd86e6c84ca821f2fdc60c76f7a1041cc2ec8a93895a646a1d4995e59360559f3a7308b6bd6c1a3287fe3dfe1f205637f078c08dfc49ad03b63074a21a1f3f2bd0b11e019df687920c51d948b8ab9908eb7c3ea95cd00147d79cdc8c44dc950769c7da5cbcd528ae9ceb132d7-6f70a69df8698f79a7e01fcdd6d012f7', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'})
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createSession - valid ticket and modelViewUrl, invalid bearerToken', async () => {
        try{
            await (<any>api).createSession({bearerToken: true, ticket: 'c779ad9d41eb135de16cd86e6c84ca821f2fdc60c76f7a1041cc2ec8a93895a646a1d4995e59360559f3a7308b6bd6c1a3287fe3dfe1f205637f078c08dfc49ad03b63074a21a1f3f2bd0b11e019df687920c51d948b8ab9908eb7c3ea95cd00147d79cdc8c44dc950769c7da5cbcd528ae9ceb132d7-6f70a69df8698f79a7e01fcdd6d012f7', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'})
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    
    it('createViewer - no input', async () => {
        try{
            await (<any>api).createViewer()
        } catch (e) {
           expect(e).toBeInstanceOf(Error)
        }
    });

    it('createViewer - wrong input', async () => {
        try{
            await (<any>api).createViewer({})
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createViewer - typo input', async () => {
        try{
            await (<any>api).createViewer({canvs: 'asd'})
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createViewer - invalid visibility 1', async () => {
        // fails because we do not have an http server active
        try{
            await (<any>api).createViewer({visibility: 'testIT'})        
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createViewer - invalid visibility 2', async () => {
        // fails because we do not have an http server active
        try{
            await (<any>api).createViewer({visibility: 1})        
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createViewer - invalid type 1', async () => {
        try{
            await (<any>api).createViewer({type: 'testIT'})          
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('createViewer - invalid type 2', async () => {
        try{
            await (<any>api).createViewer({type: 2})          
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
})