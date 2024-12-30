import Component from "../../ecs/component.js";
/**@import Entity from "../../ecs/entity.js"*/

/**
 * you can access this component by calling
 * ```javascript
 * entity.get('position');
 * ```
 * @extends {Component}
 */
export default class Position extends Component {

      static get key(){ return 'position'; }

      /**
       * 
       * @type {Set<(point: Position, oldX: number, oldY: number, oldZ: number) => void>}
       */
      #onChange = new Set();

      /**
       * @readonly
       */
      #pos = new Float32Array(3);

      get x(){
            return this.#pos.at(0);
      }

      set x( val ){
            const oldX = this.x;

            this.#pos.set( [val], 0 );
            this.#onChange.forEach( f => f( this, oldX, this.y, this.z ) );
      }

      get y(){
            return this.#pos.at(1);
      }

      set y( val ){
            const oldY = this.y;

            this.#pos.set( [val], 1 );
            this.#onChange.forEach( f => f( this, this.x, oldY, this.z ) );
      }

      get z(){
            return this.#pos.at(2);
      }

      set z( val ){
            const oldZ = this.z;

            this.#pos.set( [val], 2 );
            this.#onChange.forEach( f => f( this, this.x, this.y, oldZ ) );
      }

      /**
       * @param {Entity} entity 
       * @param {number} x 
       * @param {number} y 
       * @param {number} z 
       */
      constructor( entity, x, y, z ){
            super( entity );
            this.#pos.set([x,y,z]);
      }

      /**
       * 
       * @param {(point: Position, oldX: number, oldY: number, oldZ: number) => void} callback 
       */
      onChange( callback ){
            this.#onChange.add( callback );
      }
}