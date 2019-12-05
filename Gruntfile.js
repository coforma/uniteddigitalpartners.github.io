module.exports = function(grunt) {

  var colors = require('colors'),
      _ = require('lodash'),
      pkg = grunt.file.readJSON('package.json'),
      basePath = '/';

  const Handlebars = require('Handlebars');
  const Entities = require('html-entities').AllHtmlEntities;
  const entities = new Entities();
  const md = require('markdown-it')({
    html: true,
    breaks: true,
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

  Handlebars.registerHelper({
    and: function() {
      for(var i=0, len=arguments.length-1; i<len; i++) {
        if(!arguments[i]) {
          return false;
        }
      }
      return true;
    },
    empty: function(obj) {
      return Object.keys(obj).length===0;
    },
    eq: function(v1, v2) {
      return v1 === v2;
    },
    gt: function(v1, v2) {
      return v1 > v2;
    },
    in: function(haystack, needle) {
      if(typeof haystack!=='object') {
        return false;
      }
      if(Array.isArray(haystack)) {
        return haystack.indexOf(needle)>=0;
      }
      else {
        return Object.keys(haystack).indexOf(needle)>=0;
      }
    },
    is_a: function(obj, objType) {
      switch(objType) {
        case 'array':
          return Array.isArray(obj);
        case 'range':
          return (Array.isArray(obj) && obj.length===2 && Number.isFinite(obj[0]) && Number.isFinite(obj[1]));
        default:
          return (typeof obj===objType || obj===objType);
      }
    },
    lt: function(v1, v2) {
      return v1 < v2;
    },
    lte: function(v1, v2) {
      return v1 <= v2;
    },
    gte: function(v1, v2) {
      return v1 >= v2;
    },
    ne: function(v1, v2) {
      return v1 !== v2;
    },
    not: function() {
      for(var i=0, len=arguments.length-1; i<len; i++) {
        if(arguments[i]) {
          return false;
        }
      }
      return true;
    },
    or: function() {
      for(var i=0, len=arguments.length-1; i<len; i++) {
        if(arguments[i]) {
          return true;
        }
      }
      return false;
    }
  }); // operators

  grunt.initConfig({
    pkg: pkg,
    timestamp: new Date().getTime(),
    meta: {
      dir: {
        assets: './assets',
        sass: './src/styles',
        scripts: './src/scripts',
      }
    }, // meta

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
      './assets/bundled.<%=timestamp%>.js': ['<%=meta.dir.scripts%>/script.js'],
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
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('bump', 'Bumps a project\'s version number up across relevant files.', function(version) {

    var currentVersion = grunt.config('pkg').version;

    switch(version) {
      case 'check':
        console.log('\nThe current version is ' + colors.cyan.bold(currentVersion) + '.');
        return;
      case 'patch':
        version = currentVersion.replace(/([0-9]+)$/, function(match, capture) {
          return +capture + 1;
        });
        break;
      case 'minor':
        version = currentVersion.replace(/(\d+)\.\d+$/, function(match, capture) {
          return (+capture + 1) + '.0';
        });
        break;
      case 'major':
        version = currentVersion.replace(/^(\d+)\.\d+\.\d+/, function(match, capture) {
          return (+capture + 1) + '.0.0';
        });
        break;
      default:
        break;
    }

    if(!/\d+\.\d+\.\d+/.test(version)) {
      grunt.fail.fatal('\n\nYou need to specify a valid version number!\n\nThe current version is: ' + colors.yellow.bold(currentVersion) + '\n');
    }

    console.log('\nOK! Moving the needle from ' + colors.cyan.bold(currentVersion) + ' to ' + colors.cyan.bold(version) + '.');

    grunt.file.expand([
      'package.json'
    ]).forEach(function(f) {
      var json = grunt.file.readJSON(f);
      json.version = version;
      grunt.file.write(f, JSON.stringify(json, null, 2));
    });
  }); // bump


  grunt.registerTask('version', function() {
    grunt.file.write('VERSION', pkg.version);
  });


  grunt.registerTask('generate', function(production) {

    var d = new Date(),
        data = {
          PRODUCTION: production ? true : false,
          PUBDATE: d.toISOString(),
          TIMESTAMP: d.getTime(),
          metadata: _.fromPairs(grunt.file.readJSON('./src/data/metadata.json').map(function(x) { return [x.property, x.content]; })),
          projects: _.sortBy(_.filter(grunt.file.readJSON('./src/data/projects.json'), 'spotlight'), ['spotlight']),
          sections: grunt.file.readJSON('./src/data/sections.json'),
        },
        template = Handlebars.compile(grunt.file.read('src/templates/index.hbs'));

    grunt.config.set('timestamp', d.getTime());

    data.metadata['og:pubdate'] = data.PUBDATE;

    grunt.file.expand([
      'src/templates/partials/*.hbs'
    ]).forEach(function(f) {
      var name = f.replace(/.*\/(.*)\.hbs$/, "$1");
      Handlebars.registerPartial(name, grunt.file.read(f));
    });

    grunt.file.write('index.html', template(data));

  });


  var defaultTasks = grunt.option('bump') ? ['bump:patch', 'collect', 'watch'] : ['collect', 'watch'];

  // Register Default task(s)
  grunt.registerTask('collect', ['clean', 'copy', 'generate', 'sass', 'autoprefixer', 'browserify']);
  grunt.registerTask('build', ['collect', 'version']);
  grunt.registerTask('default', defaultTasks);
  console.log('\n');

};