/**
 * virtualize the key events by using **commands**.
 * **Commands** are string that represent an event. One command can be
 * mapped on multiple keys, for example 'up' could be associated to 
 * 'ArrowUp' and 'W'.\
 * By default, there are some keys that are already mapped. 
 * ```javascript
 * 'up': 'ArrowUp', 'W';
 * 'left': 'ArrowLeft', 'A';
 * 'down': 'ArrowDown', 'S';
 * 'right': 'ArrowRight', 'D';
 * ```
 * if you don't like it, use:
 * ```javascript 
 * // unmap all the keys to commands
 * keymap.unmapAll()
 * // unmap specified key from the corresponding command
 * keymap.unmap( key )
 * ```
 */
export default class KeyMap {
      /**
       * map each event listener to the corresponding command
       * @type {Map<string,Set<()=>void>>}
       */
      #commands;
      /**
       * @type {Map<string,string>}
       */
      #keys;


      constructor(){
            this.#commands = new Map();
            this.#keys = new Map();

            this.#keys.set( 'ArrowUp', 'up' );
            this.#keys.set( 'w', 'up' );

            this.#keys.set( 'ArrowLeft', 'left' );
            this.#keys.set( 'a', 'left' );

            this.#keys.set( 'ArrowDown', 'down' );
            this.#keys.set( 's', 'down' );

            this.#keys.set( 'ArrowRight', 'right' );
            this.#keys.set( 'd', 'right' );

            window.addEventListener( 'keydown', e => {
                  if( !this.#keys.has( e.key ) ){
                        return;
                  }

                  const command = this.#keys.get( e.key )

                  if( !this.#commands.has( command ) ){
                        return;
                  }

                  this.#commands.get( command ).forEach( f => f() );
            });
      }
      /**
       * @param {string} command 
       * @param {()=>void} listener 
       */
      on( command, listener ){
            let cmds = this.#commands.get( command );

            if( !cmds ){
                  cmds = new Set();
                  this.#commands.set( command, cmds );
            }

            cmds.add( listener );
      }

      /**
       * @param {string} key 
       * @param {string} command 
       */
      map( key, command ){
            this.#keys.set( key, command );
      }

      /**
       * @param {string} key 
       */
      unmap( key ){
            this.#keys.delete( key )
      }

      /**
       * unmap every mapped key from the corresponding command
       */
      unmapAll(){
            this.#keys.clear();
      }

      /**
       * @param {string} command 
       * @param {()=>void} listener 
       */
      removeListener( command, listener ){
            if( !this.#commands.has( command ) )
                  return;

            this.#commands.get( command ).delete( listener );
      }
      /**
       * remove every listener from the map
       */
      clear(){
            this.#commands.clear();
      }
}