<script setup lang="ts">
/**
 * libraries
 */
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useStore } from 'vuex'
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import { Article } from "../types"

/**
 * vue components
 */
import OutletWeightSlider from "../components/OutletWeightSlider.vue";

import * as SstColors from "../components/utils/ColorUtils"
import { GridTemplateColumnsProperty } from "csstype"

const store = useStore()
const notes = vue.computed(() => store.state.notes)
const selected_entity = vue.computed(() => store.state.selected_entity)
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)
const constraint_dict = vue.computed(() => store.state.constraints)
const marked_articles_ids = vue.computed(() => store.state.marked_articles)
const marked_articles: Ref<Article[]> = ref([])
const server_address = vue.inject("server_address")
const marked_articles_grouped = vue.computed(() => {
    const res = {}
    marked_articles.value.forEach((article: Article) => {
        if(!res[article.journal]) res[article.journal] = []
        res[article.journal].push(article)
    })
    console.log(res)
    return res
}) 
const merged_outled_set = vue.computed(() => {
    const constraint_outlet_set = new Set(Object.keys(constraint_dict.value[selected_entity.value.name]))
    const marked_articles_outlet_set = new Set(Object.keys(marked_articles_grouped.value))
    const res = new Set([...constraint_outlet_set, ...marked_articles_outlet_set])
    console.log(res)
    return res
})


vue.onMounted(() => {
    fetch_articles(marked_articles_ids.value)
    console.log(constraint_dict.value[selected_entity.value.name])
    console.log(marked_articles_grouped.value)

})
async function fetch_articles(article_ids) {
    await fetch(`${server_address}/processed_data/ids_to_articles`,{
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(article_ids)
    })
    .then(res => res.json())
    .then(json => {
        marked_articles.value = json
        console.log("articles fetched")
    })
}

function removeTags(content) {
    const res = content.replaceAll("<n>", "\n")
    return res
}

function getColor(type: string): string {
    if(type === "mixed") return SstColors.mixed_color
    if(type === "neu") return SstColors.neu_color
    if(type === "pos") return SstColors.pos_color   
    if(type === "neg") return SstColors.neg_color
    return "white"

}
</script>

<template>
<div class="page-container">
<div class="summary-container">
    <h2 class="component-header summary-header"> 
        Summary
    </h2>
    <div class="summary-content">
        <div class="hypothesis-container">
            <div class="belief-section">
                <div class="main-topic-container">
                    <span> Main topic: {{ selected_entity.name }} </span>
                </div>
                <div class="outlet-weight-container">
                    <span>Your adjusted weights for each outlet:</span>
                    <OutletWeightSlider :outlet_weight_dict="outlet_weight_dict"></OutletWeightSlider>
                </div>
            </div>
            <div class="hypothesis-section">
                <h2 class="component-header hypothesis-header"> 
                    Notes
                </h2>
                <div class="hypothesis-content">
                    {{notes}}
                </div>
            </div>
        </div>
        <div class="conclustion-container">
            <h2 class="component-header conclusion-header"> 
                Conclusion
            </h2>
            <ScrollPanel class="conclusion-content">
                <div class="constraint-container"
                v-for="outlet in merged_outled_set">
                    <div class="constraint-header" :style="{background:getColor(constraint_dict[selected_entity.name][outlet])}">
                        {{outlet}} - {{constraint_dict[selected_entity.name][outlet] || "unset"}}
                    </div>
                    <Panel v-for="(article, index) in marked_articles_grouped[outlet]"
                    :header="index+1 + '. ' + article.headline"
                    :key="article.id"
                    :toggleable="true"
                    :collapsed="true">
                        <template #header>
                            <span class="headline">
                                <span v-html="index+1+'. '  + article.headline">
                                </span>
                            </span>
                        </template>
                        <ScrollPanel style="width: 100%; height: 200px">
                            <div class="summary">
                                <span v-html="removeTags(article.summary)">
                                </span>
                            </div>
                        </ScrollPanel>
                    </Panel>
                </div>
            </ScrollPanel>
        </div>
    </div>
</div>
</div>
</template>

<style scoped lang="scss">
//
// Page containers
//
.page-container {
  width: 100%;
  height: 100%;
  /*! display: flex; */
}
.summary-container {
  width: 50vw;
  height: 98vh;
  display: flex;
  flex-direction: column;
  justify-content: left;
}

.summary-content {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: solid 1px #b7b7b7;
}

.conclustion-container {
    width: 100%;
    height: 100%;
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.component-header.summary-header {
  background: #f7f7f7;
  padding-left: 1%;
  margin: 1% 0% 1% 0%;
}

// 
// Main topic & outlet weights
//
.belief-section {
//   display: flex;
}

.main-topic-container {
  flex: 1 1 0;
}

.outlet-weight-container {
    flex: 1 1 0;
    width: 53%;
    padding: 1% 1% 1% 0%;
}

:deep(.outlet-weight-grid-container) {
  padding-top: 2%;
}

// slider handler size
:deep(.p-slider .p-slider-handle) {
  height: 0.8rem;
  width: 0.8rem;
  pointer-events: none;
}
:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
  margin-top: -0.4rem;
  margin-left: -0.4rem;
}


//
// Hypothesis/Notes Section
//
.hypothesis-container {
    width: 100%;
    height: 30%;
    margin: 0% 1% 1% 0%;
    background: #f7f7f7;
    // padding: 0% 1%;
    padding-left: 1%;
    padding-right: 1%;
}
.hypothesis-section {
    height: 30%;
}

//
// Conclusion Header
//
.component-header.conclusion-header {
  background: #f7f7f7;
  margin: 0% 0% 0% 0%;
  padding-left: 1%;
}
.constraint-header {
    padding-left: 1%;
}

:deep(.p-scrollpanel.p-component.conclusion-content) {
  height: 100%;
}
:deep(.p-scrollpanel-content) {
  height: 100%;
}


</style>