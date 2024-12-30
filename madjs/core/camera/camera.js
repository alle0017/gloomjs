/**@import { Mat4x4, CameraMovement } from "../type.d.ts" */
/**@import Entity from "../ecs/entity.js" */
/**@import Position from "../game/component/position.js" */


/**
 * @abstract
 */
export default class Camera {

      static #cameraId = 0;

      /**
       * @readonly
       * @type {number}
       */
      #id;

      #position = new Float32Array([0,0,0]);

      /**
       * @type {Set<()=>void>}
       */
      #onChange = new Set();

      /**
       * roll or rotation around x axis
       * @default 0
       * @type {number}
       */
      #alpha = 0;

      /**
       * pitch or rotation around y axis
       * @default 0
       * @type {number}
       */
      #beta = 0;

      /**
       * yaw or rotation around z axis
       * @default 0
       * @type {number}
       */
      #gamma = 0;

      /**
       * @type {number}
       * @readonly
       * @abstract
       */
      #width;

      /**
       * @type {number}
       * @readonly
       * @abstract
       */
      #height;

      /**
       * @type {number}
       * @readonly
       * @abstract
       */
      #far;

      get x(){
            return this.#position.at(0);
      }
      set x( value ){
            if( this.#position.at(0) === value )
                  return;
            this.#position.set( [value], 0 );
      }

      get y(){
            return this.#position.at(1);
      }
      set y( value ){
            if( this.#position.at(1) === value )
                  return;
            this.#position.set( [value], 1 );
      }

      get z(){
            return this.#position.at( 2 );
      }
      set z( value ){
            if( this.#position.at( 2 ) === value )
                  return;
            this.#position.set( [value], 2 );
      }

      get yaw(){
            return this.#gamma;
      }
      set yaw( value ){
            if( value == this.#gamma )
                  return;

            this.#gamma = value;
      }

      get pitch(){
            return this.#beta;
      }
      set pitch( value ){
            if( value == this.#beta )
                  return;
            this.#beta = value;
      }

      get roll(){
            return this.#alpha;
      }
      set roll( value ){
            if( value == this.#alpha )
                  return;

            this.#alpha = value;
      }

      get id(){
            return this.#id;
      }

      get depth(){
            return this.#far;
      }

      get width() {
            return this.#width;
      }

      get height(){
            return this.#height;
      }

      constructor(){
            this.#id = Camera.#cameraId++;
      }

      /**
       * @param {Mat4x4} a
       * @param {Mat4x4} b
       * @returns {Mat4x4}
       */
      multiply( a, b ){
            const matrix = [];

            if( a.length !== 16 && b.length !== 16 )
                  throw new Error('Invalid matrix size');

            for( let i = 0; i < 4; i++ ){
                  for( let j = 0; j  < 4; j++ ){
                        let res = 0;
                        for( let k = 0; k < 4; k++ ){
                              res += a[ i*4 + k ] * b[ k*4 + j ];
                        }
                        matrix.push( res );
                  }
            }
            //@ts-ignore
            return matrix;
      }

      get(){
            return this.multiply( 
                  this.getViewMatrix(),
                  this.getMatrix(),
            )
      }

      /**
       * @abstract 
       * @return {Mat4x4}
       */
      getMatrix(){
            return [
                  1, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1,
            ];
      }

      /**
       * @returns {Mat4x4} 
       */
      getViewMatrix(){

            const a = Math.cos( this.#alpha );
            const b = -Math.sin( this.#alpha );

            const c = Math.cos( this.#beta );
            const d = -Math.sin( this.#beta );

            const e = Math.cos( this.#gamma );
            const f = -Math.sin( this.#gamma );

            const x = this.#position.at(0);
            const y = this.#position.at(1);
            const z = this.#position.at(2);


            return [

                  c*e,	                              c*f,                               -d,                      0,
                  -a*f+b*d*e,                         b*d*f+a*e,                         b*c,                     0,
                  b*f+a*d*e,                          a*d*f-b*e,                         a*c,                     0,
                  -a*f*y+b*f*z+c*x*e+b*d*y*e+a*d*z*e, c*f*x+b*d*f*y+a*d*f*z+a*y*e-b*z*e, -d*x+b*c*y+a*c*z,        1,
            ];
      }

      /**
       * 
       * @param {Partial<CameraMovement>} movement 
       */
      move( movement ){
            movement.x && this.#position.set( [movement.x], 0 );
            movement.y && this.#position.set( [movement.y], 1 );
            movement.z && this.#position.set( [movement.z], 2 );

            this.#alpha = movement.roll || this.#alpha;
            this.#beta = movement.pitch || this.#beta;
            this.#gamma = movement.yaw || this.#gamma;

            this.#onChange.forEach( f => f() );

            return this;
      }

      /**
       * @param {Position} entity 
       */
      follow( entity ){
            entity.onChange( ( point ) => this.move( point ) );
      }

      /**
       * @param {() => void} callback 
       */
      onChange( callback ){
            this.#onChange.add( callback );
            return this;
      }
}