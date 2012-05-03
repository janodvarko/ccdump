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
        this.fis.close();
        this.analyzer.callback.onFinished.call(this.analyzer.callback, this.analyzer);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Parser

    parseLine: function(line, parent)
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

        // The B indicates that the object has been marked black by the GC, which means that
        // it was reachable from a JS root, like a stack variable, or that the cycle collector
        // optimizations have decided it is definitely alive, for instance, if it is reachable
        // from a DOM that is currently being displayed.  Another possibility is G (gray),
        // which means it is reachable from an XPConnect root, but hasn't been marked black,
        // and W (white) which means an object has been allocated since the last GC.
        // http://groups.google.com/group/mozilla.dev.platform/browse_thread/thread/593ad331506c3d20?hl=en#
        var flag = parts.shift();

        // Get object name
        o.name = parts.join(" ");

        if (child)
        {
            parent.edges.push({name: o.name, to: o});
            o.owners.push({name: parent.name, from: parent});
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
