'use strict';

var gulp = require('gulp');
var bsync = require('browser-sync');
var pump = require('pump');
var sourcemaps = require('gulp-sourcemaps');
var scss = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var bro = require('gulp-bro');
var babelify = require('babelify');
var uglifyify = require('uglifyify');
var rename = require('gulp-rename');
var changed = require('gulp-changed');
var gIf = require('gulp-if');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

var dir = {
  builddist: './tmp/build/',
  build: {
    html: './tmp/build/',
    js: './tmp/build/static/js/',
    img: './tmp/build/static/images/',
    css: './tmp/build/static/css/',
    fonts: './tmp/build/static/fonts/',
  },
  dist: {
    html: 'dist/',
    js: 'dist/static/js/',
    img: 'dist/static/images/',
    css: 'dist/static/css/',
    fonts: 'dist/static/fonts/',
  },
  src: {
    html: 'src/**/*.html',
    js: 'src/js/index.js',
    css: 'src/css/*.css',
    scss: 'src/scss/style.scss',
    img: 'src/images/**/*.*',
    fonts: 'src/fonts/**/*.*'
  },
  watch: {
    html: 'src/**/*.html',
    js: 'src/js/**/*.js',
    scss: 'src/scss/**/*.scss',
    img: 'src/images/**/*.*',
    fonts: 'src/fonts/**/*.*'
  }
};

var browserSyncConfig = {
  server: {
    baseDir: dir.builddist
  },
  tunnel: false,
  host: 'localhost',
  port: 9000,
  logPrefix: 'overbuffed-gulp'
};

var isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

var gulpBuildMode = isDevelopment ? 'build-dev' : 'build-prod';

console.log(isDevelopment ? '[OVERBUFFED-GULP] Building dev...' : '[OVERBUFFED-GULP] Building production...');

gulp.task('favicon', function() {
  return gulp.src('src/favicon.ico', {allowEmpty: true})
    .pipe(gulp.dest(isDevelopment?dir.build.html:dir.dist.html));
});

gulp.task('html', function(cb) {
  return pump([
    gulp.src(dir.src.html),
    gIf(isDevelopment, changed(dir.build.html)),
    gulp.dest(isDevelopment?dir.build.html:dir.dist.html),
  ], cb);
});

gulp.task('css', function(cb) {
  return pump([
    gulp.src(dir.src.css),
    gIf(isDevelopment, changed(dir.build.css)),
    gulp.dest(isDevelopment?dir.build.css:dir.dist.css),
  ], cb);
});

gulp.task('scss', function(cb) {
  return pump([
    gulp.src(dir.src.scss),
    gIf(isDevelopment, changed(dir.build.css)),
    gIf(isDevelopment, sourcemaps.init()),
    scss({
      outputStyle: 'expanded',
      includePaths: ['./node_modules/']
    }).on('error', scss.logError),
    prefix({
      browsers: ['last 3 versions', 'Firefox ESR', 'Safari >= 6']
    }),
    gIf(isDevelopment, sourcemaps.write('./')),
    gulp.dest(isDevelopment?dir.build.css:dir.dist.css),
  ], cb);
});

gulp.task('js', function(cb) {
  return pump([
    gulp.src(dir.src.js, {allowEmpty: true}),
    gIf(isDevelopment, sourcemaps.init()),
    bro({
      entries: ['index.js'],
      paths: ['.', '/node_modules'],
      transform: [
        babelify.configure({presets: ['env']}),
        [
          'uglifyify', {
            global: true,
            compress: {
              passes: 2
            }
          }
        ]
      ]
    }),
    rename({
      basename: 'script'
    }),
    gIf(isDevelopment, sourcemaps.write()),
    gulp.dest(isDevelopment?dir.build.js:dir.dist.js),
  ], cb);
});

gulp.task('img', function(cb) {
  return pump([
    gulp.src(dir.src.img),
    gIf(isDevelopment, changed(dir.build.img)),
    gIf(!isDevelopment, imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()],
      interlaced: true
    })),
    gulp.dest(isDevelopment?dir.build.img:dir.dist.img),
  ], cb);
});

gulp.task('fonts', function(cb) {
  return pump([
    gulp.src(dir.src.fonts, {allowEmpty: true}),
    gIf(isDevelopment, changed(dir.build.fonts)),
    gulp.dest(isDevelopment?dir.build.fonts:dir.dist.fonts),
  ], cb);
});

gulp.task('watch', function() {
  gulp.watch(dir.watch.scss, gulp.series('scss'));
  gulp.watch(dir.watch.html, gulp.series('html'));
  gulp.watch(dir.watch.js, gulp.series('js'));
  gulp.watch(dir.watch.img, gulp.series('img'));
  gulp.watch(dir.watch.fonts, gulp.series('fonts'));
});

gulp.task('server', function() {
  bsync.init(browserSyncConfig);
  bsync.watch("src/**/*.*").on('change', bsync.reload);
});

gulp.task('build-dev', gulp.series('img', 'scss', 'css', 'js', 'fonts', 'html', 'favicon', gulp.parallel('watch', 'server')));

gulp.task('build-prod', gulp.series(gulp.parallel('img', 'scss', 'css', 'js', 'fonts', 'html', 'favicon')));

gulp.task('default', gulp.series(gulpBuildMode));
