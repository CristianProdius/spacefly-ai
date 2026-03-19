import { consumer } from "./kafka.js";

export const runKafkaSubscriptions = async () => {
  consumer.subscribe([]);
};
