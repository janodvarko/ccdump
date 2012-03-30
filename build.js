/* See license.txt for terms of usage */

// ********************************************************************************************* //
// Dryice Build File

var copy = require("dryice").copy;
var fs = require("fs");
var os = require("os");
var spawn = require("child_process").spawn;
var shell = require("shelljs");

// ********************************************************************************************* //

// Helper for the target release directory.
var release = __dirname + "/release";

// Remove target release directory (if there is one left from the last time)
shell.rm("-rf", "release");

// Create target content directory.
copy.mkdirSync(release + "/content", 0755);

// Copy all html files into the target dir.
copy({
    source: {
        root: __dirname + "/content",
        include: [/.*\.html$/]
    },
    dest: release + "/content"
});

// Copy Dryice mini-loader.
copy({
  source: [ copy.getMiniRequire() ],
  dest: release + "/content/loader.js"
});

// Common JS project dependency tracking.
var project = copy.createCommonJsProject({
  roots: [ __dirname + "/content" ]
});

// Munge define lines to add module names
function moduleDefines(input, source)
{
    input = (typeof input !== "string") ? input.toString() : input;

    var deps = source.deps ? Object.keys(source.deps) : [];
    deps = deps.length ? (", '" + deps.join("', '") + "'") : "";

    var module = source.isLocation ? source.path : source;
    module = module.replace(/\.js$/, "");

    return input.replace(/define\(\[/, "define('" + module + "', [");
};
moduleDefines.onRead = true;

// Copy all modules into one big module file -> /content/main.js
// Use 'moduleDefins' filter that provides module ID for define functions
copy({
    source: [
        {
            project: project,
            require: [
                "lib/tabView", "lib/lib", "lib/trace", "tabs/homeTab", "tabs/aboutTab",
                "app/analyzer", "app/tabNavigator", "lib/options",
            ]
        },
        __dirname + "/content/main.js"
    ],
    filter: moduleDefines,
    dest: release + "/content/main.js"
});

// Helper log of module dependencies
console.log(project.report());

// Compress main.js file (all extension modules)
copy({
    source: release + "/content/main.js",
    filter: copy.filter.uglifyjs,
    dest: release + "/content/main.js"
});

// Create target skin dir and copy all styles and images files.
copy.mkdirSync(release + "/skin", 0755);
copy({
    source: {
        root: __dirname + "/skin",
        include: [/.*\.css$/, /.*\.gif$/, /.*\.png$/]
    },
    dest: release + "/skin"
});

// Copy other files that are not part of the content dir.
copy({
  source: ["bootstrap.js", "license.txt", "README.md", "app.properties"],
  dest: release
});

// Read version number from package.json file and update install.rdf
var packageFile = fs.readFileSync(__dirname + "/package.json", "utf8");
var version = JSON.parse(packageFile).version;
copy({
    source: ["install.rdf"],
    filter: function(data)
    {
        return data.toString().replace(/@VERSION@/, version);
    },
    dest: release
});

// Compute name of the XPI package
var xpiFileName = "ccdump-" + version + ".xpi";

// Create final XPI package.
var zip;
if (os.platform() === "win32")
{
    var params = "a -tzip ../" + xpiFileName + " skin content bootstrap.js license.txt " +
        "README.md install.rdf app.properties";
    zip = spawn("7z.exe", params.split(" "), { cwd: release });
}
else
{
    zip = spawn("zip", [ "-r", __dirname + "/" + xpiFileName, release ]);
}

// As soon as the XPI is created (asynchronously) remove the release directory.
zip.on("exit", function()
{
    shell.rm("-rf", "release");
});

// ********************************************************************************************* //
