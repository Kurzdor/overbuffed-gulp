'use strict';
 
var gulp = require('gulp'),
    bsync = require('browser-sync'),
    pump = require('pump'),
    sourcemaps = require('gulp-sourcemaps'),
    scss = require('gulp-sass'),
    prefix = require('gulp-autoprefixer'),
    bro = require('gulp-bro'),
    babelify = require('babelify'),
    uglifyify = require('uglifyify'),
    rename = require('gulp-rename'),
    changed = require('gulp-changed'),
    gIf = require('gulp-if'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant');

var dir = {
    builddist: "/tmp/build/",
    build: {
      html: '/tmp/build/',
      js: '/tmp/build/static/js/',
      img: '/tmp/build/static/images/',
      css: '/tmp/build/static/css/',
      fonts: '/tmp/build/static/fonts/',
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
    return gulp.src('src/favicon.ico')
      .pipe(gIf(isDevelopment, gulp.dest(dir.build.html)))
      .pipe(gIf(!isDevelopment, gulp.dest(dir.dist.html)))
});

gulp.task('html', function() {
  return pump([
    gulp.src(dir.src.html),
    gIf(isDevelopment, changed(dir.build.html)),
    gIf(!isDevelopment, gulp.dest(dir.dist.html)),
    gIf(isDevelopment, gulp.dest(dir.build.html))
  ]);
});

gulp.task('css', function() {
    return pump([
      gulp.src(dir.src.css),
      gIf(isDevelopment, changed(dir.build.css)),
      gIf(!isDevelopment, gulp.dest(dir.dist.css)),
      gIf(isDevelopment, gulp.dest(dir.build.css))
    ]);
});

gulp.task('scss', function() {
  return pump([
    gulp.src(dir.src.scss),
    gIf(isDevelopment, changed(dir.build.css)),
    gIf(isDevelopment, sourcemaps.init()),
    gIf(isDevelopment, scss({
      outputStyle: 'expanded',
      includePaths: ['./node_modules/']
    }).on('error', scss.logError)),
    gIf(!isDevelopment, scss({
      outputStyle: 'compressed',
      includePaths: ['./node_modules/']
    }).on('error', scss.logError)),
    prefix({
      browsers: ['last 3 versions', 'Firefox ESR', 'Safari >= 6']
    }),
    gIf(isDevelopment, sourcemaps.write('./')),
    gIf(!isDevelopment, gulp.dest(dir.dist.css)),
    gIf(isDevelopment, gulp.dest(dir.build.css)),
  ]);
});

gulp.task('js', function () {
  return pump([
      gulp.src(dir.src.js),
      gIf(isDevelopment, sourcemaps.init()),
      bro({
        entries: ['index.js'],
        paths: ['.', '/node_modules'],
        transform: [
          babelify.configure({ presets: ['env'] }),
          ['uglifyify', { 
            global: true,
            compress: {
              passes: 2
            }
          }]
        ]
      }),
      rename({
        basename: 'script'
      }),
      gIf(isDevelopment, sourcemaps.write()),
      gIf(!isDevelopment, gulp.dest(dir.dist.js)),
      gIf(isDevelopment, gulp.dest(dir.build.js)),
  ]);
});

gulp.task('img', function () {
  return pump([
    gulp.src(dir.src.img),
    gIf(isDevelopment, changed(dir.build.img)),
    imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()],
        interlaced: true
    }),
    gIf(isDevelopment, gulp.dest(dir.build.img)),
    gIf(!isDevelopment, gulp.dest(dir.dist.img)),
  ]);
});

gulp.task('fonts', function () {
  return pump([
    gulp.src(dir.src.fonts),
    gIf(isDevelopment, changed(dir.build.fonts)),
    gIf(isDevelopment, gulp.dest(dir.build.fonts)),
    gIf(!isDevelopment, gulp.dest(dir.dist.fonts))
  ]);
});

gulp.task('watch', function() {
  gulp.watch(dir.watch.scss, gulp.series('scss'));
  gulp.watch(dir.watch.html, gulp.series('html'));
  gulp.watch(dir.watch.js, gulp.series('js'));
  gulp.watch(dir.watch.img, gulp.series('img'));
  gulp.watch(dir.watch.fonts, gulp.series('fonts'));
});

gulp.task('server', function () {
  bsync.init(browserSyncConfig);
  bsync.watch("src/**/*.*").on('change', bsync.reload);
});

gulp.task('build-dev', gulp.series('img', 'scss', 'css', 'js', 'fonts', 'html', 'favicon', gulp.parallel('watch', 'server')));

gulp.task('build-prod', gulp.series(gulp.parallel('img', 'scss', 'css', 'js', 'fonts', 'html', 'favicon')));

gulp.task('default', gulp.series(gulpBuildMode));