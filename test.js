
const WebSocket = require('ws');
const { RealtimeSession } = require('speechmatics');

const API_KEY = 'HeSsji9rY7ytrv8H2iMuO5LXDp59J2xS';
const WS_PORT = 8888; // WebSocket server port

// Speechmatics session setup
const session = new RealtimeSession({ apiKey: API_KEY });

session.addListener('Error', (error) => {
  console.log('session error', error);
});

session.addListener('AddTranscript', (message) => {
  process.stdout.write(message.metadata.transcript);
});

session.addListener('EndOfTranscript', () => {
  process.stdout.write('\n');
});

session
  .start({
    transcription_config: {
      language: 'en',
      operating_point: 'enhanced',
      enable_partials: true,
      max_delay: 2,
    },
    audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: 16000}
  })
  .catch((error) => {
    console.log('error', error.message);
  });

// WebSocket server for receiving live audio data
const wsServer = new WebSocket.Server({ port: WS_PORT });
wsServer.on('connection', (ws) => {
  console.log('ESP32 connected');

  ws.on('message', (sample) => {
    session.sendAudio(sample);
  });

  ws.on('close', () => {
    console.log('ESP32 disconnected');
    session.stop(); // Stop the Speechmatics session when the WebSocket disconnects
  });
});