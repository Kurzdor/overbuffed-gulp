module.exports = {
  plugins: {
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009',
        grid: false,
      },
      stage: 3,
    },
    'postcss-flexbugs-fixes': {},
    'postcss-normalize': {},
  },
}
