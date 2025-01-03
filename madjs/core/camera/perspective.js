import Camera from "./camera.js";

/**@import {Mat4x4, PerspectiveCameraDescriptor} from "../type.d.ts" */

export class PerspectiveCamera extends Camera {


      /**
       * @readonly
       * @type {number}
       */
      #ratio;

      /**
       * @readonly
       * @type {number}
       */
      #near;

      /**
       * @readonly
       * @type {number}
       */
      #far;

      /**
       * @readonly
       * @type {number}
       */
      #fow;


      /**
       * @param {PerspectiveCameraDescriptor} descriptor
       */
      constructor( descriptor ){
            super();
            
            // set the width, height of the game
            this.#ratio = descriptor.ratio; 

            this.#far = descriptor.far;
            this.#near = descriptor.near;
            this.#fow = descriptor.fow;
      }

      /**
       * [link to explanation](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html)
       * @returns {Mat4x4}
       */
      getMatrix(){
            const n = this.#near;
            const f = this.#far;
            const O = Math.tan( 1.5707963268 - this.#fow * 0.5 );
            const a = this.#ratio;

            const r = 1.0 / (this.#near - this.#far);

            return [
                  O / a, 0, 0, 0,
                  0, O, 0, 0,
                  0, 0, (n + f) * r, -1,
                  0, 0, n * f * r * 2, 0
            ];
      }

}

