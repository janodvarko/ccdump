
var copy = require('dryice').copy;
var fs = require('fs');
var os = require('os');
var spawn = require('child_process').spawn;
var shell = require('shelljs');

var release = __dirname + '/release';

shell.rm('-rf', 'release');

copy.mkdirSync(release + '/content', 0755);
copy({
  source: {
    root: __dirname + '/content',
    include: [ /.*\.html$/ ]
  },
  dest: release + '/content'
});

copy({
  source: [ 'content/loader.js' ],
  dest: release
});

copy({
  source: [
    {
      root: __dirname + '/content',
      exclude: [/loader.js/, /main.js/],
      include: [ /.*\.js$/ ]
    },
    __dirname + '/content/main.js'
  ],
  dest: release + '/content/main.js'
});

copy.mkdirSync(release + '/skin', 0755);
copy({
  source: {
    root: __dirname + '/skin',
    include: [ /.*\.css$/, /.*\.gif$/, /.*\.png$/ ]
  },
  dest: release + '/skin'
});

copy({
  source: [ 'bootstrap.js', 'license.txt', 'README.md', 'app.properties' ],
  dest: release
});

var packageFile = fs.readFileSync(__dirname + '/package.json', 'utf8');
var version = JSON.parse(packageFile).version;
copy({
  source: [ 'install.rdf' ],
  filter: function(data) {
    return data.toString().replace(/@VERSION@/, version);
  },
  dest: release
});

var zip;
if (os.platform() === 'win32') {
  var params = 'a -tzip ../ccdump.xpi skin content bootstrap.js license.txt README.md install.rdf app.properties';
  zip = spawn('7z.exe', params.split(' '), { cwd: release });
}
else {
  zip = spawn('zip', [ '-r', __dirname + '/ccdump.xpi', release ]);
}

zip.on("exit", function() {
  shell.rm('-rf', 'release');
});
