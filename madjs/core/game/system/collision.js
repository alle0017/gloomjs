import Space from "../../data-structure/space-set.js";
import Collision from "../component/collision.js";
/**@import World from "../../ecs/world.js" */
/**@import System from "../../ecs/system.js" */

/**
 * Collision System. Is used to detect collisions 
 * between different material entities
 * @implements {System<Collision>}
 */
export default class CollisionSystem {

      #maxExtension = 0;

      /**
       * @type {Space<Collision>}
       */
      #space = new Space();


      /**
       * @param {Collision} collider
       */
      add( collider ){

            if( collider.extension > this.#maxExtension ){
                  this.#maxExtension = collider.extension;
            }

            this.#space.add( collider );
            collider.onChange( this.#space.update );
      }

      /**
       * 
       * @param {World} world 
       */
      update( world ){

            const checked = new Set();

            this.#space.forEachBlock( 
                  p => {
                        this
                        .#space
                        .queryRange( p, p.extension + this.#maxExtension )
                        .forEach( p2 =>{ 

                                    if( checked.has( p2 ) )
                                          return;

                                    if( !p.__checkEntityIntersection( p2 ) )
                                          return;

                                    const e1 = world.queryEntityById( p.id );
                                    const e2 = world.queryEntityById( p2.id );

                                    p.__triggerCollisions( e2 );
                                    p2.__triggerCollisions( e1 );
                              }
                        );

                        checked.add( p );
                  }
            );
      }
}