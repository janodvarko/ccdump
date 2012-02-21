/* See license.txt for terms of usage */

define([], function() {

// ********************************************************************************************* //
// Constants

const Cu = Components.utils;

// ********************************************************************************************* //
// Tracing

try
{
    // Firebug tracing extension (FBTrace) must be installed
    var scope = {};
    Components.utils["import"]("resource://fbtrace/firebug-trace-service.js", scope);
    return scope.traceConsoleService.getTracer("extensions.firebug");
}
catch (e)
{
}

// ********************************************************************************************* //
// Empty implementation

var TraceAPI = ["dump", "sysout", "setScope", "matchesNode", "time", "timeEnd"];
var TraceObj = {};
for (var i=0; i<TraceAPI.length; i++)
    TraceObj[TraceAPI[i]] = function() {};

return TraceObj;

// ********************************************************************************************* //
});

