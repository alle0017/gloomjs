
type EntityMsg = {
      id: string
}

type CreationShaderMsg = {
      program: import("../type").GPUCompilableProgram,
      id: string,
};

type CreationEntityMsg = {
      shaderId: string,
      id: string,
      groups: import("../type").GPUBinding[][],
};
 
type UpdateMsg = {
      binding: number, 
      group: number, 
      resource: import("../type").GPUBindingUniform,
} & EntityMsg;

type BufferMsg = { 
      bufferId: string, 
      size: number, 
      type: import("../enums").Type 
}

type WritableBufferMsg = {
      byteOffset: number, 
      values: ArrayBuffer
} & BufferMsg;

type CameraMsg = { 
      sceneId: number, 
      cameraId: number, 
      values: ArrayBuffer 
}
