
import MasterThread from '../../../utils/thread.js';
import { ThreadRenderingMsg as Msg, TypeConstructor } from '../../enums.js';
/**@import {GPUBindingUniform, GPUProgram, VertexTransferable,GPUBinding} from "../../type.d.ts" */
/**@import {Type} from "../../enums.js" */

/**
 * wrapper that create a single point of access
 * to all the webgpu server API. other than wrapping the thread methods, it 
 * also enqueue methods call until the server is ready, non-blocking the
 * rendering
 * @singleton
 */
export default class RenderingSystem {

      static methods = {
            /**
             * @type {(...args: unknown[])=>void}
             */
            'draw': () =>  RenderingSystem.#thread.sendMessage( Msg.draw, {}),

            /**
             * @type {(...args: unknown[])=>void}
             */
            'stop': () => RenderingSystem.#thread.sendMessage( Msg.stop, {}),
            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} shaderId 
             * @param {GPUProgram} program 
             */
            'createShader': ( shaderId, program ) => {
                  const buffers = [];
                  const v = program.vertexDescriptor;
                  /**
                   * @type {VertexTransferable[]}
                   */
                  const vertex = [];

                  for( let i = 0; i < v.length; i++ ){
                        vertex.push({
                              ...v[i],
                              values: new TypeConstructor[ v[i].type ]( v[i].values ).buffer,
                        });
                        buffers.push( vertex[i].values );
                  }
                  RenderingSystem.#thread.sendMessage( Msg.createShader, {
                        id: shaderId,
                        program: {
                              ...program,
                              vertexDescriptor: vertex,
                        },
                  }, buffers);
            },
            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} id
             * @param {string} shaderId
             * @param {GPUBinding[][]} groups
             */
            'create': ( id, shaderId, groups )=> {
                  RenderingSystem.#thread.sendMessage( Msg.createEntity, {
                        id,
                        shaderId,
                        groups,
                  });
            },

            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} id
             */
            'addToScene': id => {
                  this.#thread.sendMessage( Msg.addToScene, {
                        id
                  });
            },
            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} id
             */
            'removeFromScene': id => RenderingSystem.#thread.sendMessage( Msg.removeFromScene, {id} ),
            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} id 
             * @param {number} group 
             * @param {number} binding 
             * @param {GPUBindingUniform} resource 
             */
            'update': ( id, group, binding, resource ) => {
                  RenderingSystem.#thread.sendMessage( Msg.updateEntity, {
                        id,
                        group,
                        binding,
                        resource,
                  });
            },
            /**
             * @type {(...args: unknown[])=>void}
             */
            'startGame': () => {},
            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} bufferId 
             * @param {Type | null} type
             * @param {number} size 
             */
            'createGlobalBuffer': ( bufferId, type, size ) => {
                  RenderingSystem.#thread.sendMessage( Msg.createGlobal, {
                        bufferId,
                        type,
                        size,
                  });
            },
            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} bufferId 
             * @param {number} byteOffset 
             * @param {Type} type
             * @param {number[]} values 
             */
            'writeGlobalBuffer': ( bufferId, byteOffset, type, values ) => {
                  const buffer =  new TypeConstructor[ type ]( values ).buffer;
            
                  this.#thread.sendMessage( Msg.writeGlobal, {
                        bufferId,
                        type,
                        byteOffset,
                        values: buffer,
                  }, [buffer] );
            },
            /**
             * @type {(...args: unknown[])=>void}
             * @param {number} sceneId 
             * @param {number} cameraId 
             * @param {number[]} values 
             */
            'createCamera': ( sceneId, cameraId, values ) => {
                  const buffer =  new Float32Array( values ).buffer;
            
                  RenderingSystem.#thread.sendMessage( Msg.createCamera, {
                        sceneId,
                        cameraId,
                        values: buffer,
                  }, [buffer] );
            }, 
            /**
             * @type {(...args: unknown[])=>void}
             * @param {number} sceneId 
             * @param {number} cameraId 
             * @param {number[]} values 
             */
            'moveCamera': ( sceneId, cameraId, values ) => {
                  const buffer =  new Float32Array( values ).buffer;
            
                  this.#thread.sendMessage( Msg.updateCamera, {
                        sceneId,
                        cameraId,
                        values: buffer,
                  }, [buffer] );
            },
            /**
             * @type {(...args: unknown[])=>void}
             * @param {string} id
             */
            'freeEntity': id => {
                  this.#thread.sendMessage( Msg.freeEntity, {
                        id
                  });
            },
      };

      /**
       * @type {boolean}
       */
      static #isReady = false;
      /**
       * @type {{ 
      *     method: keyof RenderingSystem.methods, 
      *     args: Array<unknown> 
      * }[]}
      */
      static #waitingQueue = [];
      /**
       * @type {MasterThread}
       */
      static #thread;
      /**
       * @type {HTMLCanvasElement}
       */
      static #cvs;


      /**
       * 
       * @param {HTMLElement} [root=document.body]
       */
      static new( root = document.body ){
            this.#cvs = document.createElement( 'canvas' );
            this.#cvs.width = parseFloat(root.style.width) || window.innerWidth;
            this.#cvs.height = parseFloat(root.style.height) || window.innerHeight;

            root.appendChild( this.#cvs );

            
            const offscreen = this.#cvs.transferControlToOffscreen();

            //@ts-ignore
            this.#thread = new MasterThread( import.meta.resolve('../../rendering/render-thread.js'), true );
            
            // waiting the thread to be ready
            this.#thread.waitFor( Msg.ready ).then( ()=>{
                  
                  this.#thread.sendMessage( Msg.canvasPassed, {
                        canvas: offscreen,
                  }, [offscreen] );
                  
                  // wait the thread to be ready (including canvas initialization)
                  this.#thread.waitFor( Msg.ready ).then( ()=>{
                        this.#isReady = true;

                        // calling all the methods enqueued
                        this.#waitingQueue.forEach( descriptor => {
                              this.methods[descriptor.method]( ...descriptor.args );
                        });

                        this.#waitingQueue = [];
                  });
            })
      }

      /**
       * 
       * @param {keyof RenderingSystem.methods} method 
       * @param  {...unknown} args 
       */
      static _dispatch_( method, ...args ){
            if( !this.#isReady ){

                  this.#waitingQueue.push({
                        method,
                        args,
                  });

                  return this;
            }

            this.methods[method](...args);
      }

      /**
       * @param {string} id
       * @param {string} shaderId
       * @param {GPUBinding[][]} groups
       */
      static createEntity( id, shaderId, groups ){
            this._dispatch_('create', id, shaderId, groups );
      }
      /**
       * @param {string} shaderId 
       * @param {GPUProgram} program 
       */
      static createShader( shaderId, program ){
            this._dispatch_( 'createShader', shaderId, program );
      }
      /**
       * @param {string} id 
       * @param {number} group 
       * @param {number} binding 
       * @param {GPUBindingUniform} resource 
       */
      static updateUniform( id, group, binding, resource ){
            this._dispatch_( 'update', id, group, binding, resource );
      }
      
      static draw(){
            this._dispatch_('draw');
      }

      static stop(){
            this._dispatch_('stop');
      }
}
