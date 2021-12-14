var PeekableAsyncReader = require('./PeekableAsyncReader')

/** need a more fitting name for this */
class ChunkReader{

    constructor(filename){
        this.reader = new PeekableAsyncReader(filename, 1048576);
        this.commandPointer = 0;
        this.commandBuffer = null;
    }

    async close(){
        return this.reader.close();
    }

    getPosition(){
        return this.reader.getPosition();
    }

    isAtEnd(){
        return this.reader.isAtEnd();
    }

    async peek(len){
        return this.reader.peek(len);
    }

    async peekByte(){
        var buf = await this.reader.peek(1);
        if( buf != null && buf.length == 1 ){
            return buf.charCodeAt(0);
        }
        return null;
    }

    async peekInt(){
        var buf = await this.reader.peek(4);
        if( buf != null && buf.length == 4 ){
            var result = (
                (buf.charCodeAt(0)) |
                (buf.charCodeAt(1) << 8) | 
                (buf.charCodeAt(2) << 16) | 
                (buf.charCodeAt(3) << 24));
            return result;
        }
        return null;
    }

    async read(len){
        return await this.reader.read(len);
    }


    async readInt32(){
        var buf = await this.reader.read(4);
        if( buf != null && buf.length == 4 ){
            //return new DataView(buf).getInt32();
            var result = (
                (buf.charCodeAt(0)) |
                (buf.charCodeAt(1) << 8) | 
                (buf.charCodeAt(2) << 16) | 
                (buf.charCodeAt(3) << 24));
            return result;

        }
        return null;
    }

    async readByte(){
        var buf = await this.reader.read(1);
        if( buf != null && buf.length == 1 ){
            return buf.charCodeAt(0);
        }
        return null;
    }

    async readDouble(){
        var buf = await this.reader.read(8);
        if( buf != null && buf.length == 8 ){
            var ab = new ArrayBuffer(8);
            var bufView = new Uint8Array(ab);
            bufView[0] = buf.charCodeAt(7);
            bufView[1] = buf.charCodeAt(6);
            bufView[2] = buf.charCodeAt(5);
            bufView[3] = buf.charCodeAt(4);
            bufView[4] = buf.charCodeAt(3);
            bufView[5] = buf.charCodeAt(2);
            bufView[6] = buf.charCodeAt(1);
            bufView[7] = buf.charCodeAt(0);
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

        let code = this.commandBuffer.charCodeAt(this.commandPointer);

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
        var buf = await this.reader.read(len);
        if( buf != null && buf.length == len ){
            return trimEnd ? buf.trimEnd() : buf;
        }
    }

    async readBytes(len){
        var buf = await this.reader.read(len);
        if( buf != null && buf.length == len ){
            return buf;
        }
    }

}

module.exports = ChunkReader;