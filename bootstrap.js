/* See license.txt for terms of usage */

// ********************************************************************************************* //

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cm = Components.manager;

Cm.QueryInterface(Ci.nsIComponentRegistrar);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

const MY_URL = "resource://ccdump/";

// ********************************************************************************************* //
// Bootstrap API

var global = this;

function startup(aData, aReason)
{
    var resource = Services.io.getProtocolHandler("resource").
        QueryInterface(Ci.nsIResProtocolHandler);

    resource.setSubstitution("ccdump", aData.resourceURI);
    Cm.registerFactory(AboutCC.prototype.classID,
        AboutCC.prototype.classDescription,
        AboutCC.prototype.contractID,
        AboutCCFactory);
}

function shutdown(aData, aReason)
{
    if (aReason == APP_SHUTDOWN)
        return;

    var resource = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
    resource.setSubstitution("ccdump", null);
    Cm.unregisterFactory(AboutCC.prototype.classID, AboutCCFactory);
}

function install(aData, aReason)
{
    // xxxHonza: open about:ccdump for the first time?
}

function uninstall(aData, aReason)
{
}

// ********************************************************************************************* //
// about:ccdump

function AboutCC()
{
}

AboutCC.prototype =
{
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
    classDescription: "about:ccdump",
    classID: Components.ID("{D5889F72-0F01-4aee-9B88-FEACC5038C34}"),
    contractID: "@mozilla.org/network/protocol/about;1?what=ccdump",

    newChannel: function(uri)
    {
        // The module loader is synchronous so, make sure that the <div id="content">
        // is defined before main.js is included. This element represents the entire
        // application UI
        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var html = 'data:text/html,<!DOCTYPE html><html><head>\n'
            + '<link href="' + MY_URL + 'skin/classic/main.css" rel="stylesheet" type="text/css">\n'
            + '<script src="' + MY_URL + 'content/loader.js" type="application/javascript"></script>\n'
            + '</head><body>\n'
            + '<script type="application/javascript">'
            + 'var config = {'
            + '    baseUrl: "resource://ccdump/content"'
            + '}'
            + '</script>'
            + "<div id='content'></div>\n"
            + '<script src="' + MY_URL + 'content/main.js" type="application/javascript"></script>\n'
            + "</body></html>\n";

        var securityManager = Cc["@mozilla.org/scriptsecuritymanager;1"].
            getService(Ci.nsIScriptSecurityManager);

        var principal = securityManager.getSystemPrincipal();
        var channel = ioService.newChannel(html, null, null);
        channel.originalURI = uri;
        channel.owner = principal;

        return channel;
    },

    getURIFlags: function(uri)
    {
        return Ci.nsIAboutModule.ALLOW_SCRIPT;
    }
}

const AboutCCFactory = XPCOMUtils.generateNSGetFactory([AboutCC])(AboutCC.prototype.classID);

// ********************************************************************************************* //
