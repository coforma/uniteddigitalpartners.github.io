# United Digital Partners

#### uniteddigitalpartners.github.io

### Getting Started

Clone this repo and check out the `development` branch;

Next, install dependencies using [npm](https://www.npmjs.com):
```
$ npm install
```
Then use [grunt](https://http://gruntjs.com/) to generate the code:
```
$ grunt
```
If you're ready to commit a new version of the code, use the `grunt:bump` task to move the needle:
```
$ grunt bump:patch
```
or
```
$ grunt bump:minor
```


### Publishing

I'll get to this tomorrow, but in a nutshell:
```
$ scripts/build
$ git push --force origin latest:master
```

### Running locally

```
$ python -m SimpleHTTPServer
```

