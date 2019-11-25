const {
  src,
  dest,
  series,
  parallel,
  watch,
  lastRun,
} = require('gulp')
const del = require('del')
const _if = require('gulp-if')
const smap = require('gulp-sourcemaps')
const sass = require('gulp-sass')
const postcss = require('gulp-postcss')
const webpack = require('webpack')
const webpackStream = require('webpack-stream')
const imgmin = require('gulp-imagemin')
const bs = require('browser-sync')

const PORT = +process.env.PORT || 9000
const isProduction = process.env.NODE_ENV === 'production'
const variant = isProduction ? 'prod' : 'dev'
const quick = !!!process.env.QUICK

const base = {
  dev: './dev/',
  prod: './dist/',
}

const paths = {
  prebuild: {
    dev: base.dev,
    prod: base.prod,
  },
  public: {
    src: 'public/**/*.*',
    dev: base.dev + 'public/',
    prod: base.prod + 'public/',
    watch: 'public/**/*.*',
  },
  html: {
    src: 'src/views/*.html',
    dev: base.dev,
    prod: base.prod,
    watch: 'src/*.html',
  },
  images: {
    src: 'src/images/**/*.{jpg|jpeg|svg|png|webp}',
    dev: base.dev + 'images/',
    prod: base.prod + 'images/',
    watch: 'src/images/**/*.{jpg|jpeg|svg|png|webp}',
  },
  fonts: {
    src: 'src/fonts/**/*.{ttf|otf|woff|woff2|svg}',
    dev: base.dev + 'fonts/',
    prod: base.prod + 'fonts/',
    watch: 'src/fonts/**/*.{ttf|otf|woff|woff2|svg}',
  },
  scss: {
    src: 'src/scss/style.scss',
    dev: base.dev + 'css/',
    prod: base.prod + 'css/',
    watch: 'src/scss/**/*.scss',
  },
  js: {
    src: 'src/js/index.js',
    dev: base.dev + 'js/',
    prod: base.prod + 'js/',
    watch: 'src/js/**/*.js',
  },
}

const watchTarget = base.dev + '**/*.*'

const cfg = {
  scss: {
    dev: {
      outputStyle: 'expanded',
      includePaths: ['./node_modules/'],
    },
    prod: {
      outputStyle: 'compressed',
      includePaths: ['./node_modules/'],
    },
    quick: {
      outputStyle: 'expanded',
      includePaths: ['./node_modules/'],
    },
  },
  webpack: {
    dev: {
      mode: 'development',
      devtool: 'source-map',
      output: {
        filename: 'script.js',
      },
    },
    prod: {
      mode: 'production',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: [
                  '@babel/plugin-proposal-object-rest-spread',
                ],
              },
            },
          },
        ],
      },
      output: {
        filename: 'script.js',
      },
    },
    quick: {
      mode: 'production',
      optimization: {
        minimize: false,
      },
      output: {
        filename: 'script.js',
      },
    },
  },
  serve: {
    server: {
      baseDir: base.dev,
    },
    tunnel: false,
    port: PORT,
    logConnections: true,
    ghostMode: true,
  },
}

const prebuild = () => del(paths.prebuild[variant])

const public = () =>
  src(paths.public.src, {
    since: lastRun(public),
    allowEmpty: true,
  }).pipe(dest(paths.public[variant]))

const html = () =>
  src(paths.html.src, {
    since: lastRun(html),
    allowEmpty: true,
  }).pipe(dest(paths.html[variant]))

const images = () =>
  src(paths.html.src, {
    since: lastRun(images),
    allowEmpty: true,
  })
    .pipe(
      _if(
        isProduction,
        imgmin([
          imgmin.gifsicle({ interlaced: true }),
          imgmin.jpegtran({ progressive: true }),
          imgmin.optipng({ optimizationLevel: 5 }),
        ])
      )
    )
    .pipe(dest(paths.html[variant]))

const fonts = () =>
  src(paths.fonts.src, {
    since: lastRun(fonts),
    allowEmpty: true,
  }).pipe(dest(paths.fonts[variant]))

const scss = () =>
  src(paths.scss.src, { since: lastRun(scss), allowEmpty: true })
    .pipe(_if(!isProduction, smap.init()))
    .pipe(sass(cfg.scss[variant]).on('error', sass.logError))
    .pipe(postcss())
    .pipe(_if(!isProduction, smap.write('./')))
    .pipe(dest(paths.scss[variant]))

const js = () =>
  src(paths.js.src, { since: lastRun(js), allowEmpty: true })
    .pipe(_if(!isProduction, smap.init()))
    .pipe(
      _if(
        quick,
        webpackStream(cfg.webpack[variant], webpack),
        webpackStream(cfg.webpack.quick, webpack)
      )
    )
    .pipe(_if(!isProduction, smap.write('./')))
    .pipe(dest(paths.js[variant]))

const serve = () => {
  bs.init(cfg.serve)

  bs.watch(watchTarget).on('change', bs.reload)
}

const _watch = () => {
  watch(paths.public.watch, public)
  watch(paths.html.watch, html)
  watch(paths.images.watch, images)
  watch(paths.fonts.watch, fonts)
  watch(paths.scss.watch, scss)
  watch(paths.js.watch, js)
}

exports.default = isProduction
  ? series(prebuild, parallel(public, html, scss, js, images, fonts))
  : series(
      prebuild,
      public,
      html,
      scss,
      js,
      images,
      fonts,
      parallel(serve, _watch)
    )
