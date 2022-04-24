
<script>
export default {
emits: ["graph-dev"],
methods: {
    testClicked() {
        var outlet_set = ["CNN", "Fox", "NYT", "WSJ", "ABC", "WP"]
        // original nodes and edges
        var graph1 = {
            nodes: [
                {x: 45, y: 70, outlet:"CNN", sentiment: -0.8},
                {x: 180, y: 80, outlet:"Fox", sentiment: 0.9},
                {x: 60, y: 120, outlet:"NYT", sentiment: -0.1},
                {x: 170, y: 120, outlet:"ABC", sentiment: 0.5},
                {x: 200, y: 100, outlet:"WP", sentiment: 0.1}

            ],
            center_node : {x: 70, y: 80, text:"Joe Biden"}
        }

        var graph2 = {
            nodes: [
                {x: 60, y: 70, outlet:"CNN", sentiment: -0.1},
                {x: 50, y: 110, outlet:"Fox", sentiment: -0.9},
                {x: 160, y: 110, outlet:"WSJ", sentiment: 0.8},
                {x: 150, y: 70, outlet:"ABC", sentiment: 0.5},
                {x: 185, y: 80, outlet:"WP", sentiment: 0.2}

            ],
            center_node : {x: 80, y: 80, text:"BLM"}
        }
        var graphList = [graph1, graph2]
        // add dotted nodes

        graphList.forEach(graph=> {
            var dotted_nodes = []
            outlet_set.forEach(outlet => {
            if(!graph.nodes.map(a => a.outlet).includes(outlet)) {
                dotted_nodes.push({x:115, y:30, outlet:outlet, sentiment:0, dotted:true})
            } 
        })
            graph.nodes.push.apply(graph.nodes, dotted_nodes)
        })

        // emit
        var dataset = {
            graphList: graphList,
            outlet_set: outlet_set
        }
        this.$emit("graph-dev", dataset);
    }
  }
}

</script>

<template>

    <Button label="Import"></Button>
    <Button label="Test" @click="testClicked"></Button>
</template> 

