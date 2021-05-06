const {src, dest, series, parallel, watch} = require('gulp');
const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const less = require('gulp-less');
// const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const csso = require('postcss-csso');
const autoprefixer = require('autoprefixer');
const sync = require('browser-sync').create();
const includer = require('gulp-file-include');
const beautify = require('gulp-beautify').html;
const htmlmin = require('gulp-htmlmin');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');
const rename = require('gulp-rename');
const del = require('del');
const uglify = require('gulp-uglify-es').default;


// html
const htmlProto = (fileName) => {
  return src(`source/${fileName}.html`)
    .pipe(includer({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(beautify({
      end_with_newline: true,
      indent_size: 2
    }))
    // .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('build'))
    .pipe(sync.stream())
}

const index = () => htmlProto('index');
const catalog = () => htmlProto('catalog');
const form = () => htmlProto('form');


// js

// const scriptList = ['source/js/example.js', 'source/js/page-header.js', 'source/js/map.js']
const scriptList = ['source/js/main.js'];
const scripts = () => {
  return src(scriptList)
    .pipe(concat('script.js'))
    .pipe(uglify())
    .pipe(dest('build/js'))
    .pipe(sync.stream())
}
exports.scripts = scripts;


// Styles

const styles = () => {
  // return src('source/sass/style.scss')
  return src('source/less/style.less')
    .pipe(plumber())
    .pipe(sourcemap.init())
    // .pipe(sass())
    .pipe(less())
    // .pipe(postcss([
    //   autoprefixer(),
    //   csso()
    // ]))
    .pipe(sourcemap.write('.'))
    .pipe(dest('build/css'))
    .pipe(sync.stream());
}
exports.styles = styles;


//images

const images = () => {
  return src('source/img/**/*.{png,jpg,svg}')
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 4}),
    imagemin.mozjpeg({progressive: true}),
    imagemin.svgo()
  ]))
  .pipe(dest('build/img'))
}
exports.images = images;

const webPs = () => {
  return src('source/img/**/*.{png,jpg}')
  .pipe(webp({quality: 80}))
  .pipe(dest('build/img'))
}
exports.webPs = webPs;

const sprite = () => {
  return src('source/img/for-sprite/*.svg')
  .pipe(imagemin([imagemin.svgo()]))
  .pipe(svgstore())
  .pipe(rename('sprite.svg'))
  .pipe(dest('build/img'))
}
exports.sprite = sprite;


// COPY

const copyBuild = done => {
  src([
    'source/fonts/*.{woff2,woff}'
    // ,
    // 'source/*.ico',
    // 'source/manifest.webmanifest'
  ], {base: 'source'})
  .pipe(dest('build'))
  done();
}
exports.copyBuild = copyBuild;

const copyWork = done => {
  src([
    'source/fonts/*.{woff2,woff}',
    // 'source/*.ico',
    // 'source/manifest.webmanifest',
    'source/img/**/*.{png,jpg,svg}'
  ], {base: 'source'})
  .pipe(dest('build'))
  done();
}
exports.copyWork = copyWork;


// clean

const clean = () => del('build');


// Server

const server = done => {
  sync.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;


// Watcher

const watcher = () => {
  watch('source/**/*.html', index);
  watch('source/**/*.html', catalog);
  watch('source/**/*.html', form);
  watch('source/js/**/*.js', scripts)
  // watch('source/sass/**/*.scss', styles);
  watch('source/less/**/*.less', styles);
}

exports.build = series(clean, parallel(index, catalog, form), copyBuild, parallel(images, webPs, sprite), scripts, styles);
exports.default = series(clean, parallel(index, catalog, form), copyWork, parallel(webPs, sprite), scripts, styles, server, watcher);
