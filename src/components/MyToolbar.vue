
<script>
import articleData from "../assets/articles_topic.json"
export default {
    emits: ["graph-dev"],
    data() {
        return {
            articles: articleData,
            topic_dict: {},
            np_list:[]
        }
    },
    mounted() {
        for(const article of this.articles) {
            if(!this.topic_dict[article.class]) {
                this.topic_dict[article.class] = []
            }
            this.topic_dict[article.class].push(article.id)
            this.np_list=["Joe Biden", "BLM"]
        }
    },
    methods: {
        testClicked() {
            var outlet_set = ["CNN", "Breitbart", "FoxNews", "ABC News", "New York Times", "Washington Post", ]
            // original nodes and edges
            var graph1 = {
                nodes: [
                    {x: 100, y: 110, outlet:outlet_set[0], sentiment: -0.8, pos_sent: 0.1, neg_sent: -0.9, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[0])},
                    {x: 600, y: 150, outlet:outlet_set[1], sentiment: 0.9, pos_sent: 0.9, neg_sent: -0.1, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[1])},
                    {x: 80, y: 300, outlet:outlet_set[2], sentiment: -0.1, pos_sent: 0.1, neg_sent: -0.3, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[2])},
                    {x: 500, y: 300, outlet:outlet_set[4], sentiment: 0.5, pos_sent: 0.6, neg_sent: -0.1, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[4])},
                    {x: 650, y: 400, outlet:outlet_set[5], sentiment: 0.1, pos_sent: 0.1, neg_sent: 0, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[5])}

                ],
                center_node : {x: 300, y: 300, text:this.np_list[0], pos_sent: 0, neg_sent: 0, neu_sent:0}
            }

            var graph2 = {
                nodes: [
                    {x: 100, y: 110, outlet:outlet_set[0], sentiment: -0.8, pos_sent: 0.1, neg_sent: -0.9, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[0])},
                    {x: 600, y: 150, outlet:outlet_set[1], sentiment: 0.9, pos_sent: 0.9, neg_sent: -0.1, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[1])},
                    {x: 80, y: 300, outlet:outlet_set[3], sentiment: -0.1, pos_sent: 0.1, neg_sent: -0.3, neu_sent:0.1, articles:this.articles.filter(article => article.journal==outlet_set[2])},
                    {x: 500, y: 300, outlet:outlet_set[4], sentiment: 0.5, pos_sent: 0.6, neg_sent: -0.1, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[4])},
                    {x: 650, y: 400, outlet:outlet_set[5], sentiment: 0.1, pos_sent: 0.1, neg_sent: 0, neu_sent:0, articles:this.articles.filter(article => article.journal==outlet_set[5])}

                ],
                center_node : {x: 300, y: 300, text:this.np_list[1], pos_sent: 0, neg_sent: 0, neu_sent:0}
            }
            var graphList = [graph1, graph2]
            // add dotted nodes

            graphList.forEach(graph=> {
                var dotted_nodes = []
                outlet_set.forEach(outlet => {
                if(!graph.nodes.map(a => a.outlet).includes(outlet)) {
                    dotted_nodes.push({x:300, y:150, outlet:outlet, sentiment:0, dotted:true})
                } 
            })
                graph.nodes.push.apply(graph.nodes, dotted_nodes)
            })

            // emit
            var dataset = {
                graphList: graphList,
                outlet_set: outlet_set,
                topic_dict: this.topic_dict,
                np_list: this.np_list
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

<style scoped>
Button {
    margin: 10px;
    border-radius: 8px;
}
</style>