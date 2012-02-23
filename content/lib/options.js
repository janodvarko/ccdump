/* See license.txt for terms of usage */

define([
    "lib/trace"
],
function(FBTrace) {

// ********************************************************************************************* //
// Constants

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var prefTypeMap = (function()
{
    var map = {}, br = Ci.nsIPrefBranch;
    map["string"] = map[br.PREF_STRING] = "CharPref";
    map["boolean"] = map[br.PREF_BOOL] = "BoolPref";
    map["number"] = map[br.PREF_INT] = "IntPref";
    return map;
})();

// Module object
var Options = {};

// ********************************************************************************************* //
// Firefox Preferences

Options.prefDomain = "extensions.ccdump.";

Options.getPref = function(prefDomain, name)
{
    var prefName;
    if (name == undefined)
        prefName = this.prefDomain + prefDomain;
    else
        prefName = prefDomain + "." + name;

    var prefs = Services.prefs;

    var type = prefTypeMap[prefs.getPrefType(prefName)];
    if (type)
        var value = prefs["get" + type](prefName);

    return value;
}

Options.setPref = function(name, value)
{
    var prefName = this.prefDomain + name;
    var prefs = Services.prefs;

    var type = prefTypeMap[typeof value];
    if (type)
        value = prefs["set" + type](prefName, value);

    return value;
}

Options.tooglePref = function(name)
{
    var prefName = this.prefDomain + name;
    var prefs = Services.prefs;

    var type = prefTypeMap[prefs.getPrefType(prefName)];
    FBTrace.sysout("type " + type);
    if (type != "BoolPref")
        return;

    var value = this.getPref(name);
    this.setPref(name, !value);
}

Options.initPref = function(name, value)
{
    var currValue = this.getPref(name);
    if (typeof currValue == "undefined")
        currValue = this.setPref(name, value);

    return currValue;
}

// ********************************************************************************************* //

return Options;

// ********************************************************************************************* //
});

