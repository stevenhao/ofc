var gulp = require("gulp");
var gutil = require('gulp-util');
var browserify = require('gulp-browserify');
var less = require('gulp-less');
var path = require('path');

gulp.task('browserify', function () {
  var b = browserify();
  b.on('error', function(err) {
    gutil.log(err);
    b.end();
  });
  return gulp.src(['src/client/*.js', ])
    .pipe(b)
    .pipe(gulp.dest('./public/js/'));
});
 
gulp.task('less', function () {
  var l = less();
  l.on('error', function(err) {
    gutil.log(err);
    b.end();
  });
  return gulp.src('src/client/*.less')
    .pipe(l)
    .pipe(gulp.dest('./public/css'));
});

gulp.task('watch', function() {
  gulp.watch(['src/client/*', 'src/share/*'], ['browserify', 'less'])
});
gulp.task('default', ['watch']);
