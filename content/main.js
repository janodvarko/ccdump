/* See license.txt for terms of usage */

// ********************************************************************************************* //

var config = {};
config.baseUrl = "resource://ccdump/content";

// Application entry point.
require(config, [
    "lib/tabView",
    "lib/lib",
    "lib/trace",
    "tabs/homeTab",
    "tabs/rootsTab",
    "tabs/docsTab",
    "tabs/aboutTab",
    "analyzer",
    "tabNavigator",
    "lib/options",
],
function(TabView, Lib, FBTrace, HomeTab, RootsTab, DocsTab, AboutTab, Analyzer,
    TabNavigator, Options) {
with (Domplate) {

// ********************************************************************************************* //
// Application preferences

// extensions.ccdump.traceAll [boolean] - if true CC graph doesn't use optimization and a lot more
//                                      objects is included.
//
// extensions.ccdump.search.caseSensitive [boolean] - if true, search in the graph is
//                                       case sensitive.
//
// extensions.ccdump.search.tableLayout [boolean] - if true, search results use table layout
//                                      otherwise tree lyaout is used.

// ********************************************************************************************* //
// Main Application Object

function MainView()
{
    this.id = "mainView";

    this.analyzer = new Analyzer();

    // Append tabs
    this.appendTab(new HomeTab());
    this.appendTab(new AboutTab());
}

MainView.prototype = Lib.extend(new TabView(),
{
    initialize: function()
    {
        this.content = document.getElementById("content");
        this.content.repObject = this;

        this.render(this.content);
        this.selectTabByName("Home");

        // Support for navigation among application tabs.
        TabNavigator.initialize(this);

        // Initialize default preferences (only has an effect if the pref isn't already set)
        Options.initPref("search.tableLayout", true);
        Options.initPref("search.caseSensitive", false);
        Options.initPref("traceAll", false);

        // Shutdown listener
        this.shutdownListener = this.shutdown.bind(this);
        window.addEventListener("unload", this.shutdownListener, false);
    },

    shutdown: function()
    {
        window.removeEventListener("unload", this.shutdownListener, false);

        TabNavigator.shutdown();
    },
});

// ********************************************************************************************* //
// Initialization

new MainView().initialize(content);
FBTrace.sysout("about:ccdump loaded");

// ********************************************************************************************* //
}});
