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
       * 
       * @returns {Mat4x4}
       */
      getMatrix(){

            const n = this.#near;
            const f = this.#far;
            const O = Math.tan( this.#fow / 2 );
            const a = this.#ratio;

            const r = a*n*O;
            const l = -r;

            const b = n*O;
            const t = -b;

            return [ 
                  2*n/(r-l), 0, (r+l)/(r-l), 0,
                  0, 2*n/(t-b), (t+b)/(t-b), 0,
                  0, 0, (f+n)/(n-f), 2*f*n/(n-f),
                  0,0,-a,0,
            ];
      }

}

