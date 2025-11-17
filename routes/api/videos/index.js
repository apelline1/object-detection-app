"use strict";

const moment = require("moment");
const _ = require("lodash");
const storage = require("../../../storage");
const axios = require("../../../utils/axios");
const { OBJECT_DETECTION_URL, KAFKA_TOPIC_IMAGES } = require("../../../utils/constants");
const videoStoragePrefix = "videos";

module.exports = async function (fastify, opts) {
  fastify.post("/", async function (request, reply) {
    try {
      const video = _.get(request, "body.video");
      if (!video) {
        reply.code(422);
        return {
          status: "error",
          statusCode: 422,
          message: "Missing Fields: video",
        };
      }

      // Extract base64 data (support webm, mp4, ogg)
      const base64data = video.replace(/^data:video\/(webm|mp4|ogg);base64,/, "");
      const buff = Buffer.from(base64data, "base64");

      let file;
      try {
        file = await writeVideo(buff, request);
        request.log.info(`Video stored: ${file}`);
      } catch (error) {
        request.log.error("error occurred writing video");
        request.log.error(error);
      }

      // For video processing, we might want to extract frames or process differently
      // For now, we'll send the first frame or a thumbnail for object detection
      // This is a simplified approach - you may want to extract frames server-side
      
      // Option 1: Return success (video stored, processing can happen async)
      reply.code(200);
      return {
        status: "success",
        statusCode: 200,
        message: "Video uploaded successfully",
        fileId: file,
      };

      // Option 2: If you want to process video frames immediately
      // You would need to extract frames from the video and send to object detection
      // This requires additional libraries like ffmpeg

    } catch (error) {
      request.log.error(error, "Unhandled error in /api/videos handler");
      
      reply.code(500);
      return {
        status: "error",
        statusCode: 500,
        message: "An internal server error occurred.",
      };
    }
  });

  // Endpoint to get video processing status or results
  fastify.get("/:videoId", async function (request, reply) {
    try {
      const { videoId } = request.params;
      // Implement video retrieval logic if needed
      reply.code(404);
      return {
        status: "error",
        statusCode: 404,
        message: "Video retrieval not yet implemented",
      };
    } catch (error) {
      request.log.error(error, "Error retrieving video");
      reply.code(500);
      return {
        status: "error",
        statusCode: 500,
        message: "An internal server error occurred.",
      };
    }
  });
};

async function writeVideo(data, request) {
  const videoId = generateFilename();
  try {
    const response = await storage.writeFile(data, videoId);
    return videoId;
  } catch (error) {
    request.log.error(`Failure to write ${videoId} to storage`);
    throw error;
  }
}

function generateFilename() {
  const date = moment().format("YYYYMMDD-HH:mm:ss:SSS");
  const random = Math.random().toString(36).slice(-5);
  return `${videoStoragePrefix}/${date}-${random}.webm`;
}

