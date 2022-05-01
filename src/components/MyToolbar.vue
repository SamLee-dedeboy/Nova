
<script>
import articleData from "../assets/articles.json"
export default {
    emits: ["graph-dev"],
    data() {
        return {
            articles: articleData.data.Article
        }
    },
    methods: {
        testClicked() {
            var outlet_set = ["CNN", "Fox", "NYT", "WSJ", "ABC", "WP"]
            // original nodes and edges
            var graph1 = {
                nodes: [
                    {x: 35, y: 70, outlet:"CNN", sentiment: -0.8, pos_sent: 0.1, neg_sent: -0.9, neu_sent:0, articles:this.articles.filter(article => article.journal=="CNN")},
                    {x: 200, y: 80, outlet:"Fox", sentiment: 0.9, pos_sent: 0.9, neg_sent: -0.1, neu_sent:0.1, articles:this.articles.filter(article => article.journal=="Fox")},
                    {x: 40, y: 120, outlet:"NYT", sentiment: -0.1, pos_sent: 0.1, neg_sent: -0.3, neu_sent:0.1, articles:this.articles.filter(article => article.journal=="NYT")},
                    {x: 200, y: 120, outlet:"ABC", sentiment: 0.5, pos_sent: 0.6, neg_sent: -0.1, neu_sent:0, articles:this.articles.filter(article => article.journal=="ABC")},
                    {x: 200, y: 40, outlet:"WP", sentiment: 0.1, pos_sent: 0.1, neg_sent: 0, neu_sent:0, articles:this.articles.filter(article => article.journal=="WP")}

                ],
                center_node : {x: 120, y: 100, text:"Joe Biden"}
            }

            var graph2 = {
                nodes: [
                    {x: 35, y: 70, outlet:"Fox", sentiment: -0.8, pos_sent: 0.1, neg_sent: -0.9, neu_sent:0, articles:this.articles.filter(article => article.journal=="CNN")},
                    {x: 200, y: 80, outlet:"NYT", sentiment: 0.9, pos_sent: 0.9, neg_sent: -0.1, neu_sent:0.1, articles:this.articles.filter(article => article.journal=="Fox")},
                    {x: 40, y: 120, outlet:"ABC", sentiment: -0.1, pos_sent: 0.1, neg_sent: -0.3, neu_sent:0.1, articles:this.articles.filter(article => article.journal=="NYT")},
                    {x: 200, y: 120, outlet:"WP", sentiment: 0.5, pos_sent: 0.6, neg_sent: -0.1, neu_sent:0, articles:this.articles.filter(article => article.journal=="ABC")},
                    {x: 200, y: 40, outlet:"WSJ", sentiment: 0.1, pos_sent: 0.1, neg_sent: 0, neu_sent:0, articles:this.articles.filter(article => article.journal=="WP")}

                ],
                center_node : {x: 120, y: 100, text:"BLM", pos_sent:1.5, neg_sent:-0.9, neu_sent: 1}
            }
            var graphList = [graph1]
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

