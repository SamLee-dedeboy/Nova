<script>
import { defineComponent } from '@vue/composition-api'
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
export default defineComponent({
    setup() {
        
    },
    props:["articles"],
    components: {
    Panel,
      ScrollPanel
    },
})
</script>
<template>
    <Panel v-for="(article, index) in articles"
    :key="article.id"
    :header="index+1 + '. ' + article.headline"
    toggleable="true"
    collapsed="false"
    >
    <ScrollPanel style="width: 100%; height: 200px">
        {{article.content}}
    </ScrollPanel>
    </Panel>
</template>