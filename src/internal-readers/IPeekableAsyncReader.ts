import { IAsyncReader } from "./IAsyncReader.js";


export abstract class IPeekableAsyncReader extends IAsyncReader{

    /** Reads len bytes from stream */
    abstract peek(len): Promise<Buffer>;

}
