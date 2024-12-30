import RenderingSystem from "../game/system/rendering.js";
import KeyMap from "../data-structure/key-map.js";
/**@import World from "./world.js"*/

export default class Game {

      /**
       * @type {Game}
       */
      static #game;

      static keyMap = new KeyMap();

      static start( root = document.body ){
            if( !this.#game ){
                  this.#game = new Game( root );
            }

            return this.#game;
      }

      /**
       * @type {World}
       */
      #currentScene = null;
      /**
       * @type {number}
       */
      #frameId;
      
      get isRunning(){
            return typeof this.#frameId == 'number';
      }

      /**
       * @hideconstructor
       * @private
       */
      constructor( root = document.body ){
            RenderingSystem.new( root );
            RenderingSystem.draw();
      }

      /**
       * change the scene by releasing the previous one
       * @param {World} scene 
       */
      changeScene( scene ){

            if( this.#currentScene ){
                  this.#currentScene.free();
                  Game.keyMap.clear();
            }

            this.#currentScene = scene;

            return this;
      }

      run(){
            if( !this.isRunning ){
                  const loop = () => {
                        if( this.#currentScene )
                              this.#currentScene.run();
                        this.#frameId = requestAnimationFrame( loop );
                  }
            }

            return this;
      }

      stop(){
            if( this.isRunning ){
                  cancelAnimationFrame( this.#frameId );
                  this.#frameId = undefined;
            }
            
            return this;
      }
}