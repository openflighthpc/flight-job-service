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
    '/job-scripts/api/v0/templates',
    (req, res, next) => {
      res.send({
        data: [
          {
            id: 'simple.sh',
            type: 'job-script-template',
            attributes: {
              name: 'simple.sh',
              synopsis: 'Simple serial job script',
              description: 'Your job will be allocated a single core on the first available node.',
            }
          },
          {
            id: 'simple-array.sh',
            type: 'job-script-template',
            attributes: {
              name: 'simple-array.sh',
              synopsis: 'Simple serial array job script',
              description: 'Submit multiple, similar jobs. Each job will be allocated a single core on the first available node.',
            }
          },
        ]
      });
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
