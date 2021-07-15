import 'reflect-metadata'

import { Encoder } from '../src/Encoder'

describe('sdtf-parser', () => {
    let encoder: Encoder = new Encoder();

    it('encodeFromUriToArrayBuffer - no uri', async () => {
        try {
            await encoder.encodeFromUriToArrayBuffer('');
        } catch(e) {
            expect(e.message).toBe('The uri is an empty string.');
        }
    });
    
    it('encodeFromUriToArrayBuffer - uri to no file', async () => {
        try {
            await encoder.encodeFromUriToArrayBuffer('sdf');
        } catch(e) {
            expect(e.message).toBe('Was not able to get array buffer from uri.');
            expect(e.fullError).toBeDefined()
        }
    });

    it('encodeFromUriToArrayBuffer - correct uri', async () => {
        try {
            let arraybuffer = await encoder.encodeFromUriToArrayBuffer('https://shapediverdemos.s3.amazonaws.com/sdtf/sample.sdtf');
            expect(arraybuffer).toBeInstanceOf(ArrayBuffer);
        } catch(e) {
            // should not throw an exception
            expect(e).toBeNull();
        }
    });


    it('encodeFromArrayBufferToJson - empty array buffer', async () => {
        try {
            let arraybuffer: ArrayBuffer = new ArrayBuffer(0);
            let json = await encoder.encodeFromArrayBufferToJson(arraybuffer);
        } catch(e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    it('encodeFromArrayBufferToJson - correct array buffer', async () => {
        try {
            let arraybuffer = await encoder.encodeFromUriToArrayBuffer('https://shapediverdemos.s3.amazonaws.com/sdtf/sample.sdtf');
            let result = await encoder.encodeFromArrayBufferToJson(arraybuffer!);
            expect(result!.json).toBeDefined()
            expect(result!.json).toHaveProperty('version')
            expect(result!.json).toHaveProperty('chunks')
            expect(result!.json).toHaveProperty('nodes')
            expect(result!.json).toHaveProperty('typeHints')
            expect(result!.json).toHaveProperty('attributes')
            expect(result!.json).toHaveProperty('items')
        } catch(e) {
            // should not throw an exception
            expect(e).toBeNull();
        }
    });
})