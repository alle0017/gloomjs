import { SlaveThread } from "../../utils/thread.js";
import GPUEngine from "./engine.js";
import { ThreadRenderingMsg as Msg, } from "../enums.js";



SlaveThread.onMessage( Msg.canvasPassed, async ev => {
      if( !('canvas' in ev) || !(ev.canvas instanceof OffscreenCanvas) )
            return;

      const engine = await GPUEngine.create( ev.canvas );

      SlaveThread.onMessage( Msg.createShader, /**@param {CreationShaderMsg} e*/e =>{
            engine.create( e.id, e.program );
      });
      
      SlaveThread.onMessage( Msg.createEntity, /**@param {CreationEntityMsg} e*/e =>{
            engine.createEntity( e.id, e.shaderId, e.groups );
      });
      SlaveThread.onMessage( Msg.freeEntity, /**@param {EntityMsg} e*/e => {
            engine.freeEntity( e.id );
      });
      SlaveThread.onMessage( Msg.addToScene, /**@param {EntityMsg} e*/e =>{
            engine.addToScene( e.id )
      });

      SlaveThread.onMessage( Msg.removeFromScene, /**@param {EntityMsg} e*/e =>{
            engine.removeFromScene( e.id );
      });

      SlaveThread.onMessage( Msg.updateEntity, 
            /**
            * @param {UpdateMsg} e
            */
            e =>{
                  engine.update(
                        e.id,
                        e.group,
                        e.binding,
                        e.resource,
                  );
            }
      );

      SlaveThread.onMessage( Msg.draw, () => {
            engine.draw();
      });

      SlaveThread.onMessage( Msg.stop, () => {
            engine.stop();
      });

      SlaveThread.onMessage( Msg.createGlobal, /**@param {BufferMsg} e*/ e => {
            engine.createGlobalBuffer( e.bufferId, e.type, e.size );
      });
      SlaveThread.onMessage( Msg.writeGlobal, /**@param {WritableBufferMsg} e*/ e => {
            engine.writeGlobalBuffer( e.bufferId, e.byteOffset, e.type, e.values );
      });

      SlaveThread.onMessage( Msg.createCamera, /**@param {CameraMsg} e*/e => {
            engine.createCamera( 
                  e.sceneId,
                  e.cameraId,
                  e.values
            );
      });
      SlaveThread.onMessage( Msg.updateCamera, /**@param {CameraMsg} e*/e => {
            engine.updateCamera( 
                  e.sceneId,
                  e.cameraId,
                  e.values
            );
      });


      SlaveThread.sendMessage( Msg.ready, {} );
});
SlaveThread.sendMessage( Msg.ready, {} );

