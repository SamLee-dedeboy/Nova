<script setup lang="ts">
/**
 * libraries
 */
import * as vue from "vue"
import * as d3 from "d3"
import {Ref, ref } from 'vue'
import { useStore } from 'vuex'
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'

/**
 * vue components
 */
import OutletWeightSlider from "../components/OutletWeightSlider.vue";
import OutletScatterplot from '../components/OutletScatterplot.vue';
import HexCooccurrence from "../components/HexCooccurrence.vue"

import * as SstColors from "../components/utils/ColorUtils"
import { Article, SentimentType, Sentiment2D, Constraint, ScatterNode, CooccurrHexView } from "../types"

const store = useStore()
const notes = vue.computed(() => store.state.notes)
const selected_entity = vue.computed(() => store.state.selected_entity)
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)
const marked_articles_ids_with_outlet = vue.computed(() => store.state.marked_articles)
const marked_articles: Ref<Article[]> = ref([])
const server_address = vue.inject("server_address")
const highlight_hex_entity: Ref<string> = ref("")
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

const ranked_outlets = vue.computed(() => {
    return Object.keys(outlet_weight_dict.value).sort(
        (o1, o2) => outlet_weight_dict.value[o1] - outlet_weight_dict.value[o2]
    )
})
const overall_selected_hexview: Ref<CooccurrHexView | undefined> = ref(undefined)

const constraint_dict = vue.computed(() => store.state.constraints)
const constraint_statisfaction = ref({})
const removeConstraint = (constraint: Constraint) => store.commit("removeConstraint", constraint)

const segmentation = vue.computed(() => store.state.segmentation)
const original_segmentation = segmentation.value
const setSegmentation = (segmentation) => store.commit("setSegmentation", segmentation) 
const entity_grouped_view: Ref<any> = ref(undefined)
const outlet_category = vue.computed(() => {
    const res = {}
    if(!entity_grouped_view.value) return res
    Object.keys(outlet_weight_dict.value).forEach(outlet => {
        const target_node = entity_grouped_view.value.data.nodes.find(node => node.text === outlet)
        res[outlet] = checkCategorization(target_node, segmentation.value)
    })
    return res
})

const intensity: Ref<number> = ref(0.5)
const offsetScale = vue.computed(() => {
    const adjust_target: Sentiment2D = selected_entity.value.sst_ratio || {pos: 0.5, neg: 0.5}
    console.log(adjust_target)
    return d3.scaleLinear()
        .domain([0, 1])
        // .range([0.05, Math.min(1-adjust_target.pos, 1-adjust_target.neg)])
        .range([0.05, 1])
})

const adjust_offset = vue.computed(() => offsetScale.value(intensity.value))

vue.onMounted(() => {
    console.log(marked_articles_ids_with_outlet.value)
    fetch_articles(marked_articles_ids_with_outlet.value.map(pair => pair.article_id))
    fetch_hexview(selected_entity.value.name)
    fetch_entity_grouped_node(selected_entity.value.name)
    Object.keys(outlet_weight_dict.value).forEach(outlet => {
        constraint_statisfaction.value[outlet] = true
    })
})

function checkCategorization(target_node: ScatterNode, segmentation: Sentiment2D) {
    const pos = target_node.pos_sst
    const neg = target_node.neg_sst
    if(pos > segmentation.pos && neg > segmentation.neg) return "mixed"
    if(pos < segmentation.pos && neg > segmentation.neg) return "negative"
    if(pos > segmentation.pos && neg < segmentation.neg) return "positive"
    if(pos < segmentation.pos && neg < segmentation.neg) return "neutral"
    return "unknown"
}

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
async function fetch_hexview(target_entity) {
    await fetch(`${server_address}/hexview/overall/${target_entity}`, {
    method: "POST",
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(outlet_weight_dict.value)
    })
    .then(res => res.json())
    .then(json => {
        const cooccurrences = json
        const hex_view: CooccurrHexView = {
        title: `co-${selected_entity.value.name}`,
        data: cooccurrences,
        }
        overall_selected_hexview.value = hex_view
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

async function fetch_entity_grouped_node(entity) {
    await fetch(`${server_address}/processed_data/scatter_node/grouped/${entity}`)
    .then(res => res.json())
    .then(json => {
        entity_grouped_view.value = {
            title: entity,
            data: {
                nodes: json,
                max_articles: Math.max(...json.map(node => node.article_ids.length)),
                min_articles: Math.min(...json.map(node => node.article_ids.length)),
            }
        }
        console.log(entity_grouped_view.value)
        console.log("entity grouped view fetched")
    })
}

vue.watch(segmentation, (new_value, old_value) => {
    checkConflict(constraint_dict.value[selected_entity.value.name], entity_grouped_view.value.data.nodes)
})
const has_conflict: Ref<boolean> = ref(false)
function checkConflict(constraint_dict, outlet_nodes) {
    has_conflict.value = false
    Object.keys(outlet_weight_dict.value).forEach(outlet => {
        const target_node = outlet_nodes.find(node => node.text === outlet)
        constraint_statisfaction.value[outlet] = checkConstraint(
            constraint_dict?.[outlet] || undefined, 
            {pos: target_node.pos_sst, neg: target_node.neg_sst},
            segmentation.value
        )
        if(constraint_statisfaction.value[outlet] === false) has_conflict.value = true
    })    
    console.log(constraint_statisfaction.value)
}

function checkConstraint(type: SentimentType, target: Sentiment2D, segmentation: Sentiment2D): boolean {
    if(type === SentimentType.neu) {
        return target.pos <= segmentation.pos && target.neg <= segmentation.neg 
    }
    if(type === SentimentType.neg) {
        return target.pos <= segmentation.pos && target.neg >= segmentation.neg 
    }
    if(type === SentimentType.pos) {
        return target.pos >= segmentation.pos && target.neg <= segmentation.neg 
    }
    if(type === SentimentType.mix) {
        return target.pos >= segmentation.pos && target.neg >= segmentation.neg 
    }
    return true
}

const sentiment_options = [
    { type: SentimentType.neu, value: "neu" },
    { type: SentimentType.neg, value: "neg" },
    { type: SentimentType.pos, value: "pos" },
    { type: SentimentType.mix, value: "mix" },
]


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
                <div class="conclustion-container">
                    <h2 class="component-header conclusion-header"> 
                        Marked Articles
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
    <div class="summary-right-section">
        <div class="entity-hive">
            <h2 class="component-header hexview-header" v-if="selected_entity">
              Topic Co-occurrence Hive
              <i class='pi pi-info-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 400px">
                  Shows most-frequently co-occurring topics with the main topic ({{ selected_entity.name }}). <br />
                  Each co-occurring topic is categorized by the region segmentation in the Topic Scatterplot.
                </span>
              </i>
            </h2>
            <div class="overview-hex-container">
              <HexCooccurrence ref="overall_co_hexview" v-if="overall_selected_hexview" class="overall-co-hexview"
                :title="overall_selected_hexview.title" :id="`overall-co-hex`"
                :highlight_hex_entity="highlight_hex_entity"
                :entity_cooccurrences="overall_selected_hexview.data" :segmentation="segmentation">
              </HexCooccurrence>
            </div>
        </div>
        <div class="relfection-container">
            <div class="constraints-view">
                <h2 class="component-header outlet-scatter-header">
                Outlet Comparison
                <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px;">
                        This scatterplot shows you the relative coverages among outlets on the topic. <br/>
                        The dotted rectangle indicates how the segmentation will change. <br/>
                        You can also drag the center point directly.
                    </span>
                </i>
                </h2>
                <i class='pi pi-info-circle tooltip' style="position:absolute; left: 90%; margin:1%; z-index: 1;"
                v-if="has_conflict">
                    <span class="tooltiptext right-tooltiptext" style="width: 350px;">
                        <span style="font-weight:bolder">Why is there a red item?</span> <br/>
                        Seeing a red colored item means the description you made is not true any more.<br/>
                        Adjust the segmentation to resolve the conflict or delete that description.
                        
                    </span>
                </i>
                <table class="constraint-table">
                    <tr class="header">
                        <th> Outlet </th>
                        <th> Current </th>
                        <th> Set </th>

                    </tr>
                    <tr v-for="outlet in ranked_outlets"
                    :class="{not_satisfied: !constraint_statisfaction[outlet] }"> 
                        <td> {{outlet}} </td>
                        <td> {{outlet_category[outlet]}} </td>
                        <td> {{constraint_dict[selected_entity.name]?.[outlet] || "unset"}} </td>
                        <!-- <i class="pi pi-times-circle" style="cursor:pointer" 
                        @click="removeConstraint({target: selected_entity.name, outlet: outlet})"></i>  -->
                    </tr>
                </table> 
            </div>
            <!-- <Divider layout="vertical"></Divider> -->
            <div class="outlet-scatter-container">
                <OutletScatterplot
                    ref="outlet_scatter"
                    v-if="entity_grouped_view"
                    :view="entity_grouped_view"
                    :highlight_node_text="selected_entity.outlet"
                    :adjust_offset="adjust_offset"
                    id="outlet-scatter"
                    :segment_mode="true"
                    :segmentation="segmentation"
                    @update:segmentation="setSegmentation" >
                </OutletScatterplot>
            </div>
            <div class="select-category-container">
                <div class="question-container">
                    <span>
                        How would you describe the coverage on
                        <span> {{selected_entity?.name.replaceAll("_"," ")}} </span>
                        by &nbsp
                    </span>
                    <div class="journal-info-container" style="font-size:small">
                        <Dropdown :modelValue="selected_outlet" :options="journal_options"
                            placeholder="Select an journal" @change="handleChangeJournal" />
                    </div>
                </div>
                <div class="selection-container">
                    <SelectButton v-model="selectedCategory" :options="sentiment_options" option-label="value"
                        data-key="type">
                    </SelectButton>
                </div>
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
  width: 98vw;
  height: 98vh;
  display: flex;
}
.summary-container {
  width: 100%;
  height: 100%;
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

.conclusion-container {
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

// 
// Right Section
// 
.summary-right-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin-left: 1%;
}

// hex
.entity-hive {
  height: 70%;
  /*! overflow: hidden; */
}
.overview-hex-container {
  height: 100%;
}

// constraints table
.constraint-table {
  width: 100%;
  font-size: 0.8rem;
}
.relfection-container[data-v-0de57da1] {
  width: 100%;
  display: flex;
  height: 100%;
  overflow: hidden;
}

th {
  text-align: left;
  border-bottom: solid 1px;
}
.not_satisfied {
    background: #f88e8e;
    transition: background 1s;
}
.constraints-view {
  width: 100%;
}
.outlet-scatter-container {
  width: 100%;
}
</style>
