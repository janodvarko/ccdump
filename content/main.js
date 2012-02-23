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
],
function(TabView, Lib, FBTrace, HomeTab, RootsTab, DocsTab, AboutTab, Analyzer, TabNavigator) {
with (Domplate) {

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
