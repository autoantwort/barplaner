import mqtt from 'mqtt';

export function subscribeMqtt(topic) {
    console.log('Connecting to MQTT started');
    const client = mqtt.connect('wss://mqtt-ws.hilton.rwth-aachen.de');
    client.on('connect', () => {
        console.log(`Connected to MQTT`);
        client.subscribe(topic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to topic ${topic}:`, err);
            }
        });
    });

    client.on('error', (error) => {
        console.error('MQTT error:', error);
    });

    return client;
}