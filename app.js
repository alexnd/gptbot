// express server with Openai communication

const url = require('url');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
//to add this use command: npm install socket.io
//const socketIo = require('socket.io');

const PORT = process.env.API_PORT || 3000;
const ADDR = process.env.API_ADDR || '0.0.0.0';
const ROOT_PATH = process.env.ROOT_PATH || '/api';

//console.log('*[env]', process.env);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
  // footprint log
  console.log(dt(), req.connection.remoteAddress, req.method, req.url);
  // isAjax
  const ctype = `${req.header('content-type') || req.header('accept') || ''}`;
  const xrw = `${req.header('x-requested-with') || ''}`;
  req.isAjax = ctype && ctype.match('json') || xrw && xrw.match(/XMLHttpRequest/i);
  // sendError
  res.sendError = (error, code = 200) => {
    if (req.isAjax) {
      res.status(code).json({error});
    } else {
      res.status(code).send(`<h1>Error: ${error}</h1>`);
    }
  };
  next();
});

const httpServer = http.createServer(app);
//const io = new socketIo.Server(httpServer);

app.get(ROOT_PATH, (req, res) => {
  if (req.isAjax) {
    res.json({ version: app.package.version });
  } else {
    res.send(`version: ${app.package.version}`);
  }
});

app.post(`${ROOT_PATH}/chat`, (req, res) => {
  const msg = req.body.message || '';
  if (msg) {
    chatGTPcompletions(msg)
      .then(result => {
        let resp = []
        if (result.choices) {
          for (let c of result.choices) {
            resp.push(c.text);
          }
        }
        res.json(resp);
      })
      .catch(err => {
        res.json({ error: err.message });
      });
  } else {
    res.json({ error: 'Message required' });
  }
});

// host frontend static
if (process.env.STATIC_PATH) {
  app.use(express.static(process.env.STATIC_PATH));
}

// 404
app.all('*', (req, res) => {
  res.sendError(messages.notFound, 404);
});
  
// errors handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.sendError(err.message || '', 500);
});

// Websockets
//io.on('connection', (socket) => {
//  console.log('*[io connected]', socket.handshake.query);
//  socket.on('disconnect', () => {
//        console.log('*[io disconnected]');
//  });
//  socket.on('chat message', (msg) => {
//    console.log('*[io chat message]', msg);
//    wsBroadcast(msg, 'chat message');
//  });
//  socket.broadcast.emit('user connection');
//});

// start server
httpServer.listen(PORT, ADDR, () => {
  console.log(`API server started on http://${ADDR}:${PORT} at ${dt()}`);
});

function dt(d) {
  return (d ? new Date(d) : new Date()).toISOString().substr(0, 19);
}

// broadcast to websockets (emit the event to all connected sockets)
//function wsBroadcast(payload, id = 'message') {
//  io.emit(id, payload);
//}

/*
curl https://api.openai.com/v1/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_API_KEY" \
-d '{"model": "text-davinci-003", "prompt": "Say this is a test", "temperature": 0, "max_tokens": 7}'

*responce {
  id: 'cmpl-6Yl3kCi5yVXZDmJa1Cn2XrTx23Juo',
  object: 'text_completion',
  created: 1673742068,
  model: 'text-davinci-003',
  choices: [
    {
      text: ' located?\n\nUkraine is located',
      index: 0,
      logprobs: null,
      finish_reason: 'length'
    }
  ],
  usage: { prompt_tokens: 3, completion_tokens: 7, total_tokens: 10 }
}
*/
function chatGTPcompletions(message) {
  return new Promise(async (resolve, reject) => {
    if (!process.env.OPENAI_API_KEY) {
        return reject(new Error('OPENAI_API_KEY not set'))
      }
      if (!process.env.OPENAI_API_URI) {
        return reject(new Error('OPENAI_API_URI not set'))
      }
      const uri = `${process.env.OPENAI_API_URI}completions`;
      //console.log('*uri:', uri);
      const u = url.parse(uri);
      //console.log('*url:', uri);
      const payload = {
        model: 'text-davinci-003',
        prompt: message,
        temperature: 0,
        max_tokens: 7,
      };
      const options = {
        hostname: u.hostname,
        path: u.path,
        port: u.protocol === 'https:' ? 443 : 80,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
      };
      //console.log('*options:', options);
      //console.log('*payload:', payload);
      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
        let json = {};
        if (data) {
            try {
            Object.assign(json, JSON.parse(data));
            } catch (e) {
            console.error(e);
            }
        }
        console.log('*responce', json);
        resolve(json);
        });
      });
      req.on('error', err => {
        console.error(err);
        reject(err);
      });
      req.write(JSON.stringify(payload));
      req.end();
  });
}