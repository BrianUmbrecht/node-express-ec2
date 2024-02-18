
// const WebSocket = require('ws');
// const { RealtimeSession } = require('speechmatics');

// const API_KEY = 'HeSsji9rY7ytrv8H2iMuO5LXDp59J2xS';
// const WS_PORT = 8888; // WebSocket server port
// console.log('Server online');

// // Speechmatics session setup
// const session = new RealtimeSession({ apiKey: API_KEY });

// session.addListener('Error', (error) => {
//   console.log('session error', error);
// });


// session.addListener('EndOfTranscript', () => {
//   process.stdout.write('\n');
// });

// session
//   .start({
//     transcription_config: {
//       language: 'es',
//       operating_point: 'enhanced',
//       enable_partials: true,
//       max_delay: 2,
//     },
//     translation_config: {
//       target_languages: ["en"]
//     },
//     audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: 16000}
//   })
//   .catch((error) => {
//     console.log('error', error.message);
//   });

// // WebSocket server for receiving live audio data
// const wsServer = new WebSocket.Server({ port: WS_PORT });
// wsServer.on('connection', (ws) => {
//   console.log('ESP32 connected');
//   ws.on('message', (sample) => {
//     session.sendAudio(sample);
//   });

//   ws.on('close', () => {
//     console.log('ESP32 disconnected');
//     session.stop(); // Stop the Speechmatics session when the WebSocket disconnects
//   });
// });

// session.addListener('AddTranscript', (message) => {
//   // process.stdout.write(message.metadata.transcript);
//   // wsServer.clients.forEach(function each(client) {
//   //   if (client.readyState === WebSocket.OPEN) {
//   //     client.send(message.metadata.transcript);
//   //   }
//   // });
// });

// session.addListener('AddTranslation', (message) => {
//   // Assuming 'message.results' is an array of objects each containing a 'content' property
//   if (Array.isArray(message.results)) {
//     const translations = message.results.map(segment => segment.content);
//     const translation = translations.join(" ").trim();
//     process.stdout.write(translation);
//   } else {
//     console.log('Translation results structure is unexpected or undefined');
//   }
// });

const WebSocket = require('ws');
const { RealtimeSession } = require('speechmatics');

const API_KEY = 'HeSsji9rY7ytrv8H2iMuO5LXDp59J2xS';
const WS_PORT = 8888; // WebSocket server port
console.log('asdasd');

// Speechmatics session setup
const session = new RealtimeSession({ apiKey: API_KEY });

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
    audio_format: { type: 'raw', encoding: 'pcm_s16le', sample_rate: 16000}
  })
  .catch((error) => {
    console.log('error', error.message);
  });

// WebSocket server for receiving live audio data
const wsServer = new WebSocket.Server({ port: WS_PORT });
wsServer.on('connection', (ws) => {
  console.log('ESP32 connected');

  ws.isAlive = true; // Mark the connection as alive

  ws.on('pong', () => {
    ws.isAlive = true; // Mark the connection as alive on receiving a pong
  });

  ws.on('message', (sample) => {
    session.sendAudio(sample);
  });

  ws.on('close', () => {
    console.log('ESP32 disconnected');
    session.stop(); // Stop the Speechmatics session when the WebSocket disconnects
  });
});

const interval = setInterval(() => {
  wsServer.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();

    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}, 10000); // Ping every 30 seconds

// Clean up interval on server close
wsServer.on('close', () => {
  clearInterval(interval);
});

session.addListener('AddTranscript', (message) => {
  process.stdout.write(message.metadata.transcript);
  wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message.metadata.transcript);
    }
  });
});
