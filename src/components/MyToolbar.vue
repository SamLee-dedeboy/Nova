
<script>
export default {
methods: {
    testClicked() {
        var nodes = [{x: 30, y: 50},
                 {x: 50, y: 80},
                 {x: 90, y: 120}]
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

