var gulp = require('gulp');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var concat = require('gulp-concat');
var rename = require('gulp-rename');


gulp.task('init', function(){
    gulp.src('source/less/one.less').pipe(less()).pipe(minifycss()).pipe(gulp.dest('source/css/'));
    gulp.src(['source/css/ionicons.css', 'source/css/swiper.css', 'source/css/one.css']).pipe(concat('one.css')).pipe(gulp.dest('build/css/'));

    gulp.src(['source/js/swiper.js', 'source/js/one.js']).pipe(concat('one.js')).pipe(uglify()).pipe(gulp.dest('build/js/'));

    gulp.src('source/js/require.js').pipe(gulp.dest('build/js/'));
    gulp.src('source/js/text.js').pipe(uglify()).pipe(gulp.dest('build/js'));

    gulp.src('source/fonts/*').pipe(gulp.dest('build/fonts/'));
});

gulp.task('default', ['init']);