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
    "tabs/aboutTab",
    "analyzer",
    "tabNavigator",
    "lib/options",
],
function(TabView, Lib, FBTrace, HomeTab, AboutTab, Analyzer, TabNavigator, Options) {
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

        // Initialize default preferences (only has an effect if the pref isn't already set)
        // The default pref domain is: "extensions.ccdump."
        Options.initPref("search.tableLayout", true);
        Options.initPref("search.caseSensitive", false);
        Options.initPref("search.useRegExp", false);
        Options.initPref("traceAll", false);
        Options.initPref("tableViewLimit", 500);

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

try
{
    var mainView = new MainView().initialize(content);
}
catch (err)
{
    FBTrace.sysout("EXCEPTION " + err, err);
}

// ********************************************************************************************* //
}});
