import Position from "../component/position.js";
/**@import System from "../../ecs/system.js" */

/**
 * Position system. used to hold position component
 * @implements {System<Position>}
 */
export default class PositionSystem {

      /**
       * @type {Map<number,Position>}
       */
      #map = new Map();


      /**
       * @param {Position} pos
       */
      add( pos ){
            this.#map.set( pos.id, pos );
      }

      update(){}
}