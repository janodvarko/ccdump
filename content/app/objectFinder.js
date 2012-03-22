/* See license.txt for terms of usage */

define([
    "lib/trace",
    "lib/options"
],
function(FBTrace, Options) {

// ********************************************************************************************* //
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

// ********************************************************************************************* //
// Cycle Collector Analyzer (listener)

function ObjectFinder(graph)
{
    this.graph = graph;
}

ObjectFinder.prototype =
{
    findObjects: function(text, caseSensitive, useRegExp)
    {
        if (!text)
            return null;

        if (!caseSensitive && !useRegExp)
            text = text.toLowerCase();

        var regex = new RegExp(text);

        var result = [];
        for (var address in this.graph)
        {
            var o = this.graph[address];
            var name = o.name;
            var address = o.address;

            if (!caseSensitive && !useRegExp)
            {
                name = name.toLowerCase();
                address = address.toLowerCase();
            }

            if (useRegExp)
            {
                if (name.match(regex))
                    result.push(o);
                else if (address.match(regex))
                    result.push(o);
            }
            else
            {
                if (name.indexOf(text) >= 0 || address.indexOf(text) >= 0)
                    result.push(o);
            }
        }

        return result.length ? result : null;
    },
}

// ********************************************************************************************* //

return ObjectFinder;

// ********************************************************************************************* //
});
