import { IPeekableAsyncReader } from "./IPeekableAsyncReader.js";


export class CommandReader {

    reader: IPeekableAsyncReader;
    commandPointer: number;
    commandBuffer: Buffer;

    constructor(reader: IPeekableAsyncReader) {
        this.reader = reader;
        this.commandPointer = 0;
        this.commandBuffer = null;
    }

    close = (): void => this.reader.close();
    
    getPosition = (): number => this.reader.getPosition();

    isAtEnd = (): boolean => this.reader.isAtEnd();
    
    peek = async (len: number): Promise<Buffer> => await this.reader.peek(len);
    
    async peekByte(): Promise<number> {

        // first check commandBuffer, but if it returns a zero ... find the first non-zero (temp workaround)
        if (this.commandPointer > 0 && this.commandPointer < 8) {
            let i = this.commandPointer;
            let b = this.commandBuffer[i];
            while (b === 0 && i < 8) {
                i++;
                b = this.commandBuffer[i];
            }
            if (b !== 0) return b;
        }

        // otherwise...
        var buf = await this.reader.peek(1);
        if (buf.length !== 1) throw Error("not enough bytes read to peek a Byte");
        return buf[0];
    }

    async peekInt(): Promise<number> {
        var buf = await this.reader.peek(4);
        if (buf.length !== 4) throw Error("not enough bytes read to peek an Int32");
        return (
            (buf[0]) |
            (buf[1] << 8) |
            (buf[2] << 16) |
            (buf[3] << 24));
        
    }

    async readInt32(): Promise<number> {
        var buf = await this.reader.read(4);
        if (buf.length !== 4) throw Error("not enough bytes read for Int32");
        return (
            (buf[0]) |
            (buf[1] << 8) |
            (buf[2] << 16) |
            (buf[3] << 24));
    }

    async readByte(): Promise<number> {
        var buf = await this.reader.read(1);
        if (buf.length !== 1) throw Error("not enough bytes read for Byte");
        return buf[0];
    }

    async readDouble(): Promise<number> {

        var buf = await this.reader.read(8);
        if (buf.length !== 8) throw Error("not enough bytes read for Double");
        
        var ab = new ArrayBuffer(8);
        var bufView = new Uint8Array(ab);
        bufView[0] = buf[7];
        bufView[1] = buf[6];
        bufView[2] = buf[5];
        bufView[3] = buf[4];
        bufView[4] = buf[3];
        bufView[5] = buf[2];
        bufView[6] = buf[1];
        bufView[7] = buf[0];
        let dv = new DataView(ab);
        let d = dv.getFloat64(0);

        return d;
    
    }

    async getCommandCode(): Promise<number>{

        if (this.commandPointer === 0) {
            // read command bytes into buffer
            this.commandBuffer = await this.reader.read(8);
            if (this.commandBuffer.length === 0) return null;
            if (this.commandBuffer.length !== 8) throw Error("not enough bytes read for command");
        }

        let code = this.commandBuffer[this.commandPointer];

        this.commandPointer++;
        if (this.commandPointer === 8)
            this.commandPointer = 0;
        
        return code;
    }

    async readDouble2(compression): Promise<number>{
        if (compression == null)
            return await this.readDouble();
        
        let code = await this.getCommandCode();
        while (code === 0)
            code = await this.getCommandCode(); // huh? padding or something?
        
        let d = null;

        if (code > 0 && code < 252 ){
            // compressed data
            d = code - compression.bias;
        }
        else if (code === 252) {
            // end of file
        }
        else if (code === 253) {
            // non-compressible piece, read from stream
            d = await this.readDouble(); // reads from end (since commands have already been read)
        }
        else if (code === 254) {
            // string value that is all spaces

            //d = 0x2020202020202020;

            // shouldn't get here!
            //d = null;
            
        }
        else if (code === 255) {
            // system-missing
        }
        else if (code === 0) {
            // ignore
        }
        else if (code === null) {
            // ignore    
        }
        else {
            throw new Error('unknown error reading compressed double. code is ' + code);
        }

        return d;

    }

    async read8CharString(compression): Promise<string>{
        
        if (compression == null)
            return await this.readString(8);
        
        var code = await this.getCommandCode();
        while (code === 0)
            code = await this.getCommandCode();

        let str: string = null;

        if (code > 0 && code < 252) {
            // compressed data
            //d = code - bias;

            // shouldn't get here!
        }
        else if (code === 252) {
            // end of file
        }
        else if (code === 253) {
            // non-compressible piece, read from stream
            str = await this.readString(8); // reads from end (since commands have already been read)
        }
        else if (code === 254) {
            // string value that is all spaces
            str = '        '; // todo: figure out if this should be empty (len=0)
        }
        else if (code === 255) {
            // system-missing
        }
        else if (code === 0) {
            // ignore
        }
        else if (code === null) {
            // ignore
        }
        else {
            throw new Error('unknown error reading compressed string');
        }

        return str;

    }
    

    /**
     * WHAT ENCODING TO USE?
     */
    async readString(len, trimEnd = false) : Promise<string> {
        if (len < 1) return "";
        var buf = await this.reader.read(len);
        if (buf.length !== len) throw Error("not enough bytes read for string of length " + len);
        const strBuf = buf.toString()
        return trimEnd ? strBuf.trimEnd() : strBuf;
    }

    async readBytes(len) : Promise<Buffer>{
        var buf = await this.reader.read(len);
        if (buf.length !== len) throw Error("not enough bytes read for Byte array of length " + len);
        return buf;
    }

}

