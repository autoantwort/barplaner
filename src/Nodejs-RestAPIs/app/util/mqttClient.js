import mqtt from 'mqtt';
import config from '../config/env';

// MQTT broker credentials
const options = {
    username: config.mqtt.username,
    password: config.mqtt.password,
};

const retain = { retain: true };

// Create a MQTT client
const client = mqtt.connect(config.mqtt.url, options);

// Handle errors
client.on('error', (error) => {
    console.error('MQTT error:', error);
});

// When connected
client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

export { client, retain };
