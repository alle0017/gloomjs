import RenderingSystem from "../system/rendering.js";
import Component from "../../ecs/component.js";
/**@import Entity from "../../ecs/entity.js";*/
/**@import {GPUBinding, GPUProgram} from "../../type" */
/**
 * @extends {Component}
 */
export default class Shader extends Component {
      /**
       * @type {Set<string>}
       */
      static #registered = new Set();
      static key = 'shader';

      /**
       * @param {string} shaderClass
       * @param {GPUProgram} program
       */
      static createShader( shaderClass, program ){

            if( this.#registered.has( shaderClass ) ){
                  throw new Error(`[wgpu] shader class ${shaderClass} is already registered`);
            }


            RenderingSystem.createShader( shaderClass, program ); //_dispatch_( 'createShader', shaderClass, program );
            this.#registered.add( shaderClass );
      }

      /**
       * @param {string} shaderClass
       * @param {Entity} entity 
       * @param {GPUBinding[][]} groups 
       */
      constructor( shaderClass, entity, groups ){
            super( entity );
            
            if( !Shader.#registered.has( shaderClass ) )
                  throw new ReferenceError( `[wgpu] shader class with class ${shaderClass} doesn't exists` );

            RenderingSystem.createEntity( entity.id + '', shaderClass, groups );
      }

      /**
       * update uniform of the specified [group,binding]
       * @param {number} group 
       * @param {number} binding 
       * @param {number[] | string} resource 
       */
      update( group, binding, resource ){
            RenderingSystem._dispatch_( 'update', this.id, group, binding, resource );
      }

      free(){
            RenderingSystem._dispatch_( 'freeEntity', this.id );
      }
}