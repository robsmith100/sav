

export abstract class IAsyncReader{

    /** Returns current read position within stream */
    abstract getPosition(): number;

    /** Returns true if entire stream has been read */
    abstract isAtEnd(): boolean;

    /** Closes stream */
    abstract close(): void;

    /** Reads len bytes from stream */
    abstract read(len): Promise<Buffer>;

}
