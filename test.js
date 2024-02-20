const WebSocket = require('ws');
const { RealtimeSession } = require('speechmatics');

const API_KEY = 'HeSsji9rY7ytrv8H2iMuO5LXDp59J2xS';
const WS_PORT = 8888; // WebSocket server port
console.log('Server Online');

// WebSocket server for receiving live audio data
const wsServer = new WebSocket.Server({ port: WS_PORT });
wsServer.on('connection', (ws) => {
  console.log('ESP32 connected');
  let isConnected = false;

  // Speechmatics session setup
  let session = new RealtimeSession({ apiKey: API_KEY });

  session.addListener('Error', (error) => {
    console.log('session error', error);
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
      audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: 16000 }
    })
    .catch((error) => {
      console.log('error', error.message);
    });

  // Upon receiving transcript, send to ESP32S3
  session.addListener('AddTranscript', (message) => {
    process.stdout.write(message.metadata.transcript);
    wsServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.metadata.transcript);
      }
    });
  });

  // Checks if server is connected to Speechmatics
  session.addListener('RecognitionStarted', (message) => {
    console.log("Recognition has started successfully.");
    isConnected = true;
  });

  ws.isAlive = true; // Mark the connection as alive

  ws.on('pong', () => {
    console.log("PONG");
    ws.isAlive = true; // Mark the connection as alive on receiving a pong
  });


  // Upon receiving audio, send to Speechmatics if WebSocket connection
  // is open and we're connected.
  ws.on('message', (sample) => {
    if (ws.readyState === WebSocket.OPEN && isConnected) {
      session.sendAudio(sample);
    } else {
      console.log("WebSocket connection is not open.");
    }
  });

  ws.on('close', () => {
    console.log('ESP32 disconnected');
    // Properly stop the Speechmatics session for the disconnected client
    if (session) {
      session.stop();
    }
  });
});

// Ping interval to check if client and server are connected
const interval = setInterval(() => {
  wsServer.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log("");
      console.log("DEAD");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
    console.log("");
    console.log("ALIVE");
  });
}, 5000); // Ping every 5 seconds

// Stop pinging on server close.
wsServer.on('close', () => {
  clearInterval(interval);
});
