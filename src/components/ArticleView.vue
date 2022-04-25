<script>
import { defineComponent } from '@vue/composition-api'
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import { nextTick } from 'vue'

export default defineComponent({
    setup() {
        
    },
    props:["articles"],
    components: {
    Panel,
      ScrollPanel
    },
    watch: {
        articles: async function() {
            await nextTick();
            var headers = document.getElementsByClassName('p-panel-header');
            for (let header of headers) {
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
    :key="article.id"
    :header="index+1 + '. ' + article.headline"
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