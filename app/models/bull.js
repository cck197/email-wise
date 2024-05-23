import Queue from "bull";

const QUEUE_NAME = process.env.QUEUE_NAME;
const BROKER_URL = process.env.BROKER_URL;

export function getQueue() {
  return new Queue(QUEUE_NAME, BROKER_URL);
}
