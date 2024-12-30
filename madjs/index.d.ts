import Entity from "./core/ecs/entity"
import System from "./core/ecs/system"
import Component from "./core/ecs/component"
import Position from "./core/game/component/position"
import PositionSystem from "./core/game/system/position"
import CollisionSystem from "./core/game/system/collision"
import World from "./core/ecs/world"
import Game from "./core/ecs/game"
import Collision from "./core/game/component/collision"
import Shader from "./core/game/component/shader"
import { PerspectiveCamera } from "./core/camera/perspective"
import Camera from "./core/camera/camera"
import Sprite from "./core/shader/sprite"
import KeyMap from "./core/data-structure/key-map"
import Space from "./core/data-structure/space-set"

import type { GPUProgram, PerspectiveCameraDescriptor } from "./core/type"

export type * from "./core/type";

export type Point2D = {
      x: number,
      y: number
}

export type Point3D = {
      x: number,
      y: number,
      z: number,
}


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
 */
export function use2DPosition( entity: Entity, x: number, y: number ): Position;
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
 */
export function use3DPosition( entity: Entity, x: number, y: number, z: number ): Position;
export function useRectCollision( entity: Entity, width: number, height: number ): Collision;
export function useBoxCollision( entity: Entity, width: number, height: number, depth: number ): Collision;
export function useSphereCollision( entity: Entity, radius: number ): Collision;

/**
 * creates a new Entity that can be added to a world.
 */
export function useEntity( classNames?: string[] ): Entity;
/**
 * enables the use of position system
 */
export function usePositionSystem(): PositionSystem;
/**
 * enables the use of collision system
 */
export function useCollisionSystem(): CollisionSystem;
/**
 * create a new world. This is the basis for a scene
 */
export function useWorld(): World;
/**
 * return running game
 * ### usage
 * ```javascript
 * useWorld()
 *    .run()
 *    .changeScene( NextScene() );
 * ```
 */
export function useGame(root?: HTMLElement): Game;
/**
 * create a shader that can be used with `useShader`
 */
export function createShader(shaderClass: string, program: GPUProgram): void;
/**
 * create a new drawable entity
 */
export function useShader( entity: Entity, shaderId: string ): Shader;
/**
 * create a perspective camera. 
 * The camera is not directly added to the scene:\
 * first, you need to add it to the world with 
 * ```javascript 
 * world.addCamera( camera )`
 * ```
 * to follow an entity, you need to call 
 * ```javascript 
 * camera.follow( entity.get("position") )
 * ```
 */
export function usePerspectiveCamera(desc: PerspectiveCameraDescriptor): PerspectiveCamera;
/**
 * create a new sprite, If the entity has the position component, 
 * it is linked automatically, so that,
 * when the position changes, also the position on screen changes. 
 * Otherwise, call the method
 * ```javascript
 * sprite.usePosition( pos: Position )
 * ``` 
 */
export function useSprite(entity: Entity, img: string, width?: number, height?: number): Sprite;
/**
 * return a `KeyMap` that can be used to add events 
 * that are freed when the scene leave. If you need to
 * create global input events, use `KeyMap` global instance.\
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
export function useInput(): KeyMap;
export type { Entity, System, World, Game, Position, Shader, Collision, Camera, PerspectiveCamera, Sprite };
export { Component, KeyMap, Space };