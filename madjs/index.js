import Component from "./core/ecs/component.js";
import Entity from "./core/ecs/entity.js";
import World from "./core/ecs/world.js";
import Game from "./core/ecs/game.js";

import CollisionSystem from "./core/game/system/collision.js";
import PositionSystem from "./core/game/system/position.js";

import Position from "./core/game/component/position.js"
import Collision, { CollisionShape } from "./core/game/component/collision.js";
import Shader from "./core/game/component/shader.js";
import { PerspectiveCamera } from "./core/camera/perspective.js";
import Sprite from "./core/shader/sprite.js";

import KeyMap from "./core/data-structure/key-map.js";
import Space from "./core/data-structure/space-set.js";

/**@import {PerspectiveCameraDescriptor, GPUBinding} from "./core/type.js" */

/**
 * create 2d position component. Is a utility function. It can be used to detect collisions or 
 * simply to move an entity in the space. You can watch the change in the position
 * using the 
 * ```typescript
 * onChange( ( pos: Point3D, oldX: number, oldY: number, oldZ: number ) => void ): void
 * ```
 * method. To access the position component, simply use
 * ```js
 * entity.get('position').x
 * ```
 * @param {Entity} entity 
 * @param {number} x 
 * @param {number} y 
 */
export const use2DPosition = ( entity, x, y ) => {
      return new Position( entity, x, y, 0 );
}

/**
 * create 3d position component. It can be used to detect collisions or 
 * simply to move an entity in the space. You can watch the change in the position
 * using the 
 * ```typescript
 * onChange( ( pos: Point3D, oldX: number, oldY: number, oldZ: number ) => void ): void
 * ```
 * method. To access the position component, simply use
 * ```js
 * entity.get('position').x
 * ```
 * @param {Entity} entity 
 * @param {number} x 
 * @param {number} y 
 * @param {number} z
 */
export const use3DPosition = ( entity, x, y, z ) => {
      return new Position( entity, x, y, z );
}

/**
 * 
 * @param {Entity} entity 
 * @param {number} width
 * @param {number} height
 */
export const useRectCollision = ( entity, width, height ) => new Collision( entity, CollisionShape.Cube, width, height, 1 );
/**
 * 
 * @param {Entity} entity 
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 */
export const useBoxCollision = ( entity, width, height, depth ) => new Collision( entity, CollisionShape.Cube, width, height, depth );

/**
 * 
 * @param {Entity} entity 
 * @param {number} radius 
 * @returns 
 */
export const useSphereCollision = ( entity, radius ) => new Collision( entity, CollisionShape.Sphere, radius*2, radius*2, radius*2 );
 

export const usePositionSystem = () => new PositionSystem();
export const useCollisionSystem = () => new CollisionSystem();
export const useWorld = () => new World();
export const useGame = ( root = document.body ) => Game.start( root );


/**
 * 
 * @param {string[]} classNames 
 */
export const useEntity = ( classNames = [] ) => new Entity( classNames );
/**
 * create a perspective camera
 * @param {PerspectiveCameraDescriptor} desc 
 */
export const usePerspectiveCamera = desc => new PerspectiveCamera( desc );

export const createShader = Shader.createShader;
/**
 * @param {string} shaderId 
 * @param {Entity} entity 
 * @param {GPUBinding[][]} bindings
 */
export const useShader = ( entity, shaderId, bindings ) => new Shader( shaderId, entity, bindings );

/**
 * create a new sprite, If the entity has the position component, it is linked automatically, so that,
 * when the position changes, also the position on screen changes. Otherwise, call the usePosition method
 * @param {Entity} entity 
 * @param {string} img 
 * @returns 
 */
export const useSprite = ( entity, img, width = 32, height = 32 ) => new Sprite( entity, img, width, height );

export const useInput = () => Game.keyMap;

export { Component, KeyMap, Space };

