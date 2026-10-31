const fs = require('fs');
const path = require('path');

module.exports = function serveChat(req, res) {
  fs.readFile(path.join(process.cwd(), 'index.html'), (error, page) => {
    if (error) {
      res.statusCode = 500;
      res.end('No se pudo cargar UNA Chat');
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(page);
  });
};
