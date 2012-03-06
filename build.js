/* See license.txt for terms of usage */

// ********************************************************************************************* //

var copy = require("dryice").copy;

var ccDumpHome = __dirname;

// ********************************************************************************************* //
// Main

function main()
{
    var args = process.argv;
    if (args[2] === "web")
    {
        buildWeb();
    }
    else if (args[2] === "firefox")
    {
        buildFirefox(args[3]);
    }
    else if (args[2] === "serve")
    {
        serve();
    }
    else
    {
        console.log('Targets:');
        console.log('> node build.js web');
        console.log(' # Builds CCDump for the web to ./release');
        console.log('> node build.js firefox extension');
        console.log(' # Builds CCDump for firefox to ./release');
        console.log('> node build.js serve');
        console.log(' # Serve . to http://localhost:1324');
        process.exit(1);
  }
}

// ********************************************************************************************* //
// Build Logic

function buildWeb()
{
    copy({
        source: "license.txt",
        dest: "license2.txt"
    });
}

function buildFirefox()
{
    copy({
        source: "license.txt",
        dest: "license2.txt"
    });

    copy({
        source: ["license.txt", "license2.txt"],
        dest: "output.js"
    });

    console.log("Firefox extension built!");
}

// ********************************************************************************************* //
// Server

function serve()
{
    var connect = require("connect");
    var logger = connect.logger();
    var static = connect.static(ccDumpHome, { maxAge: 0 });

    console.log("Serving CCDump to http://localhost:1324/");
    connect(logger, static).listen(1324);
}

// ********************************************************************************************* //

main();

// ********************************************************************************************* //

