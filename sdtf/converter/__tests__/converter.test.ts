import "reflect-metadata"
import { Reader } from "../src/index"

describe('sdtf-converter', () => {
    let reader: Reader;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    beforeEach(() => {
        reader = new Reader();
    });

    it('readFromUri - empty', async () => {
        const r = await(<any>reader).readFromUri();
        expect(r).toBe(null)
    });

    it('readFromUri - incorrect', async () => {
        const r = await(<any>reader).readFromUri('');
        expect(r).toBe(null)
    });

    it('readFromUri - invalid', async () => {
        const r = await(<any>reader).readFromUri('ee');
        expect(r).toBe(null)
    });
    
    it('readFromArrayBuffer - empty', async () => {
        const r = await(<any>reader).readFromArrayBuffer();
        expect(r).toBe(null)
    });
    
    it('readFromArrayBuffer - empty 2', async () => {
        const r = await(<any>reader).readFromArrayBuffer(null);
        expect(r).toBe(null)
    });
    
    it('readFromJson - empty', async () => {
        const r = await(<any>reader).readFromJson();
        expect(r).toBe(null)
    });
})