/* See license.txt for terms of usage */

define([
    "lib/trace",
    "app/analyzer"
],
function(FBTrace, Analyzer) {

// ********************************************************************************************* //
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
    .createInstance(Ci.nsIScriptableUnicodeConverter);
converter.charset = "UTF-8";

// ********************************************************************************************* //
// Serializer

function GCLogLoader(analyzer)
{
    this.analyzer = analyzer;
}

GCLogLoader.prototype =
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // File Open Dialog 

    loadFromFile: function()
    {
        try
        {
            var nsIFilePicker = Ci.nsIFilePicker;
            var fp = Cc["@mozilla.org/filepicker;1"].getService(nsIFilePicker);
            fp.init(window, null, nsIFilePicker.modeOpen);
            fp.appendFilter("Cycle Collector Logs","*.log;");
            fp.appendFilters(nsIFilePicker.filterAll);
            fp.filterIndex = 1;

            var rv = fp.show();
            if (rv != nsIFilePicker.returnOK)
                return;

            this.fis = Cc["@mozilla.org/network/file-input-stream;1"]
                .createInstance(Ci.nsIFileInputStream);
            this.fis.init(fp.file, -1, -1, 0); // read-only

            this.parent = null;

            this.lis = this.fis.QueryInterface(Ci.nsILineInputStream);
            this.readFile();
        }
        catch (err)
        {
            FBTrace.sysout("serializer; saveToFile EXCEPTION " + err, err);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    readFile: function()
    {
        // Process entire heap step by step in 20K chunks
        for (var i=0; i<20000; i++)
        {
            var lineData = {};
            var cont = this.lis.readLine(lineData);
            var line = converter.ConvertToUnicode(lineData.value);

            // Parse line
            var obj = this.parseLine(line, this.parent);
            if (obj)
                this.parent = obj;

            // If last line has been parsed, bail out.
            if (!cont)
                return this.onFinished();
        }

        this.onProgress();

        // Next chunk on timeout.
        setTimeout(this.readFile.bind(this), 125);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    onProgress: function()
    {
        this.analyzer.callback.onProgress.call(this.analyzer.callback, this.analyzer);
    },

    onFinished: function()
    {
        this.analyzer.callback.onFinished.call(this.analyzer.callback, this.analyzer);
        this.fis.close();
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Parser

    parseLine: function(line, parent, analy)
    {
        var parts = line.split(" ");

        // If the line begins with ">" it represents a child property
        var child = false;
        if (parts[0] == ">")
        {
            child = true;
            parts.shift();
        }

        var address = parts.shift();
        var o = this.analyzer.ensureObject(address);
        o.address = address;

        // Get object name
        if (parts.length == 3)
            o.name = parts[1];
        else if (parts.length > 3)
            o.name = "[" + parts[1] + "] " + parts[2];

        if (child)
        {
            parent.edges.push({name: "prop", to: o});
            o.owners.push({name: "parent", from: parent});
        }

        this.analyzer.edges.push({
            name: "property",
            from: parent,
            to: o
        });

        return child ? null : o;
    },
}

// ********************************************************************************************* //

return GCLogLoader;

// ********************************************************************************************* //
});
