import { Type, DEFAULT_CAMERA_BUFFER_ID } from '../enums.js';
/**
 * @import {GPUExecutable, Color, } from '../type.d.ts';
 */
/**
 * @import GPUEngine from './engine.js';
 */

export default class Drawer {


      /**
       * @readonly
       * @type {GPUEngine}
       */
      #engine;

      /**
       * @type {Map<number,Map<number,ArrayBuffer>>} map
       */
      #cameras = new Map();
      
      /**
       * @type {Map<GPURenderPipeline, Set<GPUExecutable>>}
       */
      #entities = new Map();

      /**
       * @readonly
       * @type {GPUDevice}
       */
      #device;

      /**
       * @readonly
       * @type {GPUCanvasContext}
       */
      #ctx;

      /**
       * @type {[number, number, number,number]}
       */
      #clearColor = [0,0,0,1];

      /**
       * @type {GPUTexture}
       */
      #depthTexture;

      /**
       * @type {GPUTexture}
       */
      #cvsTexture;

      /**
       * @default 0
       * @type {number}
       */
      #sceneId = 0;


      get clearColor() {
            return {
                  r: this.#clearColor[0],
                  g: this.#clearColor[1],
                  b: this.#clearColor[2],
                  a: this.#clearColor[3],
            };
      }

      set clearColor( value ) {
            this.#clearColor = [
                  value.r,
                  value.g,
                  value.b,
                  value.a
            ];
      }

      get depthTexture() {
            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            if( !this.#depthTexture ||this.#cvsTexture.width !== this.#depthTexture.width || this.#cvsTexture.height !== this.#depthTexture.height ){

                  if( this.#depthTexture )
                        this.#depthTexture.destroy();

                  this.#depthTexture = this.#device.createTexture({
                        size: [this.#cvsTexture.width, this.#cvsTexture.height],
                        format: 'depth24plus',
                        usage: GPUTextureUsage.RENDER_ATTACHMENT,
                  });
            }

            this.#device.popErrorScope().then( error => {
                  error && console.error( error );
            });
            return this.#depthTexture;
      }
      set depthTexture( value ) {}


      /**
       * @param {GPUEngine} engine 
       */
      constructor( engine ){
            this.#engine = engine;
            this.#ctx = engine.ctx;
            this.#device = engine.device;
      }

      #createCommandEncoder(){
            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            this.#cvsTexture = this.#ctx.getCurrentTexture();
            /**
             * @type {GPURenderPassDescriptor}
             */
            const renderPassDescriptor = {
                  label: 'main render pass descriptor',
                  colorAttachments: [
                        {
                              clearValue: this.#clearColor,
                              loadOp: "clear",
                              storeOp: "store",
                              view: this.#cvsTexture.createView(),
                        },
                  ], 
                  depthStencilAttachment: {
                        view: this.depthTexture.createView(),
                        depthClearValue: 1.0,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store',
                  },
            };
            const commandEncoder = this.#device.createCommandEncoder({
                  label: 'command encoder',
            });

            const pass = commandEncoder.beginRenderPass( renderPassDescriptor );

            this.#device.popErrorScope().then( error => {
                  error && console.error( error.message );
            });

            return { pass, commandEncoder };
      }

      /**
       * 
       * @param {GPURenderPassEncoder} pass 
       */
      #draw( pass ){

            this.#entities.forEach( (v,k) => {
                  this.#device.pushErrorScope('out-of-memory');
                  this.#device.pushErrorScope('validation');
                  this.#device.pushErrorScope('internal');



                  pass.setPipeline( k );

                  v.forEach( e => {
                        if( e.vertexBuffer )
                              pass.setVertexBuffer( 0, e.vertexBuffer );
      
                        if( e.bindGroups ){
                              for( let j = 0; j < e.bindGroups.length; j++ ){
                                    pass.setBindGroup( j, e.bindGroups[j] );
                              }
                        }
                        pass.setIndexBuffer( e.indexBuffer, e.indexType );
      
                        pass.drawIndexed( e.vertexCount );
                  });

                  this.#device.popErrorScope().then( error => {
                        error && console.error( error.message );
                  });
            });
      }


      /**
       * 
       * @param {GPUCommandEncoder} commandEncoder 
       * @param {GPURenderPassEncoder} pass 
       */
      #submitPipeline( commandEncoder, pass ){
            
            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');

            pass.end();

            this.#device.queue.submit([commandEncoder.finish()]);

            this.#device.popErrorScope().then( error => {
                  error && console.error( error.message );
            });
      }

      /**
       * 
       * @param {GPUExecutable} entity 
       */
      add( entity ){
            let set = this.#entities.get( entity.pipeline );

            if( !set ){
                  set = new Set();
                  this.#entities.set( entity.pipeline, set )
            }

            set.add( entity );
      }

      /**
       * 
       * @param {GPUExecutable} entity 
       */
      remove( entity ){
            this.#entities.get( entity.pipeline )?.delete( entity );
      }

      /**
       * 
       * @param {number} sceneId 
       */
      setCurrentScene( sceneId ){
            this.#sceneId = sceneId;
      }

      draw(){
            this.#device.pushErrorScope('out-of-memory');
            this.#device.pushErrorScope('validation');
            this.#device.pushErrorScope('internal');
            
            const { commandEncoder, pass } = this.#createCommandEncoder();
            const activeCameras = this.#cameras.get( this.#sceneId );

            if( !activeCameras || activeCameras.size <= 0 ){
                  this.#draw( pass );
            }else{
                  activeCameras.forEach( v => {

                        this.#engine.writeGlobalBuffer(
                              DEFAULT_CAMERA_BUFFER_ID,
                              0,
                              Type.f32,
                              v,
                              true,
                        );

                        this.#draw( pass );
                  })
            }

            this.#submitPipeline( commandEncoder, pass );
            
            this.#device.popErrorScope().then( error => {
                  error && console.error( error.message );
            });
      }

      /**
       * 
       * @param {ArrayBuffer} buffer 
       * @param {number} sceneId 
       * @param {number} cameraId 
       */
      addCamera( buffer, sceneId, cameraId ) {
            let cameras = this.#cameras.get( sceneId );

            if( !cameras ){
                  cameras = new Map();
                  this.#cameras.set( sceneId, cameras );
            }

            cameras.set( cameraId, buffer );
      }

      /**
       * 
       * @param {ArrayBuffer} buffer 
       * @param {number} sceneId 
       * @param {number} cameraId 
       */
      updateCamera( buffer, sceneId, cameraId ) {
            
            if( !this.#cameras.has( sceneId ) ){
                  throw new Error(`[wgpu] scene ${sceneId} does not exist`);
            }

            const scene = this.#cameras.get( sceneId );

            scene.set( cameraId, buffer );
      }
}