<script>
import { defineComponent } from '@vue/composition-api'
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import { nextTick } from 'vue'
import * as d3 from "d3";

export default defineComponent({
    setup() {
        
    },
    props:["articles"],
    components: {
    Panel,
      ScrollPanel
    },
    
    mounted() {
        this.color_neg = d3.scaleSqrt()
            .domain([-1, 0])  
            .range(["#F53241", "#F3BBBF"]); 
        this.color_pos = d3.scaleSqrt()
            .domain([0, 1])
            .range(["khaki", "yellow"]);
    },
    watch: {
        articles: async function() {
            await nextTick();
            var headers = document.getElementsByClassName('p-panel-header');
            var i = 0;
            for (let header of headers) {
                header.setAttribute("style", "background-color:" + this.color_neg(this.articles[i].sentiment))
                i++
                header.onclick = function(e) {
                    if(e.target != header.childNodes[3].childNodes[2] &&
                        ![...header.childNodes[3].childNodes[2].childNodes].includes(e.target)
                    ) 
                        header.childNodes[3].childNodes[2].click()
                }
            }

        
        }
    },
})
</script>
<template>
    <Panel v-for="(article, index) in articles"
    :header="index+1 + '. ' + article.headline"
    :key="article.id"
    :toggleable=true
    :collapsed=true
    >
    <ScrollPanel style="width: 100%; height: 200px">
        {{article.content}}
    </ScrollPanel>
    </Panel>
</template>
<style scoped>
::v-deep .p-panel-header {
    cursor: pointer;
}
</style>