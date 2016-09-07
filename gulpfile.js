var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var concat = require("gulp-concat-js");

gulp.task('buildjs', function() {
   gulp.src('src/client/*.js')
   .pipe(gulp.dest('./public'));
});

gulp.task('default', ['buildjs']);
