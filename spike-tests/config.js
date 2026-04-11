export const spikeStages = [
  { duration: "30s", target: 20 }, // baseline
  { duration: "10s", target: 500 }, // spike
  { duration: "30s", target: 500 }, // sustain
  { duration: "10s", target: 20 }, // drop
  { duration: "30s", target: 20 }, // recovery
];

export const BASE_URL = "http://localhost:6060";
