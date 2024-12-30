/**@import Entity from "./entity" */

/**
 * @abstract
 */
export default class Component {
      /**
       * @abstract
       * @readonly
       * @type {string}
       */
      static get key(){
            throw new Error('a Component must implement the static key property')
      }

      /**
       * @readonly
       * @type {number}
       */
      #id;

      get id(){
            return this.#id;
      }

      /**
       * 
       * @param {Entity} entity
       */
      constructor( entity ){
            this.#id = entity.id;
            entity.add( this );
      }

      /**
       * @abstract 
       */
      free(){}
}