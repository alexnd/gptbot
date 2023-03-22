// express server with Openai communication

const url = require('url');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const { Configuration: OpenAIConfiguration, OpenAIApi } = require('openai');

const PORT = process.env.API_PORT || 3000;
const ADDR = process.env.API_ADDR || '0.0.0.0';
const ROOT_PATH = process.env.ROOT_PATH || '/api';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_TEMPERATURE = process.env.OPENAI_TEMPERATURE || 0;
const OPENAI_MAX_TOKENS = process.env.OPENAI_MAX_TOKENS || 7;

//console.log('*[env]', process.env);

if (!OPENAI_API_KEY) {
  console.log('Error: OPENAI_API_KEY not set');
  process.exit(1);
}
const openAIConfig = new OpenAIConfiguration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openaiApi = new OpenAIApi(openAIConfig);
if (!openaiApi) {
  console.log('Error: OPENAI not available');
  process.exit(1);
}

const history = [];

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
        res.json([result]);
      })
      .catch(error => {
        res.json({ error });
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
  res.sendError('Not Found', 404);
});
  
// errors handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.sendError(err.message || '', 500);
});

// start server
httpServer.listen(PORT, ADDR, () => {
  console.log(`API server started on http://${ADDR}:${PORT} at ${dt()}`);
});

function dt(d) {
  return (d ? new Date(d) : new Date()).toISOString().substr(0, 19);
}

function chatGTPcompletions(message) {
  return new Promise(async (resolve, reject) => {
    const messages = [];
    for (const [input, completion] of history) {
      messages.push({ role: 'user', content: input });
      messages.push({ role: 'assistant', content: completion });
    }
    messages.push({ role: 'user', content: message });
    try {
      const completion = await openaiApi.createChatCompletion({
        model: OPENAI_MODEL,
        messages,
      });
      const text = completion.data.choices[0].message.content;
      console.log('*completion:', text);
      history.push([message, text]);
      resolve(text);
    } catch (e) {
      reject(e.message);
    }
  });
}