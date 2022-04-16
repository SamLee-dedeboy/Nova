
<script>
export default {
methods: {
    testClicked() {
        var nodes = [
                {x: 30, y: 50, outlet:"CNN", sentiment: 0.8},
                {x: 50, y: 80, outlet:"Fox", sentiment: -0.9},
                {x: 90, y: 120, outlet:"NYT", sentiment: 0.1},
                {x:70, y:80, isCenter:true, text:"Joe Biden"}]
        var edges = [{source: nodes[0], target: nodes[1]},
                 {source: nodes[2], target: nodes[1]}]
        var graph = {
            nodes: nodes,
            edges: edges
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

