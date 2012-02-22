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
    "analyzer"
],
function(TabView, Lib, FBTrace, HomeTab, RootsTab, DocsTab, AboutTab, Analyzer) {
with (Domplate) {

// ********************************************************************************************* //
// Main Application Object

function MainView()
{
    this.id = "mainView";

    this.analyzer = new Analyzer();

    // Append tabs
    this.appendTab(new HomeTab());
    this.appendTab(new RootsTab());
    //this.appendTab(new DocsTab());
    this.appendTab(new AboutTab());
}

MainView.prototype = Lib.extend(new TabView(),
{
    initialize: function()
    {
        this.content = document.getElementById("content");
        this.content.repObject = this;

        this.render(this.content);
        this.selectTabByName("About");

        // Listeners
        this.shutdownListener = this.shutdown.bind(this);
        this.onNavigateListener = this.onNavigate.bind(this);

        window.addEventListener("unload", this.shutdownListener, false);
        this.content.addEventListener("navigate", this.onNavigateListener, false);
    },

    shutdown: function()
    {
        window.removeEventListener("unload", this.shutdownListener, false);
        this.content.removeEventListener("navigate", this.onNavigateListener, false);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    onNavigate: function(event)
    {
        if (!event.target)
            return;

        // Set current selection
        this.currentObject = event.target.repObject;

        // Switch tabs
        var rootsTab = this.getTab("Roots");
        rootsTab.invalidate();
        rootsTab.select();
    }
});

// ********************************************************************************************* //
// Initialization

new MainView().initialize(content);
FBTrace.sysout("about:ccdump loaded");

// ********************************************************************************************* //
}});
