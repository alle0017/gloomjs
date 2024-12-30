import Entity from "../ecs/entity.js";
import Shader from "../game/component/shader.js";
import { Type } from "../enums.js";
import RenderingSystem from "../game/system/rendering.js";
/**@import Position from "../game/component/position.js";*/
/**@import {Mat4x4,} from "../type.js" */
/**@import {Point3D,} from "../../index.js" */


export default class Sprite extends Shader {
      static #key = 'internal::sprite';
      static #isInitialized = false;
      static #init(){

            Shader.createShader( Sprite.#key, {
                  code: /*wgsl*/`
                  struct VOut {
                        @builtin(position) position: vec4f,
                        @location(0) text_coords: vec2f,
                        @location(1) offset: vec2f,
                  }
                  
                  @group(0) @binding(0) var<uniform> matrix: mat4x4f;
                  @group(0) @binding(1) var<uniform> camera: mat4x4f;
                  @group(0) @binding(2) var samp: sampler;
                  @group(0) @binding(3) var texture: texture_2d<f32>;
                  
                  @vertex
                  fn vertex_main( @builtin(vertex_index) vertexIndex : u32 ) -> VOut {
                        var out: VOut;
                        var position = array<vec4f,4>(
                              vec4f( 0, 0, 0, 1 ),
                              vec4f( 1, 0, 0, 1 ),
                              vec4f( 0, 1, 0, 1 ),
                              vec4f( 1, 1, 0, 1 )
                        );          
                        var text_coords = array<vec2f,4>(
                              vec2f( 0, 1 ),
                              vec2f( 1, 1 ),
                              vec2f( 0, 0 ),
                              vec2f( 1, 0 ),
                        );          
                        var trans_mat = mat4x4f(matrix);
                        trans_mat[0][3] = 0;
                        trans_mat[1][3] = 0;
                        out.offset = vec2f( matrix[0][3], matrix[1][3] );
                        out.position = camera * trans_mat * position[vertexIndex];
                        out.text_coords = text_coords[vertexIndex];
            
                  
                        return out;
                  }

                  @fragment
                  fn fragment_main( in: VOut )-> @location(0) vec4f {
                        var color = textureSample( texture, samp, in.text_coords + in.offset );

                        if( color[3] <= 0.01 ){
                              discard;
                        }

                        return color;
                  }
                  `,
                  vertexDescriptor: [],
                  groups: [[
                        {
                              //@group(0) @binding(0)
                              usage: "vertex",
                              resource: 'buffer'
                        },
                        {
                              //@group(0) @binding(1)
                              usage: "vertex",
                              resource: 'buffer'
                        },
                        {
                              //@group(0) @binding(2)
                              usage: "fragment",
                              resource: 'sampler',
                        },
                        {
                              //@group(0) @binding(3)
                              usage: "fragment",
                              resource: 'texture',
                        }]],
                  indices: [ 
                        0, 1, 2, 
                        2, 1, 3,
                  ],
                  cullMode: 'none',
            });

            this.#isInitialized = true;
      }

      #translation = new Float32Array([0,0,0]);
      #scale = new Float32Array([1,1,1]);
      #imgOffset = new Float32Array([0,0]);

      /**
       * 
       * @param {Entity} entity 
       * @param {string} img
       * @param {number} width  
       * @param {number} height 
       */
      constructor( entity, img, width, height ){

            if( !Sprite.#isInitialized )
                  Sprite.#init();

            const mat = [ 
                  1, 0, 0, 0,
                  0, 1, 0, 0,
                  0, 0, 1, 0,
                  0, 0, 0, 1,
            ];

            let pos;

            if( entity.has('position') ){

                  pos = /**@type {Position}*/(entity.get('position'));

                  mat[0] = pos.x;
                  mat[5] = pos.y;
                  mat[10] = pos.z;
            }
            
            super( Sprite.#key, entity, [[
                  {
                        //@group(0) @binding(0)
                        usage: "vertex",
                        resource: {
                              size: 16,
                              type: Type.f32,
                              values: mat,
                        }
                  },
                  {
                        //@group(0) @binding(1)
                        usage: "vertex",
                        resource: {
                              size: 16,
                              type: Type.f32,
                              global: {
                                    isCamera: true,
                              }
                        }
                  },
                  {
                        //@group(0) @binding(2)
                        usage: "fragment",
                        resource: {
                              addressMode: {},
                        },
                  },
                  {
                        //@group(0) @binding(3)
                        usage: "fragment",
                        resource: {
                              img,
                              width,
                              height,
                              format: 'rgba8unorm',
                              dimension: '2d',
                        },
                  }
            ]] );

            if( pos ){
                  this.usePosition( pos );
            }

            RenderingSystem._dispatch_( 'addToScene', this.id + '' );
      }

      /**
       * return the model matrix, with translation, scale and rotation.
       * ## USAGE
       * override only if your model matrix is different from the current one. 
       * The actual model matrix returns translation, scale and rotation, 
       * represented as a 4 dimensional matrix that operates in 3D space.\
       * material on this topic can be found [here](https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html) (is developed in webgl).
       * 
       * @returns {Mat4x4}
       */
      #getModelMatrix(){

            const x = this.#scale.at(0);
            const y = this.#scale.at(1);
            const z = this.#scale.at(2);

            const u = this.#translation.at(0);
            const v = this.#translation.at(1);
            const w = this.#translation.at(2);

            const imgOffsetX = this.#imgOffset.at(0);
            const imgOffsetY = this.#imgOffset.at(1);


            
            return [
                  x,     0,   0,    imgOffsetX,  
                  0,     y,   0,    imgOffsetY,
                  0,     0,   z,    0,
                  u,     v,   w,    1,
            ];
      }

      /**
       * 
       * @param {Position} pos 
       */
      usePosition( pos ){
            this.#translation.set([pos.x, pos.y, pos.z], 0);
            pos.onChange( p => this.moveTo( p.x, p.y, p.z) );
      }

      /**
       * 
       * @param {number} x 
       * @param {number} y
       * @param {number} z
       */
      moveTo( x, y, z ){
            this.#translation.set( [x,y,z], 0 );
            RenderingSystem.updateUniform( this.id + '', 0, 0, this.#getModelMatrix() );
      }

      /**
       * 
       * @param {number} x 
       * @param {number} [y=x]
       * @param {number} [z=y]
       */
      scale( x, y = x, z = y ){
            this.#scale.set( [x,y,z], 0 );
            RenderingSystem.updateUniform( this.id + '', 0, 0, this.#getModelMatrix() );
      }
}