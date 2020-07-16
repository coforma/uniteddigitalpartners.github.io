module.exports = function(grunt) {

  const pkg = grunt.file.readJSON('package.json');
  const _ = require('lodash');
  const Handlebars = require('handlebars');
  const Entities = require('html-entities').AllHtmlEntities;
  const entities = new Entities();
  const md = require('markdown-it')({
    html: true,
    linkify: true
  });
  const mila = require('markdown-it-link-attributes');

  md.use(mila, {
    attrs: {
      target: '_blank',
      tabindex: '0',
    },
  });
  
  Handlebars.registerHelper({
    check: function(x) {
      console.log('Check:', x);
    }, // check
    decode: function(str) {
      return entities.decode(str);
    }, // decode
    encode: function(str) {
      return md.renderInline(Handlebars.helpers.prepString.apply(this, Array.prototype.slice.call(arguments)));
    }, // encode
    encodeParagraph: function(str) {
      return md.render(Handlebars.helpers.prepString.apply(this, Array.prototype.slice.call(arguments)));
    }, // encodeParagraph
    eq: function(a, b) {
      return a==b;
    }, // equal    
    hyphenize: function(str) {
      return _.kebabCase(str);
    }, // hyphenize
    lowercase: function(str) {
      return _.toLower(str);
    }, // lowercase
    prepString: function(str, transform, needle) {
      if(typeof transform==='string') {
        return Handlebars.helpers[transform].call(this, entities.encode(str), needle);
      }
      return entities.encode(str);
    }, // prepString
 
    split: function(str) {
      return str.split('\n\n');
    }, // split
  });

  grunt.initConfig({
    pkg: pkg,
    timestamp: new Date().getTime(),
    autoprefixer: {
      dist:{
        options: {
          map: true,
          grid: 'autoplace',
          browserslist: [
            'last 3 version',
            'IE 11'
          ],
          browsers: 'last 6 versions'
        },
        files:{
          './assets/bundled.<%=timestamp%>.min.css': './src/css/bundled.css'
        }
      }
    }, // autoprefixer

    browserify: {
      './assets/bundled.<%=timestamp%>.js': ['./src/scripts/script.js'],
      options: {
        transform: [
          [
            "hbsfy", {
              "extensions": [
                "hbs"
              ]
            }
          ]
        ]
      }
    }, // browserify

    clean: {
      stamped: ['assets']
    },

    connect: {
      dev: {
        options: {
          port: 8888,
          base: './',
          livereload: true,
        }
      }
    },
    copy: {
      assets: {
        files: [{
          expand: true,
          flatten: false,
          filter: 'isFile',
          cwd: 'src/',
          src: [
            '{styles,fonts,images,data}/**',
            'templates/*.hbs',
            '!**/*.scss',
            '!**/{sections,metadata}.json',
            '!**/index.hbs'
          ],
          dest: './assets'
        }]
      }
    }, // copy

    sass: {                              // Task
      dist: {                            // Target
        options: {                       // Target options
          style: 'compressed',
          loadPath: 'node_modules/',
        },
        files: {
          './src/css/bundled.css': './src/styles/styles.scss'
        }
      }
    }, // sass

    watch: {
      options: {
        spawn: false
      },
      markup: {
        files: [
          './src/**/*',
        ],
        tasks: ['collect']
      },
    } // watch
  });

  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  if(process.env.ANDPARTNERS_ENV==='production' || grunt.option('production')) {
    grunt.loadNpmTasks('grunt-sass');
  }
  else {
    grunt.loadNpmTasks('grunt-contrib-sass');
  }
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.registerTask('generate', function() {
    var d = new Date(),
        data = {
          PRODUCTION: grunt.option('production'),
          PUBDATE: d.toISOString(),
          TIMESTAMP: d.getTime(),
          metadata: {
            'index': _.fromPairs(grunt.file.readJSON('./src/data/metadata.json').map(function(x) { return [x.property, x.content]; })),
          },
          projects: {
            'index': _.sortBy(_.filter(grunt.file.readJSON('./src/data/projects.json'), 'spotlight'), ['spotlight']),
          },
          sections: grunt.file.readJSON('./src/data/sections.json'),
        };
        

    grunt.config.set('timestamp', d.getTime());

    const tweakSections = (sections) => {
      Object.entries(sections).forEach(section => {
        var k = section[0],
            v = section[1];
        if(v.widget) {
          sections[k][v.widget] = true;
        }
      });
      return sections;  
    }; 

    grunt.file.expand([
      'src/templates/partials/*.hbs'
    ]).forEach(function(f) {
      var name = f.replace(/.*\/(.*)\.hbs$/, "$1");
      Handlebars.registerPartial(name, grunt.file.read(f));
    });
  
    grunt.file.expand([
      'src/templates/views/*.hbs'
    ]).forEach(function(f) {
      var name = f.replace(/.*\/(.*)\.hbs$/, "$1");
      var template = Handlebars.compile(grunt.file.read(f));
      data.page = name;
      data.sections[name] == tweakSections(data.sections[name]);
      data.metadata[name]['og:pubdate'] = data.PUBDATE;
      grunt.file.write(`${name}.html`, template(data));
    });
  });
  
  // Register Default task(s)
  grunt.registerTask('collect', ['clean', 'copy', 'generate', 'sass', 'autoprefixer', 'browserify']);
  grunt.registerTask('build', ['collect']);
  grunt.registerTask('dev', ['collect', 'connect:dev', 'watch']);
  console.log('\n');

}; // export