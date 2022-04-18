
<script>
export default {
methods: {
    testClicked() {
        var outlet_set = ["CNN", "Fox", "NYT", "WSJ"]
        // original nodes and edges
        var nodes = [
                {x: 25, y: 30, outlet:"CNN", sentiment: 0.8},
                {x: 10, y: 80, outlet:"Fox", sentiment: -0.9},
                {x: 120, y: 120, outlet:"NYT", sentiment: 0.1},
        ]
        var center_node = {x: 70, y: 80, isCenter:true, text:"Joe Biden"}

        // add dotted nodes
        var dotted_nodes = []
        outlet_set.forEach(outlet => {
            if(!nodes.map(a => a.outlet).includes(outlet)) {
                dotted_nodes.push({x:100, y:20, outlet:outlet, sentiment:0, dotted:true})
            } 
        })
        nodes.push.apply(nodes, dotted_nodes)
        var graph = {
            nodes: nodes,
            center_node: center_node,
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

