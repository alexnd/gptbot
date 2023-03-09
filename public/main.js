//var socket = new WebSocket("ws://" + location.host);
var socket = null, elMessages = null, elForm = null, elInput = null, elButton = null, question = '';

function init() {
  //socket = io('ws://localhost:3000');
  elMessages = document.getElementById('messages');
  elForm = document.getElementById('form_chat');
  elInput = document.getElementById('msg');
  elButton = document.getElementById('button_chat');

  elForm.addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage();
  });

  elButton.addEventListener('click', function(e) {
    e.preventDefault();
    sendMessage();
  });

  setTimeout(function() {
    renderMessage('Wellcome to GPT-based chatbot! Ask me something...', true);
  }, 1500);
  /*
  socket.onopen = function(e) {
    console.log('*[websocket connected]');
  };
  socket.onclose = function(event) {
    if (event.wasClean) {
      console.log('*[websocket closed] code=' + event.code + ' reason=' +event.reason);
    } else {
      // server process killed or network down
      // event.code is usually 1006 in this case
      console.log('*[websocket connection closed]');
    }
  };
  socket.onerror = function(error) {
    console.log('*[websocket error]');
  };
  socket.onmessage = function(msg) {
    console.log('*[websocket message]', msg);
    var item = document.createElement('li');
    item.textContent = msg.data;
    elMessages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  };*/
  /*
  socket.on('chat message', function(msg) {
    console.log('ws message', msg);
    renderMessage(msg);
    window.scrollTo(0, document.body.scrollHeight);
  });
  */
}

function renderMessage(msg, isReply) {
  var el = document.createElement('li');
  if (isReply) el.className = 'reply';
  el.textContent = msg;
  elMessages.appendChild(el);
  elMessages.insertBefore(el, elMessages.firstChild);
  window.scrollTo(0, document.body.scrollHeight);
}

function renderJson(obj) {
  var el = document.createElement('li');
  el.innerHTML = '<pre>' + JSON.stringify(obj, null, 2) + '</pre>';
  elMessages.appendChild(el);
}

function sendMessage() {
  var msg = elInput.value;
  msg = msg.trim();
  if (!msg) return;
  /*const msg = {ts: Date.now(), fromUser: 'root', msg: elInput.value};
  console.log('*[socket.send]', msg);
  socket.send(JSON.stringify(msg));*/
  question = msg;
  elInput.value = '';
  renderMessage(question);
  apiChat(msg);
}

function apiChat(msg) {
  fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    cache: 'no-cache',
    body: JSON.stringify({message: msg})
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log('*[responce]', data);
    if (data && Array.isArray(data)) {
      renderMessage(data.join('\n'), true);
    } else {
      renderMessage(data, true);
    }
  })
  .catch(function(err) {
    console.error(err);
    alert(err.message);
  });
}

function apiTest() {
  fetch('/api', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    cache: 'no-cache',
  })
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    console.log('*[responce]', data);
    renderJson(data);
  })
  .catch(function(err) {
    console.error(err);
    alert(err.message);
  });
}
