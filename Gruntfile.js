module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		copy: {
			dist: {
				src: "js/jstfuel.js",
				dest: "dist/jstfuel.js"
			}
		},
		uglify: {
			dist: {
				src: ["dist/jstfuel.js"],
				dest: "dist/jstfuel.min.js"
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', ['copy', 'uglify']);

};
