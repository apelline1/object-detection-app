const { KAFKA_TOPIC_IMAGES } = require("../../utils/constants");
const concatObject = require("../../utils/concat-object");
const storage = require("../../storage");
const moment = require("moment");

async function videoHandler(fastify, conn, messageObj) {
  fastify.log.debug("videoHandler %j", concatObject(messageObj));
  
  // Store video file if provided
  if (messageObj.video) {
    try {
      const videoId = await storeVideo(messageObj.video, fastify);
      fastify.log.debug(`Video stored with ID: ${videoId}`);
    } catch (error) {
      fastify.log.error(`Error storing video: ${error.message}`);
    }
  }

  // Send to Kafka (can reuse images topic or create separate one)
  await sendKafkaMsg(fastify, KAFKA_TOPIC_IMAGES, messageObj.userId, formatKafkaMsg(messageObj));
}

function formatKafkaMsg({ userId, video, date, time }) {
  return JSON.stringify({ userId, video, date, time, type: "video" });
}

async function storeVideo(videoData, fastify) {
  // Remove data URL prefix if present
  const base64data = videoData.replace(/^data:video\/(webm|mp4|ogg);base64,/, "");
  const buff = Buffer.from(base64data, "base64");
  
  const videoId = generateFilename();
  try {
    await storage.writeFile(buff, videoId);
    return videoId;
  } catch (error) {
    fastify.log.error(`Failure to write ${videoId} to storage`);
    throw error;
  }
}

function generateFilename() {
  const date = moment().format("YYYYMMDD-HH:mm:ss:SSS");
  const random = Math.random().toString(36).slice(-5);
  return `videos/${date}-${random}.webm`;
}

async function sendKafkaMsg(fastify, topic, key, value) {
  const shrunk = concatObject(JSON.parse(value));
  fastify.log.debug(`kafka produce topic: %s; key: %s; payload: %j`, topic, key, shrunk);
  try {
    let result = await fastify.kafka.producers.images.send({
      topic,
      messages: [{ key, value }],
    });
    fastify.log.debug("Pushed video message %j", shrunk);
  } catch (error) {
    fastify.log.error("kafka producer failed to send video message. Error: %s", error.message);
  }
}

module.exports = videoHandler;

