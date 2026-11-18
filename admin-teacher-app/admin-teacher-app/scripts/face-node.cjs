// Node-side descriptor helper (pure WASM, no native TensorFlow build needed).
const path = require("path");
const sharp = require("sharp");
const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-backend-wasm");
const faceapi = require("@vladmandic/face-api/dist/face-api.node-wasm.js");

const MODEL_DIR = path.join(__dirname, "..", "public", "models");

async function init() {
  const wasmDir = path.join(__dirname, "..", "node_modules", "@tensorflow", "tfjs-backend-wasm", "dist") + path.sep;
  require("@tensorflow/tfjs-backend-wasm").setWasmPaths(wasmDir);
  await faceapi.tf.setBackend("wasm");
  await faceapi.tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_DIR);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_DIR);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_DIR);
}

async function descriptorFromBuffer(buf) {
  const { data, info } = await sharp(buf).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const tensor = faceapi.tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], "int32");
  try {
    const det = await faceapi
      .detectSingleFace(tensor, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    return det ? Array.from(det.descriptor) : null;
  } finally {
    tensor.dispose();
  }
}

module.exports = { init, descriptorFromBuffer };
