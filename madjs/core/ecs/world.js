import RenderingSystem from "../game/system/rendering.js";

/**@import System from "./system.js"*/
/**@import Component from "./component.js"*/
/**@import Entity from "./entity.js"*/
/**@import Camera from "../camera/camera.js" */



export default class World {
      static #id = 0;

      /**
       * @type {Map<number,Entity>}
       */
      #entities = new Map();
      /**
       * @type {Map<string,Entity[]>}
       */
      #classNames = new Map();
      /**
       * @type {Set<System>}
       */
      #systems = new Set();

      /**
       * @type {Set<( world: World ) => void>}
       * @readonly
       */
      #update = new Set();

      /**
       * @readonly
       */
      #wid;

      constructor(){
            this.#wid = World.#id++;
      }

      /**
       * @param {System<Component>} system
       */
      addSystem( system ){
            this.#systems.add( system );
      }

      /**
       * @param {Entity} entity 
       */
      addEntity( entity ){
            this.#entities.set( entity.id, entity );

            entity.class.forEach( className => {
                  let a = this.#classNames.get( className )

                  if( !a ){
                        a = [];
                        this.#classNames.set( className, a )
                  }

                  a.push( entity );
            })
      }
      /**
       * returns all the entities with a specific class
       * @param {string} className 
       */
      queryEntityByClass( className ){
            return this.#classNames.get( className ) || [];
      }
      /**
       * return the entity with the specified `id`. return `null` if the entity doesn't exists
       * @param {number} id 
       */
      queryEntityById( id ){
            return this.#entities.get( id );
      }

      run(){
            this.#update.forEach( f => f( this ) );
            this.#systems.forEach( sys => sys.update( this ) ); 
      }

      /**
       * @param {( world: World ) => void} callback
       */      
      onUpdate( callback ){
            this.#update.add( callback );
      }

      free(){
            this.#entities.forEach( v => v.free() );
      }

      /**
       * add a camera to the scene
       * @param {Camera} camera 
       */
      addCamera( camera ){
            RenderingSystem._dispatch_( 'createCamera', this.#wid, camera.id, camera.get() );
            camera.onChange(() => 
                  RenderingSystem._dispatch_( 'moveCamera', this.#wid, camera.id, camera.get() )
            );
      }
}