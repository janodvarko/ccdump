/* See license.txt for terms of usage */

define([
    "lib/lib",
    "lib/trace",
],
function(Lib, FBTrace) { with (Domplate) {

// ********************************************************************************************* //
// Graph shortest path finder

/**
 * Returns path from object A to object B. Implementation is based on Dijkstra's algorithm
 * that solves the single-source shortest path problem for a graph.
 */
function ObjectGraphPathFinder(searchId, visitedId)
{
    this.searchId = searchId;
    this._visitedId = visitedId;
}

ObjectGraphPathFinder.prototype =
{
    findPath: function(root, obj, listener)
    {
        if (!obj)
            return null;

        this.obj = obj;
        this.listener = listener;

        var nodes = this.getAllNodes(root);
        root._distance = 0;

        // Remember the total length for progress.
        this.totalLength = nodes.length;

        // Start path calculation, the result is provided asynchronously
        var callback = function()
        {
            // Get the result path
            var result = [];
            var currentNode = obj;
            while (currentNode && currentNode != root)
            {
                result.push(currentNode);
                currentNode = currentNode._previous;
            }

            result.push(root);

            // Pass the result to the original callback.
            listener.onFinished.call(listener, result);
        };

        // Start on timeout.
        setTimeout(this.calculatePath.bind(this, nodes, callback), 250);
    },

    calculatePath: function(nodes, callback)
    {
        for (var i=0; i<100; i++)
        {
            if (this.calculateDistances(nodes))
            {
                // Done, execute the callback.
                callback();
                return;
            }
        }

        var progress = 100 - (nodes.length / (this.totalLength / 100));
        this.listener.onProgress.call(this.listener, progress);

        // There are still nodes to process, next chunk on timeout.
        setTimeout(this.calculatePath.bind(this, nodes, callback), 125);
    },

    /**
     * Calculates distance for neighbors of the node that has the shortest
     * distance from the root.
     * Returns true if we found our target node or the rest of unvisited nodes is
     * not accessible from the source node (ie from the root).
     * 
     * @param {Object} nodes Unvisited nodes.
     */
    calculateDistances: function(nodes)
    {
        if (!nodes.length)
            return true;

        // Get the node with smallest distance. This is what makes the entire
        // algorithm really slow. Could we effectivelly keep the array sorted?
        var o = null, index;
        for (var i=0; i<nodes.length; i++)
        {
            var n = nodes[i];
            if (!o || n._distance < o._distance)
            {
                o = n;
                index = i;
            }
        }

        // If true, all remaining nodes are inaccessible from source.
        if (o._distance == Infinity)
            return true;

        // Did we found the path to our object? If yes, we are done!
        if (o == this.obj)
            return true;

        // Remove the node from the list of unvisited nodes.
        nodes.splice(index, 1);
        o._visited = this._visitedId;

        // Evaluate distances for all neighbors.
        var neighbors = this.getNeighbors(o);
        for (var j=0; j<neighbors.length; j++)
        {
            var n = neighbors[j];

            // Ignore already visited nodes.
            if (n._visited == this._visitedId)
                continue;

            // Update distance in the neighbor node if we have shorter path.
            if (n._distance > o._distance + 1)
            {
                n._distance = o._distance + 1;
                n._previous = o;
            }
        }

        return false;
    },

    // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
    // Helpers

    getNeighbors: function(o)
    {
        var result = [];

        for (var i=0; i<o.owners.length; i++)
        {
            var owner = o.owners[i];
            result.push(owner.from);
        }

        for (var i=0; i<o.edges.length; i++)
        {
            var edge = o.edges[i];
            result.push(edge.to);
        }

        return result;
    },

    getAllNodes: function(o, nodes)
    {
        if (o._searchMark == this.searchId)
            return;

        o._searchMark = this.searchId;

        if (!nodes)
            nodes = [];

        nodes.push(o);

        // Set infinite distance fo this node.
        o._distance = Infinity;
        o._previous = null;

        for (var i=0; i<o.owners.length; i++)
        {
            var owner = o.owners[i];
            this.getAllNodes(owner.from, nodes);
        }

        for (var i=0; i<o.edges.length; i++)
        {
            var edge = o.edges[i];
            this.getAllNodes(edge.to, nodes);
        }

        return nodes;
    },
}

// ********************************************************************************************* //

return ObjectGraphPathFinder;

// ********************************************************************************************* //
}});
