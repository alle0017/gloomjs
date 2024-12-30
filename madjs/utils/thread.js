export default class MasterThread {

      /**
       * @type {Object.<string,Array<(args: Object)=> void>>}
       */
      #listeners = {};

      /**
       * @readonly
       * @type {Worker}
       */
      #thread;

      /**
       * @type {{msg: string, args: Object, transferable: Transferable[]}[]}
       */
      #waitQueue = [];

      /**
       * @type {boolean}
       */
      #waiting = false;

      /**
       * 
       * @param {string} url 
       * @param {boolean} [checkUrl=false] 
       */
      constructor( url, checkUrl = false ) { 
            checkUrl && console.log(`starting thread from ${url}`);
            this.#thread = new Worker( url, {
                  type: 'module',
            } );
            this.#thread.onerror = e =>  console.error( e.message );
            this.#thread.addEventListener( 'message', e =>{
                  if( e.data && 'message' in e.data ){
                        if( this.#listeners[ e.data.message ] )
                              this.#listeners[ e.data.message ].forEach( method => method(e.data.args) );
                  }
            });
      }

      /**
       * 
       * @param {string} event 
       * @param {Object} message 
       * @param {Transferable[]} transferable 
       */
      sendMessage( event, message, transferable = [] ){
            try {
                  if( this.#waiting ){
                        this.#waitQueue.push({
                              msg: event,
                              args: message,
                              transferable,
                        });
                        return;
                  }
                  this.#thread.postMessage({
                        message: event,
                        args: message,
                  }, transferable);
            }catch{
                  throw new Error( '[wgpu] message cannot be serialized' );
            }
      }
      /**
       * 
       * @param {string} message 
       * @param {( args: Object )=> void} method 
       */
      onMessage( message, method ){
            if( !this.#listeners[message] )
                  this.#listeners[message] = [];
            this.#listeners[message].push( method );
      }

      /**
       * 
       * @param {string} message 
       */
      async waitFor( message ){
            this.#waiting = true;
            return new Promise( resolve => {
                  this.onMessage( message, e =>{
                        resolve( e );
                        this.#waiting = false;
                        this.#waitQueue.forEach( wait => {
                              this.sendMessage( wait.msg, wait.args, wait.transferable );
                        });
                        this.#waitQueue = [];
                  });
            });
      }

      terminate(){
            this.#thread.terminate();
      }
}

/**
 * @namespace 
 */
export const SlaveThread = {
      /**
       * @type {Map<string,Array<(args: Object)=> void>>}
       * @private
       */
      __listeners: new Map(),
      /**
       * @private
       * @type {boolean}
       */
      __initialized: false,

      /**
       * @private
       */
      __initializer(){
            self.addEventListener( 'message', e =>{
                  if( e.data && 'message' in e.data ){

                        if( this.__listeners.has( e.data.message ) ){
                              this.__listeners.get( e.data.message ).forEach( method => method(e.data.args) );
                        }
                  }
            });
            this.__initialized = true;
      },

      /**
       * 
       * @param {string} message 
       * @param {( args: Object )=> void} method 
       */
      onMessage( message, method ){
            if( !this.__initialized )
                  this.__initializer();

            let a = this.__listeners.get( message )

            if( !a ){
                  a = [];
                  this.__listeners.set( message, a );
            }
            a.push( method );
      },

      /**
      * 
      * @param {string} message 
      * @returns {Promise<Object>}
      */
      async waitFor( message ){
            if( !this.__initialized )
                  this.__initializer();

            return new Promise( resolve => {
                  let a = this.__listeners.get( message )

                  if( !a ){
                        a = [];
                        this.__listeners.set( message, a );
                  }
                  a.push( resolve );
            });
      },

      /**
       * 
       * @param {string} event 
       * @param {Object} message 
       */
      sendMessage( event, message ){
            try {
                  self.postMessage({
                        message: event,
                        args: message,
                  });
            }catch{
                  throw new Error( '[wgpu] message cannot be serialized' );
            }
      }
};