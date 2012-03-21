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

// ********************************************************************************************* //
// Serializer

var GraphSerializer =
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // File Save Dialog 

    saveToFile: function(callback)
    {
        try
        {
            var nsIFilePicker = Ci.nsIFilePicker;
            var fp = Cc["@mozilla.org/filepicker;1"].getService(nsIFilePicker);
            fp.init(window, null, nsIFilePicker.modeSave);
            fp.appendFilter("Cycle Collector Logs","*.log;");
            fp.appendFilters(nsIFilePicker.filterAll);
            fp.filterIndex = 1;
            fp.defaultString = "cc-edges.log";

            var rv = fp.show();
            if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace)
            {
                var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
                    .createInstance(Ci.nsIFileOutputStream);
                foStream.init(fp.file, 0x02 | 0x08 | 0x20, 0666, 0); // write, create, truncate

                var text = callback();
                if (!text)
                    return;

                foStream.write(text, text.length);
                foStream.close();
            }
        }
        catch (err)
        {
            FBTrace.sysout("serializer; saveToFile EXCEPTION " + err, err);
        }
    },

    loadFromFile: function(analyzer)
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

            var inputStream = Cc["@mozilla.org/network/file-input-stream;1"]
                .createInstance(Ci.nsIFileInputStream);
            inputStream.init(fp.file, -1, -1, 0); // read-only

            var sis = Cc["@mozilla.org/scriptableinputstream;1"].
                createInstance(Ci.nsIScriptableInputStream);
            sis.init(inputStream);

            var jsonString = sis.readBytes(inputStream.available());
            return this.parseFromJSON(jsonString, analyzer);
        }
        catch (err)
        {
            FBTrace.sysout("serializer; saveToFile EXCEPTION " + err, err);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Serialize

    serializeObject: function(o)
    {
        var s = "";
        if (o.refcount)
        {
            s += o.address + " [rc=" + o.refcount + "] " +
                (o.garbage ? "garbage " : "") +
                (o.root ? "root " : "") +
                o.name;
        }
        else
        {
            s += o.address +
                " [gc" + (o.gcmarked ? ".marked" : "") + "] " +
                (o.garbage ? "garbage " : "") +
                (o.root ? "root " : "") +
                o.name;    
        }

        return s;
    },

    serializeGraph: function(graph)
    {
        var s = "";
        for (var o in graph)
            s += this.serializeObject(o) + "\n" + this.getEdges(o);
        return s;
    },

    getEdges: function(o)
    {
        var s = "";
        for (var i=0; i<o.edges.length; i++)
        {
            var e = o.edges[i];
            s += "    > " + e.to.address + " " + e.name + "\n";
        }
        return s;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // JSON

    toJSON: function(analyzer)
    {
        var log = {};
        log.graph = {};
        for (var o in analyzer.graph)
        {
            var obj = o.clone();
            log.graph[obj.address] = obj;

            var edges = obj.edges;
            for (var i=0; i<obj.edges.length; i++)
            {
                var edge = obj.edges[i];
                obj.edges[i] = {
                    name: edge.name,
                    to: edge.to.address
               }
            }

            var owners = obj.owners;
            for (var i=0; i<obj.owners.length; i++)
            {
                var owner = obj.owners[i];
                owner.from = owner.from.address;
            }

        }

        log.roots = [];
        for (var i=0; i<analyzer.roots.length; i++)
        {
            var o = analyzer.roots[i];
            log.roots.push(o.address);
        }

        log.garbage = [];
        for (var i=0; i<analyzer.garbage.length; i++)
        {
            var o = analyzer.garbage[i];
            log.garbage.push(o.address);
        }

        log.edges = [];
        for (var i=0; i<analyzer.edges.length; i++)
        {
            var o = analyzer.edges[i];
            log.edges.push({
                name: o.name,
                from: o.from.address,
                to: o.to.address
            });
        }

        return JSON.stringify(log, null, "  ");
    },

    parseFromJSON: function(jsonString, analyzer)
    {
        analyzer.clear();

        var log = JSON.parse(jsonString);
        for (var o in log.graph)
        {
            var obj = analyzer.ensureObject(o.address);
            for (p in o)
                obj[p] = o[p];

            var edges = obj.edges;
            for (var i=0; i<obj.edges.length; i++)
            {
                var edge = obj.edges[i];
                edge.to = analyzer.ensureObject(edge.to);
            }

            var owners = obj.owners;
            for (var i=0; i<obj.owners.length; i++)
            {
                var owner = obj.owners[i];
                owner.from = analyzer.ensureObject(owner.from);
            }
        }

        for (var i=0; i<log.roots.length; i++)
        {
            var o = log.roots[i];
            analyzer.roots.push(analyzer.ensureObject(o));
        }

        for (var i=0; i<log.garbage.length; i++)
        {
            var o = log.garbage[i];
            analyzer.garbage.push(analyzer.ensureObject(o));
        }

        for (var i=0; i<log.edges.length; i++)
        {
            var o = log.edges[i];
            analyzer.edges.push({
                name: o.name,
                from: analyzer.ensureObject(o.from),
                to: analyzer.ensureObject(o.to)
            });
        }

        return analyzer;
    }
}

// ********************************************************************************************* //

return GraphSerializer;

// ********************************************************************************************* //
});
