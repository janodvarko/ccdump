
var copy = require('dryice').copy;
var fs = require('fs');
var os = require('os');
var spawn = require('child_process').spawn;

var release = __dirname + '/release';
copy.mkdirSync(release + '/content', 0755);
copy({
  source: {
    root: __dirname + '/content',
    include: [ /.*\.js$/, /.*\.html$/ ]
  },
  dest: release + '/content'
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
  source: [ 'bootstrap.js', 'license.txt', 'README.md' ],
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

if (os.platform() === 'win32') {
  var params = 'a ccdump.xpi skin content bootstrap.js license.txt README.md install.rdf';
  spawn('7z.exe', [ params.split(' ') ], { cwd: release });
}
else {
  spawn('zip', [ '-r', __dirname + '/ccdump.xpi', release ]);
}
