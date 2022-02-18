import { IAsyncReader } from "./IAsyncReader.js";
import { IPeekableAsyncReader } from "./IPeekableAsyncReader.js";


/** 
 * Layer on AsyncReader that reads in chunks to improve performance (especially if the Readable is a file stream)
 */
export class AsyncChunkReader extends IPeekableAsyncReader{

    reader: IAsyncReader;
    chunkSize: number;
    buffer: Buffer;
    bufferPos: number;
    position: number;

    constructor(reader: IAsyncReader, chunkSize: number) {
        super();
        this.reader = reader;
        this.chunkSize = chunkSize;
        this.position = 0;
    }
    
    readChunk = async (): Promise<void> => {
        
        // read another chunk
        const buf = await this.reader.read(this.chunkSize);
        
        // exclude the consumed portion of existing buffer
        const unused_buf = this.buffer ? this.buffer.slice(this.bufferPos) : null; // question: does this slice prevent dispose??

        // append the new buffer
        this.buffer = unused_buf ? Buffer.concat([unused_buf, buf]) : buf;
        this.bufferPos = 0; // reset back to the start since we excluded consumed portion above wait
    }
    
    isAtEnd() {
        if (this.buffer && (this.bufferPos < this.buffer.length))
            return false;
        return this.reader.isAtEnd();
    }

    getPosition(): number {
        return this.position;
    }

    /** Closes the stream, after which no further reading is allowed */
    close = async () => this.reader.close();

    async checkBuffer(len): Promise<void> {
        while (!this.buffer || (!this.isAtEnd() && len > (this.buffer.length - this.bufferPos))) {
            await this.readChunk();
        }
    }


    /** Returns a string containing len bytes but doesn't advance the read position pointer
     * @param len Number of bytes to peeked
     */
    async peek(len): Promise<Buffer> {

        await this.checkBuffer(len);
        return this.buffer.slice(this.bufferPos, this.bufferPos + len);

    }

    /** Returns a string containing len bytes
     * @param len Number of bytes to read
     */
    async read(len): Promise<Buffer> {

        await this.checkBuffer(len);

        const retVal = this.buffer.slice(this.bufferPos, this.bufferPos + len);
        this.bufferPos += len;
        this.position += len;
        return retVal;
    }


}
