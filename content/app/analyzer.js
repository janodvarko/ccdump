/* See license.txt for terms of usage */

define([
    "lib/lib",
    "lib/trace",
    "lib/options"
],
function(Lib, FBTrace, Options) {

// ********************************************************************************************* //
// Constants

const Cc = Components.classes;
const Ci = Components.interfaces;

// ********************************************************************************************* //
// Cycle Collector Analyzer (listener)

var searchGeneration = 0;

function Analyzer()
{
}

Analyzer.prototype =
{
    isEmpty: function()
    {
        return !Lib.hasProperties(this.graph);
    },

    getSearchId: function()
    {
        return ++searchGeneration;
    },

    getObject: function(addr)
    {
        return this.graph[addr];
    },

    clear: function()
    {
        this.callback = null;
        this.processingCount = 0;
        this.graph = {};
        this.roots = [];
        this.garbage = [];
        this.edges = [];
        this.listener = null;
    },

    run: function(callback)
    {
        this.clear();

        this.callback = callback;

        this.listener = Cc["@mozilla.org/cycle-collector-logger;1"].
            createInstance(Ci.nsICycleCollectorListener);

        // Get much bigger graph (including objects that are usually optimized out)
        // if the preference says so.
        if (Options.getPref("traceAll"))
            this.listener.allTraces();

        this.listener.disableLog = true;
        this.listener.wantAfterProcessing = true;

        // Run CC three times to collect trash coming from this extension.
        this.runCC(3);
    },

    runCC: function(counter)
    {
        if (--counter >= 0)
        {
            window.QueryInterface(Ci.nsIInterfaceRequestor).
                getInterface(Ci.nsIDOMWindowUtils).garbageCollect();

            setTimeout(this.runCC.bind(this, counter), 125);
        }
        else
        {
            window.QueryInterface(Ci.nsIInterfaceRequestor).
                getInterface(Ci.nsIDOMWindowUtils).garbageCollect(this.listener);

            this.processLog();
        }
    },

    processLog: function()
    {
        // Process entire heap step by step in 5K chunks
        for (var i=0; i<5000; i++)
        {
            if (!this.listener.processNext(this))
            {
                this.callback.onFinished.call(this.callback, this);
                return;
            }
        }

        this.callback.onProgress.call(this.callback, this);

        // Next chunk on timeout.
        setTimeout(this.processLog.bind(this), 125);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // nsICycleCollectorHandler

    noteRefCountedObject: function(aAddress, aRefCount, aObjectDescription)
    {
        var o = this.ensureObject(aAddress);
        o.address = aAddress;
        o.refcount = aRefCount;
        o.name = aObjectDescription;
    },

    noteGCedObject: function(aAddress, aMarked, aObjectDescription)
    {
        var o = this.ensureObject(aAddress);
        o.address = aAddress;
        o.gcmarked = aMarked;
        o.name = aObjectDescription;
    },

    noteEdge: function(aFromAddress, aToAddress, aEdgeName)
    {
        var fromObject = this.ensureObject(aFromAddress);
        var toObject = this.ensureObject(aToAddress);
        fromObject.edges.push({name: aEdgeName, to: toObject});
        toObject.owners.push({name: aEdgeName, from: fromObject});

        this.edges.push({
            name: aEdgeName,
            from: fromObject,
            to: toObject
        });
    },

    describeRoot: function(aAddress, aKnownEdges)
    {
        var o = this.ensureObject(aAddress);
        o.root = true;
        o.knownEdges = aKnownEdges;
        this.roots.push(o);
    },

    describeGarbage: function(aAddress)
    {
        var o = this.ensureObject(aAddress);
        o.garbage = true;
        this.garbage.push(o);
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    ensureObject: function(aAddress)
    {
        if (!this.graph[aAddress])
            this.graph[aAddress] = new Analyzer.CCObject();

        return this.graph[aAddress];
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Graph Analysis

    getDocuments: function()
    {
        var result = [];
        for (var i = 0; i < this.graph.length; i++)
        {
            var o = this.graph[i];
            if (!o.garbage && o.name.indexOf("nsDocument ") >= 0)
                result.push(o);
        }
        return result;
    },

    getRoots: function()
    {
        var collectedRoots = {};
        for (var i = 0; i < this.roots.length; i++)
        {
            var o = this.roots[i];
            var res = [];
            this.getChildObjects(o, res, ++searchGeneration);
            collectedRoots[o.address] = res;
        }

        function biggerFirst(a, b)
        {
            a = collectedRoots[a];
            b = collectedRoots[b];
            if (a < b) return 1;
            if (a > b) return -1;
            return 0;
        }

        return collectedRoots;//Object.keys(collectedRoots).sort(biggerFirst);
    },

    getChildObjects: function (o, res, searchGen)
    {
        if (o._searchMark == searchGen || o.garbage)
            return;

        o._searchMark = searchGen;
        res.push(o);

        for (var i = 0; i < o.edges.length; i++) {
            var edge = o.edges[i];
            this.getChildObjects(edge.to, res, searchGen);
        }
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //

    findRoots: function(addr)
    {
        var o = this.graph[addr];
        if (!o)
            return null;

        var res = [];
        this.getRootObjects(o, res, ++searchGeneration);
        return res;
    },

    getRootObjects: function(o, res, searchGen, onlyRoots)
    {
        if (o._searchMark == searchGen || o.garbage)
            return;

        o._searchMark = searchGen;
        if (o.root)
            res.push(o);

        for (var i = 0; i < o.owners.length; i++) {
            var owner = o.owners[i];
            this.getRootObjects(owner.from, res, searchGen);
        }
    },

    findGraph: function(addr)
    {
        var o = this.graph[addr];
        if (!o)
            return null;

        var res = [];
        this.getObjectGraph(o, res, ++searchGeneration);
        return res;
    },

    getObjectGraph: function(o, res, searchGen)
    {
        if (o._searchMark == searchGen || o.garbage)
            return;

        o._searchMark = searchGen;
        res.push(o);

        for (var i = 0; i < o.edges.length; i++) {
            var edge = o.edges[i];
            this.getObjectGraph(edge.to, res, searchGen);
        }

        for (var i = 0; i < o.owners.length; i++) {
            var owner = o.owners[i];
            this.getObjectGraph(owner.from, res, searchGen);
        }

        return res;
    }
}

// ********************************************************************************************* //

Analyzer.CCObject = function()
{
    this.name = "";
    this.address = null;
    this.refcount = 0;
    this.gcmarked = false;
    this.root = false;
    this.garbage = false;
    this.knownEdges = 0;
    this.edges = [];
    this.owners = [];
    this._searchMark = 0;
}

Analyzer.CCObject.prototype =
{
    clone: function()
    {
        var o = new Analyzer.CCObject();
        o.name = this.name;
        o.address = this.address;
        o.refcount = this.refcount;
        o.gcmarked = this.gcmarked;
        o.root = this.root;
        o.garbage = this.garbage;
        o.knownEdges = this.knownEdges;
        o.edges = Lib.cloneArray(this.edges);
        o.owners = Lib.cloneArray(this.owners);
        o._searchMark = 0;
        return o;
    }
}

// ********************************************************************************************* //

return Analyzer;

// ********************************************************************************************* //
});
