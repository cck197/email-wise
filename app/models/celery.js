import { createClient } from "celery-node";

const brokerUrl = process.env.BROKER_URL;

export function getClient() {
  return createClient(brokerUrl, brokerUrl);
}

/*
//const client = createClient(brokerUrl);
const task = client.createTask("tasks.add");

(async () => {
  try {
    const result = await task.applyAsync([10, 20]);
    console.log(await result.get()); // Wait for result and print it
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.disconnect();
  }
})();
*/
