import Component from "../../ecs/component.js";
/**@import Position from "./position.js" */
/**@import {Point3D} from "../../../index.js" */
/**@import Entity from "../../ecs/entity.js" */

/**
 * @enum {number}
 */
export const CollisionShape = {
      Cube: 0,
      Sphere: 1,
};

/**
 * Collision component. Is used to detect collisions 
 * between different material entities\
 * you can access the component from the entity by calling
 * ```javascript
 * entity.get('collision');
 * ```
 * @implements {Component}
 */
export default class Collision extends Component {

      static get key(){ return 'collision'; }

      /**
       * 
       * @param {Collision} cube
       * @param {Collision} sphere
       */
      static #cubeSphere( cube, sphere ){

            const closestX = Math.max( cube.x - cube.#width, sphere.x > cube.x + cube.#width ? cube.x + cube.#width: sphere.x );
            const closestY = Math.max( cube.y - cube.#height, sphere.y > cube.y + cube.#height ? cube.y + cube.#height: sphere.y );
            const closestZ = Math.max( cube.z - cube.#depth, sphere.z > cube.z + cube.#depth ? cube.z + cube.#depth: sphere.z );

            // Calculate the squared distance from the sphere's center to the closest point
            const distanceSquared =
            (sphere.x - closestX) ** 2 +
            (sphere.y - closestY) ** 2 +
            (sphere.z - closestZ) ** 2;

            // Check if the distance is less than or equal to the sphere's radius squared
            return distanceSquared <= sphere.#width ** 2;
      }
      /**
       * 
       * @param {Collision} e1 - cube
       * @param {Collision} e2 - cube
       */
      static #cubeCube( e1, e2 ){
            const xOverlap = 
            e1.x - e1.#width < e2.x + e2.#width && 
            e1.x + e1.#width > e2.x - e2.#width;

            const yOverlap = 
            e1.y - e1.#height < e2.y + e2.#height && 
            e1.y + e1.#height > e2.y - e2.#height;

            const zOverlap = 
            e1.z - e1.#depth < e2.z + e2.#depth && 
            e1.z + e1.#depth > e2.z - e2.#depth;

            return xOverlap && yOverlap && zOverlap;
      }

      /**
       * 
       * @param {Collision} e1
       * @param {Collision} e2
       */
      static #sphereSphere( e1, e2 ){
            const distanceSquared =
            (e1.x - e2.x) ** 2 +
            (e1.y - e2.y) ** 2 +
            (e1.z - e2.z) ** 2;

            const radiusSum = e1.#width + e2.#width;

            return distanceSquared <= radiusSum ** 2;
      }

      /**
       * @readonly
       */
      #point;

      /**
       * @readonly
       * @type {CollisionShape}
       */
      #shape;

      /**
       * @readonly
       * @type {number}
       */
      #width;
      /**
       * @readonly
       * @type {number}
       */
      #height;
      /**
       * @readonly
       * @type {number}
       */
      #depth;

      /**
       * @type {Set<( e: Entity ) => void>}
       */
      #onCollision = new Set();

      get x(){
            return this.#point.x;
      }

      get y(){
            return this.#point.y;
      }

      get z(){
            return this.#point.z;
      }


      get width(){
            return this.#width;
      }

      get height(){
            return this.#height;
      }

      get depth(){
            return this.#depth;
      }

      /**
       * represent the max extension of the element in the space
       */
      get extension(){
            return Math.max( this.#depth, this.#height, this.#width );
      }

      /**
       * 
       * @param {Entity} entity 
       * @param {CollisionShape} shape 
       * @param {number} width 
       * @param {number} height 
       * @param {number} depth 
       */
      constructor( entity, shape, width, height, depth ){

            super( entity );

            if( !entity.has( 'position' ) )
                  throw new Error( 
                        'the entity ' + entity.id + ' must have a Position component to implement the collision' 
                  );

            this.#point = /**@type {Position}*/(entity.get('position'));
            this.#shape = shape;
            this.#width = width/2;
            this.#height = height/2;
            this.#depth = depth/2;
      }

      /**
       * 
       * @param {Collision} e2 
       * @returns {boolean}
       */
      __checkEntityIntersection( e2 ){

            switch( this.#shape ){
                  case CollisionShape.Cube: {
                        switch( e2.#shape ){
                              case CollisionShape.Cube: {
                                    return Collision.#cubeCube( this, e2 );
                              }
                              case CollisionShape.Sphere: {
                                    return Collision.#cubeSphere( this, e2 );
                              }
                        }
                  }break;
                  case CollisionShape.Sphere: {
                        switch( e2.#shape ){
                              case CollisionShape.Cube: {
                                    return Collision.#cubeSphere( e2, this );
                              }
                              case CollisionShape.Sphere: {
                                    return Collision.#sphereSphere( this, e2 );
                              }
                        }
                  }break;
            }
            return false;
      }

      /**
       * 
       * @param {Entity} other 
       */
      __triggerCollisions( other ){
            this.#onCollision.forEach( f => f( other ) );
      }

      /**
       * add an event listener that is triggered when a collision is detected
       * @param { ( e: Entity ) => void } callback 
       */
      onCollision( callback ){
            this.#onCollision.add( callback );
      }     


      /**
       * 
       * @param {(position: Point3D, oldX: number, oldY: number, oldZ: number ) => void} callback 
       */
      onChange( callback ){
            this.#point.onChange( callback );
      }
}