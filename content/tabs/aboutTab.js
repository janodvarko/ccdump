/* See license.txt for terms of usage */

define([
    "lib/domplate",
    "lib/lib",
    "lib/trace",
    "lib/tabView",
],
function(Domplate, Lib, FBTrace, TabView) { with (Domplate) {

// ********************************************************************************************* //
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

var pageUrl = "resource://ccdump/content/tabs/aboutTab.html";

// ********************************************************************************************* //
// Home Tab

function AboutTab() {}
AboutTab.prototype = Lib.extend(TabView.Tab.prototype,
{
    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Tab

    id: "About",
    label: "About",

    bodyTag:
        DIV({"class": "aboutBody"}),

    tabHeaderTag:
        A({"class": "$tab.id\\Tab tab", view: "$tab.id", _repObject: "$tab"},
            "$tab.label",
            SPAN("&nbsp;"),
            SPAN({"class": "version"},
                "$tab.tabView.version"
            )
        ),

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Content

    onUpdateBody: function(tabView, body)
    {
        var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var channel = ioService.newChannel(pageUrl, null, null);
        var input = channel.open();

        var sis = Cc["@mozilla.org/scriptableinputstream;1"].
            createInstance(Ci.nsIScriptableInputStream);
        sis.init(input);

        body.innerHTML = sis.readBytes(input.available());

        sis.close();
    },
});

// ********************************************************************************************* //

return AboutTab;

// ********************************************************************************************* //
}});
