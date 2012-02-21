/* See license.txt for terms of usage */

define([
    "lib/trace"
],
function(FBTrace) {

// ********************************************************************************************* //
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

// ********************************************************************************************* //
// Serializer

var Serializer =
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // File Save Dialog 

    saveToFile: function(text)
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
                foStream.write(text, text.length);
                foStream.close();
            }
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
    }
}

// ********************************************************************************************* //

return Serializer;

// ********************************************************************************************* //
});
