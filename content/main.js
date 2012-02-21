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
    "analyzer"
],
function(TabView, Lib, FBTrace, HomeTab, RootsTab, DocsTab, Analyzer) { with (Domplate) {

// ********************************************************************************************* //

function MainView()
{
    this.id = "mainView";

    this.analyzer = new Analyzer();

    // Append tabs
    this.appendTab(new HomeTab());
    this.appendTab(new RootsTab());
    this.appendTab(new DocsTab());
}

MainView.prototype = Lib.extend(new TabView(),
{
    initialize: function(content)
    {
        this.render(content);
        this.selectTabByName("Home");
    },
});

// ********************************************************************************************* //
// Initialization

var content = document.getElementById("content");
var mainView = content.repObject = new MainView();
mainView.initialize(content);

FBTrace.sysout("about:ccdump loaded");

// ********************************************************************************************* //
}});
