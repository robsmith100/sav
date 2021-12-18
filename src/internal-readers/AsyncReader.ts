import * as stream from "stream";
import { IAsyncReader } from "./IAsyncReader.js";


/** 
 * Read binary data from a Readable with simple async methods
 */
export class AsyncReader extends IAsyncReader{

    readable: stream.Readable; // fs.ReadStream;
    listener: Function;
    position: number;
    atEnd: boolean;

    constructor(readable: stream.Readable) {
        super();
        this.readable = readable;

        this.readable.on("readable", this._readableCallback.bind(this))
        //this.readable.on("error", (err) => { throw err });
        this.readable.on("end", this._endCallback.bind(this))
                
        this.listener = null
        this.position = 0
        this.atEnd = false;
    }

    isAtEnd(){
        return this.atEnd;
    }

    getPosition(): number {
        return this.position;
    }

    /**
     * is called when data is ready to be read
     */
    _readableCallback(){
        if( this.listener != null ){
            let cb = this.listener
            this.listener = null
            cb()
        }
    }

    /**
     * is called when end of stream is reached
     */
    _endCallback(){
        this.atEnd = true;
    }

    /** Closes the stream, after which no further reading is allowed */
    async close() {
        this.readable.destroy();
    }

    /** Returns a string containing len bytes
     * @param len Number of bytes to read
     */
    async read(len): Promise<Buffer>{
        
        return new Promise<Buffer>((resolve, reject) => {

            if (!this.readable.readable) {
                reject('stream is closed')
            }

            let buf: Buffer = this.readable.read(len) as Buffer;
            if (!buf){
                
                // wait for more data to become available
                this.listener = () => {
                    
                    // data is available. try to read again

                    if (!this.readable.readable) {
                        reject('stream is closed')
                    }

                    // read again
                    buf = this.readable.read(len) as Buffer;
                    if (buf === null){
                        if( this.atEnd ){
                            reject('No data to read due to end of stream reached');
                        }
                        reject('No data read even after wait. This can happen if highWaterMark is smaller than read size.')
                    }
                    // else if (buf.length !== len){
                    //     this.position += buf.length
                    //     reject('not enough data read')
                    // }
                    else{
                        this.position += buf.length
                        resolve(buf)
                    }

                }
            }
            // else if (buf.length !== len){
            //     this.position += buf.length
            //     reject('not enough data read')
            // }
            else{
                this.position += buf.length
                resolve(buf);
            }
            
        });
    }

}
