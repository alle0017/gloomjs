/**@import Component from "./component.js"*/

export default class Entity {

      static #id = 0;

      /**
       * @type {Set<()=>void>}
       */
      #beforeFree = new Set();

      /**
       * @type {number}
       * @readonly
       */
      id;

      /**
       * @type {Set<string>} 
       */
      class;

      /**
       * @type {Map<string,Component>}
       */
      components;


      /**
       * 
       * @param {string[]} classNames 
       */
      constructor( classNames = [] ){
            this.id = Entity.#id++;
            this.class = new Set( classNames );
            this.components = new Map();
      }

      /**
       * @param {Component} comp 
       */
      add( comp ){
            this.components.set( 
                  /**@type {typeof Component}*/(Object.getPrototypeOf( comp ).constructor).key, 
                  comp 
            );
      }
      /**
       * @template {Component} T
       * @param {string} prop 
       * @returns 
       */
      get( prop ){
            return /**@type {T}*/(this.components.get( prop ));
      }
      /**
       * 
       * @param {string} prop 
       * @returns {boolean}
       */
      has( prop ){
            return this.components.has( prop );
      }

      free(){
            this.#beforeFree.forEach( f => f() );
            this.components.forEach( v => v.free() );
            this.#beforeFree.clear();

            this.components = null;
            this.class = null;
            this.#beforeFree = null;
      }

      /**
       * event fired before the element is freed
       * @param {() => void} callback 
       */
      onBeforeFree( callback ){
            this.#beforeFree.add( callback );
      }
}