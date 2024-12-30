import Renderer from "./renderer.js";
import Drawer from "./drawer.js";
import { DEFAULT_CAMERA_BUFFER_ID, TypeConstructor, Type, } from "../enums.js";

/**
 * @import { 
 * GPUCompilableProgram, 
 * GPUExecutable, 
 * VertexBuffer, 
 * UniformDescriptor, 
 * GPUApp, 
 * VertexTransferable, 
 * GPUExecutableRefCounter, 
 * GPUShaderRef,
 GPUExecutableModel, 
 GPUBinding,
 GPUBindingUniform
 * } from "../type.d.ts";
 */

/**
 * @implements {GPUApp}
 */
export default class GPUEngine {

      /**
       * @type {GPUTextureFormat}
       */
      #format;

      /**
      * @type {GPUDevice}
      */
      #device;

      /**
       * @type {GPUCanvasContext}
       */
      #ctx;

      /**
       * @type {Renderer}
       */
      #renderer;

      /**
       * @type {Drawer}
       */
      #drawer;

      /**
       * @type {Map<string,GPUShaderRef>}
       */
      #idExecMap = new Map();
      /**
       * used as store to wait the compilation of a shader
       * @type {Map<string,Promise<GPUExecutableModel>>}
       */
      #execCreationPending = new Map();
      /**
       * used as store to wait the creation of an entity
       * @type {Map<string,Promise<GPUExecutable>>}
       */
      #entityCreationPending = new Map();

      /**
       * @type {Map<string,GPUExecutableRefCounter>}
       */
      #codeExecMap = new Map();

      /**
       * @type {boolean}     
       */
      #inExecution = false;

      /**
       * @type {Array<{ method: string, args: any[] }>}
       */
      #events = [];

      /**
       * @type {boolean} 
       */
      #isBusy = false;

      /**
       * settled to true if any message is sent from the main thread. 
       * If true, redraw all the system
       * @type {boolean}
       */
      #needRefresh = false;


      get ctx(){
            return this.#ctx;
      }

      get device(){
            return this.#device;
      }
       

      /**
       * return new instance of the GPUEngine class. It can be used to create and draw elements with the gpu.
       * ## USAGE
       * ```javascript
       * const engine = await GPUEngine.create( document.querySelector('#your-canvas') );
       * ```
       * @param {HTMLCanvasElement | OffscreenCanvas } cvs
       * @returns {Promise<GPUEngine>} 
       */
      static async create( cvs ){

            const engine = new GPUEngine( cvs );

            await engine.#instance();

            engine.#renderer = new Renderer( engine.#device, engine.#format );
            engine.#drawer = new Drawer( engine );

            return engine;
      }

      /**
       * @param {HTMLCanvasElement | OffscreenCanvas} cvs
       * @hideconstructor
       */
      constructor( cvs ){
            const ctx = cvs.getContext('webgpu');
            this.#ctx = ctx;
      }     

      /**
       * initialize the different components of the webgpu API\
       * return false if the method failed, true otherwise.\
       * this function setup also all the listeners to the possible errors.
       * @returns {Promise<boolean>} 
       */
      async #instance(){

            if( !navigator.gpu ){
                  console.error('webgpu not supported');
                  return false;
            }

            const adapter = await navigator.gpu.requestAdapter();

            const device = await adapter.requestDevice();

            if( !device ){
                  console.error('device not available');
                  return false;
            }

            this.#device = device;
            this.#format = navigator.gpu.getPreferredCanvasFormat();

            this.#ctx.configure({
                  device,
                  format: this.#format,
                  alphaMode: 'premultiplied',
            });

            return true;
      }
     /**
      * save a new shader class
      * @param {string} id 
      * @param {GPUCompilableProgram} program 
      * @returns 
      */
      async create( id, program ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'create',
                        args: [id,program],
                  });
                  return;
            }

            if( this.#idExecMap.has( id ) ){
                  throw new ReferenceError(`[wgpu] shader-id ${id} is already in use`);
            }

            const promise = this.#renderer.createProgram( program );

            this.#execCreationPending.set( id, promise );

            const executable = await promise;

            this.#codeExecMap.set( id, {
                  executable,
                  count: 1,
            });

            this.#execCreationPending.delete( id );
      }

      /**
       * 
       * @param {string} id 
       * @param {string} shaderId 
       * @param {GPUBinding[][]} groups 
       */
      async createEntity( id, shaderId, groups ){

            if( this.#isBusy ){
                  
                  this.#events.push({
                        method: 'create',
                        args: [ id, shaderId ],
                  });

                  return;
            }

            const shader = this.#codeExecMap.get( shaderId );

            // create a promise that group all the promise into the function
            // this simplify the waiting phase in other functions
            const promise = new Promise( async resolve => {
                  if( !shader ){
                        const promise = this.#execCreationPending.get( shaderId )
                        // check if the compilation process isn't ended
                        if( promise ){
                              await promise;
                        }else{
                              // shader doesn't exists
                              throw new ReferenceError(`[wgpu] shader-id with id ${shaderId} doesn't exists`);
                        }
                  }
      
                  const executable = await this.#renderer.cloneProgram( groups, shader.executable );
      
      
                  this.#idExecMap.set( id, {
                        executable,
                        shaderId,
                  });
      
                  this.#needRefresh = true;


                  this.#entityCreationPending.delete( id );

                  
                  resolve( executable )

            });

            this.#entityCreationPending.set( id, promise );
      }

      /**
       * 
       * @param {string} id 
       */
      async freeEntity( id ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'freeEntity',
                        args: [id],
                  });
                  return;
            }

            if( !this.#idExecMap.has( id ) ){
                  const promise = this.#entityCreationPending.get( id );

                  if( promise ){
                        await promise;
                  }else
                        throw new ReferenceError(`[wgpu] no entity with id ${id}`);
            }

            this.removeFromScene( id );

            const idRef = this.#idExecMap.get( id );
            const ref = this.#codeExecMap.get( idRef.shaderId );

            ref.count--;

            this.#drawer.remove( idRef.executable );
            this.#idExecMap.delete( id );

            idRef.executable.uniformBuffer.destroy();

            for( let i = 0; i < idRef.executable.uniforms.length; i++ ){
                  const group = idRef.executable.uniforms[i];

                  for( let j = 0; j < group.length; j++ ){
                        if( group[j].texture ){
                              group[j].texture.destroy();
                        }
                  }
            }

            this.#needRefresh = true;
      }

      /**
       * start a loop that draws on the canvas the elements
       * 
       * ## USAGE
       * ```javascript
       * engine.draw();
       * ```
       */
      draw(){

            if( this.#inExecution )
                  return;
            const draw = async ()=>{
                  this.#isBusy = true;

                  if( this.#needRefresh ){
                        this.#drawer.draw();
                        this.#needRefresh = false;
                  };

                  if( !this.#inExecution )
                        return;

                  this.#isBusy = false;

                  for( let i = 0; i < this.#events.length; i++ ){
                        await this[ this.#events[i].method ]( ...this.#events[i].args );
                  }

                  requestAnimationFrame(draw);
            };

            this.#inExecution = true;
            draw()
      }

      /**
       * stop execution started with loop.
       * ## USAGE
       * ```javascript
       * engine.stop();
       * ```
       */
      stop(){
            this.#inExecution = false;
      }

      /**
       * add to the scene (draw on screen) an element with the given id.
       * the id is the id associated with the element from the GPUEngine.create function.
       * ## USAGE
       * ```javascript
       * engine.create( 'my-id', {...} ); //instantiate new entity
       * 
       * engine.addToScene('my-id'); //from now on, it is drawn on screen
       * ```
       * 
       * ## FAILURE
       * the method may fail if the given id doesn't exists.
       * @param {string} id 
       */
      async addToScene( id ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'addToScene',
                        args: [id],
                  });
                  return;
            }            

            if( !this.#idExecMap.has( id ) ){
                  const promise = this.#entityCreationPending.get( id );

                  if( promise ){
                        await promise;
                  }else{
                        throw new ReferenceError(`[wgpu] no entity with id ${id}`);
                  }
            }

            this.#drawer.add( this.#idExecMap.get( id ).executable );
            this.#needRefresh = true;
      }

      /**
       * 
       * @param {string} id 
       */
      async removeFromScene( id ){
            if( this.#isBusy ){
                  this.#events.push({
                        method: 'removeFromScene',
                        args: [id],
                  });
                  return;
            }

            if( !this.#idExecMap.has( id ) ){
                  const promise = this.#entityCreationPending.get( id );

                  if( promise ){
                        await promise;
                  }else
                        throw new ReferenceError(`[wgpu] no entity with id ${id}`);
            }
            
            this.#drawer.remove( this.#idExecMap.get( id ).executable );
            this.#needRefresh = true;
      }

      /**
       * 
       * @param {string} id 
       * @param {number} binding 
       * @param {number} group
       * @param {GPUBindingUniform} resource 
       */
      async update( id, group, binding, resource ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'update',
                        args: [id, group, binding, resource],
                  });
                  return;
            }

            if( !this.#idExecMap.has( id ) ){
                  const promise = this.#entityCreationPending.get( id );

                  if( promise ){
                        await promise;
                  }else
                        throw new ReferenceError(`[wgpu] no entity with id ${id}`);
            }

            const updated = this.#idExecMap.get( id ).executable;
            //updated.z = z;
            //this.#drawer.sort();

            await updated.updateBinding( group, binding, resource );
            this.#needRefresh = true;
      }

      /**
       * 
       * @param {string} bufferId 
       * @param {Type | null} type
       * @param {number} size 
       */
      async createGlobalBuffer( bufferId, type, size ){
            if( this.#isBusy ){
                  this.#events.push({
                        method: 'createGlobalBuffer',
                        args: [bufferId, type, size],
                  });
                  return;
            }

            await this.#renderer.createGlobalBuffer(
                  bufferId,
                  type,
                  size
            );
      }
      
      /**
       * 
       * @param {string} bufferId 
       * @param {number} byteOffset 
       * @param {Type} type
       * @param {ArrayBuffer} values 
       * @param {boolean} priority 
       */
      async writeGlobalBuffer( bufferId, byteOffset, type, values, priority = false ){

            if( !priority && this.#isBusy ){
                  this.#events.push({
                        method: 'writeGlobalBuffer',
                        args: [ bufferId, byteOffset, type, values ],
                  });
                  return;
            }

            await this.#renderer.writeGlobalBuffer( 
                  bufferId, 
                  byteOffset, 
                  type, 
                  values 
            );
            this.#needRefresh = true;
      }

      /**
       * @param {ArrayBuffer} values
       * @param {number} sceneId 
       * @param {number} cameraId 
       */
      async createCamera( sceneId, cameraId, values ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'createCamera',
                        args: [  sceneId, cameraId, values  ],
                  });
                  return;
            }

            if( !this.#renderer.hasDefaultCamera() ){
                  await this.#renderer.createGlobalBuffer( DEFAULT_CAMERA_BUFFER_ID, Type.f32, 16 );
                  await this.#renderer.writeGlobalBuffer( DEFAULT_CAMERA_BUFFER_ID, 0, Type.f32, values );
            }

            this.#drawer.addCamera( values, sceneId, cameraId );
      }

      /**
       * @param {ArrayBuffer} values
       * @param {number} sceneId 
       * @param {number} cameraId 
       */
      updateCamera( sceneId, cameraId, values ){

            if( this.#isBusy ){
                  this.#events.push({
                        method: 'updateCamera',
                        args: [  sceneId, cameraId, values  ],
                  });
                  return;
            }

            this.#drawer.updateCamera( values, sceneId, cameraId );
            this.#needRefresh = true;
      }
}