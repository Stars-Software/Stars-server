const http = require('http');
const url = require('url');
const querystring = require('querystring');
const { StringDecoder } = require('string_decoder');

class LibraryExpress {
  constructor() {
    this.routes = {};
    this.middleware = [];
  }

  createServer() {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const path = parsedUrl.pathname;
      const trimmedPath = path.replace(/^\/+|\/+$/g, '');
      const method = req.method.toLowerCase();
      const query = parsedUrl.query;
      const headers = req.headers;

      const decoder = new StringDecoder('utf-8');
      let buffer = '';

      req.on('data', (data) => {
        buffer += decoder.write(data);
      });

      req.on('end', () => {
        buffer += decoder.end();

        const chosenHandler = this.routes[trimmedPath] || this.notFoundHandler;

        const data = {
          path: trimmedPath,
          query,
          method,
          headers,
          payload: buffer
        };

        chosenHandler(data, (statusCode, payload) => {
          statusCode = typeof statusCode === 'number' ? statusCode : 200;
          payload = typeof payload === 'object' ? payload : {};

          const payloadString = JSON.stringify(payload);

          res.setHeader('Content-Type', 'application/json');
          res.writeHead(statusCode);
          res.end(payloadString);
        });
      });
    });

    return server;
  }

  get(path, handler) {
    this.routes[path] = handler;
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  notFoundHandler(data, callback) {
    callback(404);
  }

  parseCookies(request) {
    const cookies = {};
    const cookieHeader = request.headers.cookie;

    if (cookieHeader) {
      const cookieList = cookieHeader.split(';');

      cookieList.forEach((cookie) => {
        const [name, value] = cookie.split('=');
        cookies[name.trim()] = value.trim();
      });
    }

    return cookies;
  }

  parseBody(payload, contentType) {
    if (contentType === 'application/x-www-form-urlencoded') {
      return querystring.parse(payload);
    }

    return JSON.parse(payload);
  }
}

module.exports = LibraryExpress;