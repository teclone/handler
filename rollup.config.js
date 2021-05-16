const { config } = require('@teclone/rollup-all');
module.exports = config({
  config: {
    cjsConfig: {
      outDir: './lib',
    },
    esmConfig: {
      enabled: false,
    },
  },
});
