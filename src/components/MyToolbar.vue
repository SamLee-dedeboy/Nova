
<script>
export default {
methods: {
    testClicked() {
        var outlet_set = ["CNN", "Fox", "NYT", "WSJ"]
        // original nodes and edges
        var nodes = [
                {x: 30, y: 50, outlet:"CNN", sentiment: 0.8},
                {x: 25, y: 80, outlet:"Fox", sentiment: -0.9},
                {x: 90, y: 120, outlet:"NYT", sentiment: 0.1},
                {x: 70, y: 80, isCenter:true, text:"Joe Biden"}]
        var edges = [
            {source: nodes[0], target: nodes[3]},
            {source: nodes[1], target: nodes[3]},
            {source: nodes[2], target: nodes[3]}]

        // add dotted nodes
        var dotted_nodes = []
        outlet_set.forEach(outlet => {
            if(!nodes.map(a => a.outlet).includes(outlet)) {
                dotted_nodes.push({x:100, y:20, outlet:outlet, sentiment:0, dotted:true})
            } 
        })
        nodes.push.apply(nodes, dotted_nodes)
        // connect dotted nodes to center node
        var center_node = nodes.filter(function(x) { return x.isCenter })[0]
        dotted_nodes.forEach(dotted_node => {
            edges.push({source:dotted_node, target:center_node})
        })
        var graph = {
            nodes: nodes,
            edges: edges,
        }


      this.emitter.emit("graph-dev", graph);
    }
  }
}

</script>

<template>

    <Button label="Import"></Button>
    <Button label="Test" @click="testClicked"></Button>
</template> 

