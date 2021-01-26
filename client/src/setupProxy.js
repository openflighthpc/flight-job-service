const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy requests to the api.
  app.use(
    '/job-scripts/api/v0/ping',
    (req, res, next) => {
      res.send('OK');
    },
  );

  app.use(
    '/job-scripts/api/v0',
    createProxyMiddleware({
      target: 'http://localhost:6310',
      changeOrigin: false,
      pathRewrite: {
        '^/job-scripts/api/': '/', // Remove base path.
      },
      logLevel: 'debug',
    })
  );
};
