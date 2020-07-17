/* jshint browser: true */
/* global _, moment */
'use strict';

var _ = require('lodash'),
    handlebars = require('hbsfy/runtime');

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

var DATE_FORMATS = {
  // for date and time format options, see: http://momentjs.com/docs/#/displaying/format/
  DATE: 'MMM D, YYYY',                        // Jan 1, 2015
  DATEFULL: 'dddd, MMMM D, YYYY',             // Thursday, January 1, 2015
  DATELONG: 'MMMM D, YYYY',                   // January 1, 2015
  DATESHORT: 'MMM D YYYY',                    // Jan 1 2015
  FIELD: 'YYYY-MM-DD',                        // 2015-01-01
  TIME: 'h:mma',                              // 4:30pm
  DATETIME: 'MMM D, YYYY h:mma',              // Jan 1, 2015 4:30pm
  DATETIMEFULL: 'dddd, MMMM D, YYYY h:mma',   // Thursday, January 1, 2015 4:30pm
  DATETIMELONG: 'MMMM D, YYYY h:mma',         // January 1, 2015 4:30pm
  DATETIMESHORT: 'MMM D YYYY h:mma',          // Jan 1 2015 4:30pm
  DATETIMEISO: 'YYYY-MM-DDTHH:mm',            // 2015-01-01T16:30 (useful for the datetime attr of the <time> element, for ex)
  FROMNOW: 'FROMNOW'                          // this is stupid but it makes the code below simpler :)
};

handlebars.registerHelper('check', function(x) {
  console.log('Check:', x);
});

handlebars.registerHelper({

  encode: function(str) {
    return entities.encode(str)
  }, // encode

  reformat: function(data) {
    if(!data) { return []; }
    var lines = data.split(/\n/gim),
        formatted = [],
        list = false;

    lines.forEach(function(line, i) {
      if(line.indexOf(' *')===0) {

        if(!list) {
          list = true;
          formatted.push({
            tag: 'li',
            text: line.substr(2),
            openList: true
          });
        }
        else {
          formatted.push({
            tag: 'li',
            text: line.substr(2)
          });
        }
      }
      else {
        if(list) {
          list = false;
          formatted[formatted.length-1].closeList = true;
        }
        formatted.push({
          tag: 'p',
          text: line
        });
      }
    });
    return formatted;
  }, // reformat

}); // reformat

handlebars.registerHelper({
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


handlebars.registerHelper({
  switch: function(value, options) {
    options._switch_value_ = value;
    options._switch_break_ = false;
    return options.fn(options);
  },
  case: function() {
    var args = Array.prototype.slice.call(arguments);
    var options = args.pop();
    var caseValues = args;
    
    if(this._switch_break_ || caseValues.indexOf(this._switch_value_) === -1) {
      return '';
    }
    else {
      if(options.hash.break === true) {
        this._switch_break_ = true;
      }
      return options.fn(this);
    }
  },
  default: function(options) {
    if(!this._switch_break_) {
      return options.fn(this);
    }
  },
  switch_context: function(val) {
    return val;
  },

}); // switch


handlebars.registerHelper({
  // addHyphens
  addHyphens: function(str) {
    return str.replace(/\s/gim, '-');
  }, // addHyphens

  capitalize: function(str) {
    return _.capitalize(str);
  }, // capitalize

  commas: function(val) {
    return val.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, // commas

  // concat
  concat: function() {
    return Array.prototype.slice.call(arguments).filter(function(a) { return typeof a==='string' || typeof a==='number'; }).join('');
  }, // concat

  for: function(from, to, incr, block) {
    var accum = '';
    for(var i = from; i < to; i += incr) {
      accum += block.fn(i);
    }
    return accum;
  }, // for

  formatDate: function(args) {
    var f = 'MMM D, YYYY',
        d, limit;

    if(args.hash) {
      switch(typeof args.hash.datetime) {
        case 'string':
          d = moment(args.hash.datetime);
          break;
        case 'undefined':
          d = moment();
          break;
        default:
          d = args.hash.datetime;
          break;
      }
      if(args.hash.format) {
        f = args.hash.format;
      }
    }

    if(d.isValid()) {

      if(args.hash.add) {
        d.add(args.hash.add, 'days');
      }
      else if(args.hash.subtract) {
        d.add(args.hash.subtract, 'days');
      }

      if(args.hash.limit) { // limit the possible days of the week
        limit = args.hash.limit.split(',').map(Number);
        while(limit.indexOf(d.day())<0) {
          d.add(1, 'day');
        }
      }

      return d.format(f);
    }
    return '--';
  }, // formatDate

  // hyphenize
  hyphenize: function(str) {
    return _.kebabCase(str);
  }, // hyphenize

  join: function(arr, sep) {
    sep = typeof sep==='string' ? sep : ' ';
    return arr.join(sep);
  }, 

  // lowercase
  lowercase: function(str) {
    return _.toLower(str);
  }, // lowercase

  math: function(lvalue, operator, rvalue) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    return {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": lvalue * rvalue,
      "/": lvalue / rvalue,
      "%": lvalue % rvalue,
      '<': lvalue < rvalue,
      '>': lvalue > rvalue
    }[operator];
  }, 

  percent: function(v) {
    return (v * 100).toFixed(2) + '%';
  }, 

  // // pluralize
  // pluralize: function(str, num) {
  //   // return _.inflect.pluralize(str, num);
  //   return pluralize(str, num, true);
  // }, // pluralize

  random: function(min, max) {
    return _.random(min, max);
  }, // random

  reduce: function(set, prop) {
    var x = 0;
    set.forEach(function(i) {
      if(i[prop]) {
        x += i[prop].length;
      }
    });
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, // reduce

  // addHyphens
  removeHyphens: function(str) {
    return str.replace(/-/gim, ' ');
  }, // removeHyphens

  round: function(val, places) {
    return val.toFixed(places);
  }, // round

  // split
  split: function(str, sep) {
    return str.split(sep ? sep : /,\s*/g);
  }, // split

  times: function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  }, // times

  zpad: function(num, len) {
    var str = num.toString();
    while(str.length<len) {
      str = '0' + str;
    }
    return str;
  }, // zpad
});


module.exports = handlebars;
