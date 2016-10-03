var gulp = require("gulp");
var gutil = require('gulp-util');
var browserify = require('gulp-browserify');


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

gulp.task('watch', function() {
  gulp.watch(['src/client/*.js'], ['browserify'])
});
gulp.task('default', ['watch']);
