/**@import Component from "./component"*/
/**@import {Entity} from "./entity" */
/**@import World from "./world.js" */
/**
 * @template {Component} T
 * @interface
 */
export default class System {
      

      /**
       * method called during each update of the game
       * @abstract
       * @param {World} world
       */
      update( world ){
            throw new Error('update must be implemented in Systems')
      }
      /**
       * method to implement to add an entity to the system
       * @abstract
       * @param {T} component 
       */
      add( component ){
            throw new Error('add must be implemented in Systems')
      }
}
