var PeekableAsyncReader = require('./PeekableAsyncReader')

class BufferChunkReader{

    constructor(buffer) {
        this.buffer = buffer;
        this.bufferPos = 0;

        this.commandPointer = 0;
        this.commandBuffer = null;
    }

    //buffer;
    //bufferPos = 0;

    async close(){
    }

    getPosition(){
        return this.bufferPos;
    }

    isAtEnd() {
        return this.bufferPos === this.buffer.length;
    }

    async peek(len) {
        return await this.read(len, true);
    }

    async peekByte() {
        if (this.bufferPos < this.buffer.length) {
            return this.buffer[this.bufferPos];
        }
        else {
            throw new Error("EOF");
        }
    }

    async peekInt(){
        var buf = await this.peek(4);
        if( buf != null && buf.length == 4 ){
            var result = (
                (buf[0]) |
                (buf[1] << 8) | 
                (buf[2] << 16) | 
                (buf[3] << 24));
            return result;
        }
        return null;
    }

    async read(len, peekOnly = false) {
        if (this.bufferPos + len > this.buffer.length) {
            throw new Error("EOF");    
        }

        let bytes = [];
        let i = 0;
        while (i < len) {
            bytes.push(this.buffer[this.bufferPos + i]);
            i++;
        }
        if (!peekOnly) {
            this.bufferPos += len; // advance buffer position
        }
        return bytes;
    }

    async readInt32(){
        var buf = await this.read(4);
        if( buf != null && buf.length == 4 ){
            var result = (
                (buf[0]) |
                (buf[1] << 8) | 
                (buf[2] << 16) | 
                (buf[3] << 24));
            return result;

        }
        return null;
    }

    async readByte() {
        const byte = this.buffer[this.bufferPos];
        this.bufferPos++;
        return byte;
    }

    async readDouble(){
        var buf = await this.read(8);
        if( buf != null && buf.length == 8 ){
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
            let d = dv.getFloat64();
            return d;
        }
        return null;
    }

    async getCommandCode(){

        if (this.commandPointer == 0) {
            // read command bytes from buffer
            this.commandBuffer = await this.read(8);
        }

        let code = this.commandBuffer[this.commandPointer];

        this.commandPointer++;
        if (this.commandPointer === 8)
            this.commandPointer = 0;

        return code;
    }

    async readDouble2(compression){
        if (compression == null)
            return await this.readDouble();

        var code = await this.getCommandCode();
        while (code === 0)
            code = await this.getCommandCode();

        let d = null;

        if (code > 0 && code < 252 ){
            // compressed data
            d = code - compression.bias;
        }
        else if (code == 252) {
            // end of file
        }
        else if (code == 253) {
            // non-compressible piece, read from stream
            d = await this.readDouble(); // reads from end (since commands have already been read)
        }
        else if (code == 254) {
            // string value that is all spaces

            //d = 0x2020202020202020;

            // shouldn't get here!
            //d = null;
            
        }
        else if (code == 255) {
            // system-missing
        }
        else if (code == 0) {
            // ignore
        }
        else {
            throw new Error('unknown error reading compressed double');
        }

        return d;

    }



    async read8CharString(compression){
        if (compression == null)
            return await this.readString(8);
        
        var code = await this.getCommandCode();
        while (code === 0)
            code = await this.getCommandCode();

        let str = null;

        if (code > 0 && code < 252) {
            // compressed data
            //d = code - bias;

            // shouldn't get here!
        }
        else if (code == 252) {
            // end of file
        }
        else if (code == 253) {
            // non-compressible piece, read from stream
            str = await this.readString(8); // reads from end (since commands have already been read)
        }
        else if (code == 254) {
            // string value that is all spaces
            str = '        '; // todo: figure out if this should be empty (len=0)
        }
        else if (code == 255) {
            // system-missing
        }
        else if (code == 0) {
            // ignore
        }
        else {
            throw new Error('unknown error reading compressed string');
        }

        return str;

    }
    

    async readString(len, trimEnd = false) {
        if (len < 1) return "";
        const buf = await this.read(len);
        if (buf != null && buf.length == len) {
            const strBuf = buf.map(b => String.fromCharCode(b)).join("");
            return trimEnd ? strBuf.trimEnd() : strBuf;
        }
    }

    async readBytes(len){
        return this.read(len);
    }

}

module.exports = BufferChunkReader;