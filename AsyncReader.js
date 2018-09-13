var fs = require('fs');

/** 
 * Read binary data from a file with simple async methods
 */
class AsyncReader{

  constructor(filename, highWaterMark = undefined){

      this.readable = fs.createReadStream(filename, {
          encoding: 'binary',
          highWaterMark
      })
      this.readable.on('readable', this._readableCallback.bind(this))
      this.readable.on('end', this._endCallback.bind(this))
      this.listener = null
      this.position = 0
      this.atEnd = false;
  }

  isAtEnd(){
    return this.atEnd;
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
  async close(){
      return new Promise((resolve, reject) => {
          this.readable.close(resolve)
      })
  }

  /** Returns a string containing len bytes
   * @param len Number of bytes to read
   */
  async read(len){
      
      return new Promise((resolve, reject) => {

          if (this.readable.closed){
              reject('stream is closed')
          }

          let buf = this.readable.read(len);
          if (buf == null){
              
              // wait for more data to become available
              this.listener = () => {
                  
                  // data is available. try to read again
                  if (this.readable.closed){
                      reject('stream is closed')
                  }

                  buf = this.readable.read(len)
                  if (buf == null){
                      if( this.atEnd ){
                          reject('No data to read due to end of stream reached');
                      }
                      reject('No data read even after wait. This can happen if highWaterMark is smaller than read size.')
                  }
                  else if (buf.length != len){
                      this.position += buf.length
                      reject('not enough data read')
                  }
                  else{
                      this.position += buf.length
                      resolve(buf)
                  }

              }
          }
          else if (buf.length != len){
              this.position += buf.length
              reject('not enough data read')
          }
          else{
              this.position += buf.length
              resolve(buf)
          }
          
      });
  }

}
module.exports = AsyncReader