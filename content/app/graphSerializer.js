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

            FBTrace.sysout("length " + inputStream.available())
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
        for each (var o in graph)
            s += this.serializeObject(o) + "\n" + this.getEdges(o);
        return s;
    },

    getEdges: function(o)
    {
        var s = "";
        for each (var e in o.edges)
            s += "    > " + e.to.address + " " + e.name + "\n";
        return s;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // JSON

    toJSON: function(analyzer)
    {
        var log = {};
        log.graph = {};
        for each (var o in analyzer.graph)
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
        for each (var o in analyzer.roots)
            log.roots.push(o.address);

        log.garbage = [];
        for each (var o in analyzer.garbage)
            log.garbage.push(o.address);

        log.edges = [];
        for each (var o in analyzer.edges)
        {
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
        FBTrace.sysout("log", log);
        for each (var o in log.graph)
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

        for each (var o in log.roots)
            analyzer.roots.push(analyzer.ensureObject(o));

        for each (var o in log.garbage)
            analyzer.garbage.push(analyzer.ensureObject(o));

        for each (var o in log.edges)
        {
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
