/**@import {Point3D} from "../.."*/

/**
 * @typedef {Set<Point3D>} bucket
 */

/**
 * represent a 3-dimensional space data structure, thought to hold points and 
 * quey them efficiently.
 * @template {Point3D} T
 */
export default class Space {
      /**
       * @readonly
       */
      static #BLOCK_SIZE = 5;

      /**
       * 
       * @param {number} coord 
       */
      #GET_BLOCKS = coord => Math.trunc( (coord + Math.sign(coord) * Space.#BLOCK_SIZE/2) / Space.#BLOCK_SIZE )

      /**
       * 
       * @param {number} x 
       * @param {number} y
       * @param {number} z 
       * @returns {number}
       */
      #HASH_FROM_BLOCKS( x, y, z ){
            return x + this.#xceils * y + this.#xceils * this.#yceils * z;
      }

      /**
       * 
       * @param {number} x 
       * @param {number} y
       * @param {number} z 
       * @returns {number}
       */
      #HASH( x, y, z ){

            const ix = this.#GET_BLOCKS( x );
            const iy = this.#GET_BLOCKS( y );
            const iz = this.#GET_BLOCKS( z );

            return this.#HASH_FROM_BLOCKS( ix, iy, iz );
      }

      

      /**
       * @type {Map<number,Set<T>>}
       * @readonly
       */
      #map = new Map();

      /**
       * @readonly
       */
      #xceils;
      /**
       * @readonly
       */
      #yceils;

      constructor( numOfCeilsX = 1000, numOfCeilsY = 1000 ){
            this.#xceils = numOfCeilsX;
            this.#yceils = numOfCeilsY;
      }

      /**
       * add a point into the space
       * @param {T} point 
       */
      add( point ){
            const idx = this.#HASH( point.x, point.y, point.z  );

            this.#map.has( idx ) ? 
                  this.#map.get(idx).add( point ): 
                  this.#map.set( idx, new Set([point]) );
            return this;
      }

      /**
       * update the position of a point in the space
       * @param {T} point 
       * @param {number} oldX 
       * @param {number} oldY
       * @param {number} oldZ 
       */
      update( point, oldX, oldY, oldZ, ){
            const idx = this.#HASH( oldX, oldY, oldZ );
            const newIdx = this.#HASH( point.x, point.y, point.z );

            if( idx == newIdx )
                  return this;

            this.#map.get(idx).delete( point );

            this.#map.has( newIdx ) ? 
                  this.#map.get( newIdx ).add( point ): 
                  this.#map.set( newIdx, new Set([point]) );

            return this;
      }

      /**
       * remove a point from the space
       * @param {T} point 
       */
      remove( point ){
            const idx = this.#HASH( point.x, point.y, point.z );

            this.#map.get(idx).delete( point );

            return this;
      }

      clear(){
            this.#map.clear();     
      }

      /**
       * return the points in the same block of the center.
       * can be useful for basic  queries like tile-map
       * @param {Point3D} center 
       */
      queryNearest( center ){
            const idx = this.#HASH( center.x, center.y, center.z );

            return this.#map.get( idx );
      }

      /**
       * query only the shell of a cube in the space.
       * You can imagine that the space is organized in a 3-d tile map, 
       * this query only the external cube in range.
       * @param {Point3D} center
       * @param {number} range  
       */
      queryExternalCube( center, range ){
            const blocks = range * 2 + 1;
            const offset = Math.trunc( blocks/2 );
            /**
             * @type {Set<T>}
             */
            const res = new Set();
            const visited = new Set();

            const x = this.#GET_BLOCKS( center.x );
            const y = this.#GET_BLOCKS( center.y );
            const z = this.#GET_BLOCKS( center.z );

            for( let i = 0; i < blocks; i++ ){

                  for( let j = 0; j < blocks; j++ ){

                        const xp = this.#HASH_FROM_BLOCKS( x + range, y + i - offset, z + j - offset );
                        const xn = this.#HASH_FROM_BLOCKS( x - range, y + i - offset, z + j - offset );

                        const yp = this.#HASH_FROM_BLOCKS( x + i - offset, y + range, z + j - offset );
                        const yn = this.#HASH_FROM_BLOCKS( x + i - offset, y - range, z + j - offset );
                        
                        const zp = this.#HASH_FROM_BLOCKS( x + i - offset, y + j - offset, z + range );
                        const zn = this.#HASH_FROM_BLOCKS( x + i - offset, y + j - offset, z - range );

                        if( this.#map.has( xp ) && !visited.has( xp ) ){
                              this.#map.get( xp ).forEach( p => {
                                    res.add( p )
                              });

                              visited.add( xp );
                        }
                        
                        if( this.#map.has( xn ) && !visited.has( xn ) ){
                              this.#map.get( xn ).forEach( p => {
                                    res.add( p )
                              });

                              visited.add( xn );
                        }

                        if( this.#map.has( yp ) && !visited.has( yp ) ){
                              this.#map.get( yp ).forEach( p => {
                                    res.add( p )
                              });

                              visited.add( yp );
                        }
                        
                        if( this.#map.has( yn ) && !visited.has( yn )  ){

                              this.#map.get( yn ).forEach( p => {
                                    res.add( p )
                              });

                              visited.add( yn );
                        }

                        if( this.#map.has( zp ) && !visited.has( zp ) ){

                              this.#map.get( zp ).forEach( p => {
                                    res.add( p )
                              });

                              visited.add( zp );
                        }
                        
                        if( this.#map.has( zn ) && !visited.has( zn ) ){
                              this.#map.get( zn ).forEach( p => {
                                    res.add( p )
                              });

                              visited.add( zn );
                        }
                  }
            }

            return [...res.values()];
      }

      /**
       * query all the points contained in the sphere with center "center" and radius "range"
       * @param {Point3D} center 
       * @param {number} range
       */
      queryRange( center, range ){
            const size = this.#GET_BLOCKS( range );
            /**
             * @type {T[]}
             */
            let res = [];

            for( let i = 0; i < size; i++ ){
                  res = res.concat( this.queryExternalCube( center, i ) );
            }

            return res.concat(
                  this
                  .queryExternalCube( center, size )
                  .filter( p => 
                        ( ( p.x >= center.x && p.x < center.x + range ) || ( p.x < center.x && p.x > center.x - range ) ) &&
                        ( ( p.y >= center.y && p.y < center.y + range ) || ( p.y < center.y && p.y > center.y - range ) ) &&
                        ( ( p.z >= center.z && p.z < center.z + range ) || ( p.z < center.z && p.z > center.z - range ) )
                  )
            );
      }

      /**
       * loops over each point in a single block
       * @param {(point: T) => void} callback 
       */
      forEachBlock( callback ){
            this.#map.forEach( block => block.forEach(callback) );
      }
} 