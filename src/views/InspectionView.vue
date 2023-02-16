<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import SelectButton from "primevue/selectbutton"
import Slider from "primevue/slider"
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import ScrollPanel from 'primevue/scrollpanel'
import Textarea from 'primevue/textarea'


/**
 * libraries
 */
import * as vue from "vue"
import { Ref, ref } from 'vue'
import { useUserDataStore } from '../store/userStore'
import { useRoute } from 'vue-router'
import * as d3 from 'd3'

/**
 * types
 */
import { Article, SentimentType, Constraint } from "../types"

/**
 * vue components
 */
import ArticleView from "../components/ArticleView.vue";
import ArticleAnalysis from "../components/ArticleAnalysis.vue";
import HexCooccurrence from "../components/HexCooccurrence.vue"

const store = useUserDataStore()
const route = useRoute()

const left_section_size = 60
const right_section_size = vue.computed(() => 100 - left_section_size)
const server_address = vue.inject("server_address")
const data_fetched: Ref<boolean> = ref(false)

const selected_entity = vue.computed(() => store.selected_entity)
const setEntity = (entity) => store.setEntity(entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity)
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const segmentation = vue.computed(() => store.segmentation)
const original_segmentation = segmentation.value
const outlet_weight_dict = vue.computed(() => store.outlet_weight_dict)
const clicked_hexview = vue.computed(() => store.clicked_hexview)
const highlight_hex_entity: Ref<string> = ref("")
const setClickedHexView = (hexview) => store.setClickedHexView(hexview)
const hexview_grid = vue.computed(() => store.hexview_grid)
const constraint_dict = vue.computed(() => store.constraints)
const ranked_outlets = vue.computed(() => {
    return Object.keys(outlet_weight_dict.value).sort(
        (o1, o2) => outlet_weight_dict.value[o1] - outlet_weight_dict.value[o2]
    )
})

// const selected_outlet: Ref<string> = ref("ABC News")
const selected_article: Ref<Article> = ref()
const target_articles: Ref<Article[]> = ref([])
const target_article_highlights: Ref<any> = ref({})
const marked_articles_ids_with_outlet = vue.computed(() => store.marked_articles)
const marked_article_info_grouped = vue.computed(() => {
    const res = {}
    marked_articles_ids_with_outlet.value.forEach((article_info) => {
        const outlet = article_info.outlet
        if (!res[outlet]) res[outlet] = []
        res[outlet].push(article_info)
    })
    //console.log(res)
    return res
})

const article_view = ref(null)

vue.onBeforeMount(() => {
    if(selected_entity.value == undefined) {
        setEntity({
            name: route.params.entity,
            outlet: "ABC News",
            article_ids: [1]
        })
    }
})
vue.onMounted(() => {
    prepare_data()
})

const journal_options = [
    "CNN",
    "FoxNews",
    "Breitbart",
    "ABC News",
    "New York Times",
    "Washington Post"
]

function prepare_data() {
    //console.log(selected_entity.value)
    const article_ids = selected_cooccurr_entity.value?.article_ids || selected_entity.value.article_ids
    // const article_ids = article_ids_w_sentiment.map(obj => obj.article_id)
    highlight_hex_entity.value = selected_cooccurr_entity.value?.name
    // setSegmentation(selected_entity.value.sst_ratio)
    // selected_outlet.value = selected_entity.value.outlet
    const promiseArray: any[] = []
    promiseArray.push(new Promise(async (resolve) => {
        fetch_articles(article_ids).then(
            resolve("success")
        )
    }))
    promiseArray.push(new Promise(async (resolve) => {
        fetch_article_highlights(article_ids).then(
            resolve("success")
        )
    }))
    Promise.all(promiseArray)
        .then(() => {
            data_fetched.value = true
            //console.log('fetched new articles')
        })

}

async function fetch_articles(article_ids) {
    await fetch(`${server_address}/processed_data/ids_to_articles`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            no_content: true,
            article_ids: article_ids,
        })
    })
        .then(res => res.json())
        .then(json => {
            target_articles.value = json
            //console.log({json})
            //console.log("articles fetched", json)
        })
}

async function fetch_article_highlights(article_ids) {
    await fetch(`${server_address}/processed_data/ids_to_articles_highlights`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(article_ids)
    })
        .then(res => res.json())
        .then(json => {
            //console.log("highlights fetched", json)
            target_article_highlights.value = json
        })
}

async function handleChangeJournal(e) {
    // const outlet = e.target.value
    const outlet = e.value
    // selected_outlet.value = outlet
    const entity = selected_entity.value.name
    const co_occurr_entity = selected_cooccurr_entity.value?.name
    const view = hexview_grid.value.find(view => view.title.split("-")[2] === outlet)
    setClickedHexView(view)
    await fetch_cooccurr_into(outlet, entity, co_occurr_entity)
    prepare_data()
    // selectedCategory.value = undefined
}

async function handleHexClicked({ target, co_occurr_entity }, view) {
    console.log(target, co_occurr_entity)
    const entity = target.split("-")[0]
    const outlet = target.split("-")[1]
    highlight_hex_entity.value = co_occurr_entity
    await fetch_cooccurr_into(outlet, entity, co_occurr_entity)
    prepare_data()
}

async function fetch_cooccurr_into(outlet, entity, co_occurr_entity) {
    await fetch(`${server_address}/processed_data/cooccurr_info/grouped/${outlet}/${entity}/${co_occurr_entity}`)
        .then(res => res.json())
        .then(json => {
            //console.log("cooccurr_info fetched")
            const target_entity = {
                name: json.target,
                outlet: outlet,
                article_ids: json.target_article_ids,
                // num_of_mentions: json.target_num,
                // articles_topic_dict: json.target_articles_topic_dict,
                // sst_ratio: clicked_hexview.value.data.target.sst
            }
            setEntity(target_entity)
            const cooccurr_entity = {
                target: json.target,
                outlet: outlet,
                name: json.cooccurr_entity,
                outlet: outlet,
                article_ids: json.target_article_ids,
                // num_of_mentions: json.cooccurr_num,
                // target_num_of_mentions: json.target_num_of_mentions,
                // articles_topic_dict: json.cooccurr_articles_topic_dict,
            }
            setCooccurrEntity(cooccurr_entity)
            console.log(selected_cooccurr_entity.value)
        })
}

function outletIconStyle(name:string){
    let className = name.replaceAll(' ','-') + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

// async function handleArticleIconClicked(article_info) {
//     let target_article
//     await fetch(`${server_address}/processed_data/ids_to_articles`, {
//         method: "POST",
//         headers: {
//             "Accept": "application/json",
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify([article_info.article_id])
//     })
//         .then(res => res.json())
//         .then(json => {
//             target_article = json[0]
//             article_view.value.handleArticleClicked(null, target_article)
//         })
// }
 

</script>

<template>
    <Splitter class="splitter-outmost">
        <SplitterPanel id="article_view_section"
            class="articleview-section flex align-items-center justify-content-center" :size="left_section_size">
            <i v-if="!data_fetched" class="pi pi-spin pi-spinner" 
            style="position:absolute;
                left: 45%;
                top: 30%;
                font-size: 3rem;
                z-index: 1000">
            </i>
            <h2 class="component-header article-view-header">
                Articles on
                <span> {{selected_entity?.name.replaceAll("_"," ")}} </span>
                &
                <span> {{selected_cooccurr_entity?.name.replaceAll("_"," ")}} </span>
                by
                <span> {{selected_entity.outlet}}</span>
                <!-- <span> {{selected_outlet}}</span> -->
                &nbsp
                <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 400px">
                        Below are the articles of the selected topics published by {{ selected_entity?.outlet }}. <br />
                        Click the plus button to expand and see a summary of the article. <br />
                        Use the Mark button to mark any interesting articles you find. <br />
                    </span>
                </i>
            </h2>
            <ArticleView class="article-view-container" v-if="data_fetched" v-model:sst_threshold="segmentation"
                ref="article_view"
                :articles="target_articles" 
                :article_highlights="target_article_highlights"
                @article-selected="(article) => selected_article=article"
                :entity_pair="[selected_entity?.name as string, selected_cooccurr_entity?.name as string]">
            </ArticleView>
            <div class="hexview-container">
                <div v-if="data_fetched" class="cooccurr-info-content">
                    <div class=journal-icon-container>
                        <div :class="['journal-style']">
                            <img :src="`/${selected_entity.outlet}.png`"
                                :class="['journal-image',`${outletIconStyle(selected_entity.outlet)}`]" />
                        </div>
                        <div class="journal-info-container" style="font-size:small; z-index:99;">
                            <Dropdown :modelValue="selected_entity.outlet" :options="journal_options"
                                placeholder="Select an journal" @change="handleChangeJournal" />
                        </div>
                    </div>
                    <div class="num_of_articles">
                        Number of articles about
                        <span style="font-weight:bolder" :title="selected_entity?.name"> {{selected_entity?.name.replaceAll("_"," ")}}
                        </span>
                        <span v-if="selected_cooccurr_entity">
                            and
                            <span style="font-weight:bolder" :title="selected_cooccurr_entity.name">
                                {{selected_cooccurr_entity.name.replaceAll("_"," ")}}
                            </span>
                        is {{ selected_cooccurr_entity? selected_cooccurr_entity.article_ids.length :
                        selected_entity.article_ids.length }}
                        </span>
                    </div>
                </div>
                <HexCooccurrence v-if="data_fetched" class="compare-co-hexview" :title="clicked_hexview.title"
                    :id="`compare-co-hex-inpection`" :entity_cooccurrences="clicked_hexview.data"
                    :segmentation="original_segmentation" :highlight_hex_entity="highlight_hex_entity"
                    :show_blink="true"
                    @hex-clicked="handleHexClicked">
                </HexCooccurrence>
                <svg style='position:absolute;'>
                    <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
                        patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
                        <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
                    </pattern>
                </svg>
            </div>
        </SplitterPanel>
        <SplitterPanel id="entity_info_section" class="entity-info-panel flex align-items-center justify-content-center"
            :size="right_section_size">
            <div class="entity-info-container">
                <div class="target-cooccurr-container">
                    <!-- <div v-if="marked_articles_ids_with_outlet.length > 0"
                        class="navigate-container">
                        <router-link class="goNext" :to="{ name: 'summary', params: { entity: selected_entity.name }}">
                            Summary Report </router-link>
                    </div> -->
                    <!-- <h2 class="component-header cooccurr-info-header">
                        Outlet Coverage
                    </h2> -->
                    <!-- <div class="cooccurr-info-content">
                        <div :class="['journal-style']">
                            <img :src="`/${selected_entity.outlet}.png`"
                                :class="['journal-image',`${outletIconStyle(selected_entity.outlet)}`]" />
                        </div>
                        <div class="num_of_articles">
                            Number of articles about
                            <span style="font-weight:bolder" :title="selected_entity?.name"> {{selected_entity?.name.replaceAll("_"," ")}}
                            </span>
                            <span v-if="selected_cooccurr_entity">
                                and
                                <span style="font-weight:bolder" :title="selected_cooccurr_entity.name">
                                    {{selected_cooccurr_entity.name.replaceAll("_"," ")}}
                                </span>
                            </span>
                            is {{ selected_cooccurr_entity? selected_cooccurr_entity.num_of_mentions :
                            selected_entity.num_of_mentions }}
                        </div>
                    </div> -->
                </div>
                <ArticleAnalysis class="article_analysis_panel"
                    :entity_pair="[selected_entity?.name as string, selected_cooccurr_entity?.name as string]"
                    :selected_article="selected_article"
                    :article_highlights="target_article_highlights">
                </ArticleAnalysis>

                <!-- <div class="document-container"> -->
                    <!-- <div class="marked-articles-container">
                        <h2 class="component-header marked-articles-header">
                            Marked Articles
                        </h2>
                        <table class="mark-table">
                            <colgroup>
                                <col span="1" style="width: 35%;">
                                <col span="1" style="width: 65%;">
                            </colgroup>
                            <tbody style="height:100%;">
                                <tr v-for="outlet in ranked_outlets" class="markedTr">
                                    <td class="journal-image-text-cell"> 
                                        <div :class="['journal-style', 'table-image' ]">
                                            <img :src="`/${outlet}.png`"
                                                :class="['journal-image',`${outletIconStyle(outlet)}`]" />
                                        </div>
                                        <div class="table-outlet-text">
                                            {{outlet}} 
                                        </div>
                                    </td>
                                    <td>
                                        <i v-for="article_info in marked_article_info_grouped[outlet]"
                                            class="pi pi-file conclusion-icon tooltip" :class="{fair_icon: article_info.mark, unfair_icon: !article_info.mark}"
                                            style="cursor:pointer;"
                                            @click="handleArticleIconClicked(article_info)">
                                            <span class="tooltiptext top-tooltiptext icon-description" style="width: 300px">
                                                {{article_info.description}}
                                            </span>
                                        </i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        
                    </div>
                </div> -->
            </div>
        </SplitterPanel>
    </Splitter>

</template>
<style scoped lang="scss">
// ---------------------
// css for split-panel layout
// ---------------------
.splitter-outmost {
    width: 99vw;
    height: 98vh;
    display: flex;
}

.entity-info-panel {
    overflow: hidden;
}

// divider style 
:deep(.p-divider.p-divider-vertical::before) {
    border-left: 1px solid #dee2e6 !important;
}

// ---------------------
// headers
// ---------------------

.article-view-header {
    background: #f7f7f7;
    margin: 0%;
    padding: 0.5%;
}

// ---------------------
// articlew view section
// ---------------------
.articleview-section {
  overflow: hidden;
  height: 100%;
  display: flex !important;
  flex-direction: column !important;
}

// ---------------------
// entity info section
// ---------------------
.target-cooccurr-container {
    display: flex;
    flex-direction: column;
    padding-left: 10px;
    padding-right: 10px;
    background: #f7f7f7;
    margin-left: 1%;
    margin-right: 1%;
    width: 100%;
}

:deep(.entity-info-view-container) {
    display: flex;
    flex-direction: column;
    align-content: center;
    width: 100%;
    justify-content: center;
    max-width: unset !important;
}

.entity-info-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.cooccurr-info-content {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    width: 100%;
}

.cooccurr-info-header {
    margin: 1.5%;
}

ol {
    padding-left: 10%;
}

li {
    white-space: pre;
}

:deep(.p-slider.p-component.p-slider-horizontal) {
    width: 50%;
    margin-left: 15px;
}

.entity-info-section {
    padding-left: 1%;
    flex: 2 1 0;
}

.num_of_articles {
    width: 50%;
    margin-left: 2%;
    font-size: 1rem;
}

// ---------------------
// Sentiment category selection section
// ---------------------
.selection-container {
    display: flex;
    align-items: center;
}

.slider-label {
    margin-left: 5px;
    // position:absolute;
    font-family: Lato;
    // left: 41.2%;
    // top: -10%;
}

:deep(.p-slider .p-slider-handle) {
    height: 0.8rem;
    width: 0.8rem;
}

:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
    margin-top: -0.4rem;
    margin-left: -0.4rem;
}


// ---------------------
//  Hexview section
// ---------------------
.hexview-container {
    display: flex;
    max-height: 49%;
}

// ---------------------
// Constraints & Outlet Scatterplot Section
// ---------------------
.constraints-outlet-scatter-container {
    display: flex;
    //   justify-content: space-between;
    flex: 1 1 0;
    overflow: hidden;
    flex-direction: column;
}

.intensity-slider {
    width: 38% !important;
}

.constraint-table {
    font-size: 0.8rem;
}

.constraints-view {
    //   width: fit-content;
    background: #f7f7f7;
    //   flex: 1 1 0;
    margin-right: 1%;
}

:deep(.p-button) {
    padding: 0.1rem 1rem;
}

:deep(.p-buttonset, .p-button) {
    margin: 0.3rem 0rem;
}

:deep(.p-inputtext) {
    padding: 0.2rem 0.5rem;
}

:deep(.p-scrollpanel.p-component) {
    width: 100%;
}
:deep(.p-scrollpanel-bar-y) {
    background: #4d4e4f;
}

.question-container {
    display: flex;
    align-items: center;
    background: #f7f7f7;
    border-bottom: solid 1px #b7b7b7;
    font-family: "Lato";
    padding-left: 1%;
}


.notes {
    display: flex;
    flex-direction: column;
}

.notes-style {
    height: 100%;
}

.document-container {
    display: flex;
    height: 100%;
    margin-left: 1%;
}

.marked-articles-header {
    margin: 1% 1% 0% 0%;
    background: #f7f7f7;
    padding-left: 1%;
}

.marked-articles-container {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.mark-table {
    font-size: 1rem;
    width: 100%;
    height: 100%;
    border: 1px solid black;
    border-collapse: collapse;
}

// td {
// border-bottom: solid 1px black;
// border-collapse: collapse;
// }

.markedTr {
    border: 1px solid #b7b7b7;
}



.journal-style.table-image {
    width: 34px;
    height: 34px;
    bottom: unset;
}
.journal-image-text-cell {
display: flex;
align-items: center;
height:100%;

}
.table-outlet-text {
  margin-left: 5%;
}
.conclusion-icon {
    font-size: 1.5em;
}
.conclusion-icon:hover::before {
    font-weight: 600;
}
.fair_icon {
    color: red;
}
.unfair_icon {
    color: blue;
}
.icon-description {
    font-size: 1rem;
    font-size: 1rem;
    font-family: 'Lato';
    font-weight: 200;
    box-shadow: rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;
}




.outlet-scatter-container {
    display: flex;
    /*! flex-direction: column; */
    background: #f7f7f7;
    height: 100%;
    flex: 1 1 0;
}

.outlet-scatter-header {
    // display: flex;
    // flex-direction: column;
    border-bottom: solid 1px #b7b7b7;
    margin: 0%;
    flex: 1 1 25%;
    padding-right: 0%;
}


.navigate-container {
    text-align: center;
    display: flex;
    position: absolute;
    height: 25%;
    width: 25%;
    top: 10%;
    right: 1%;
    z-index: 999;
    box-shadow: 0 0 0 0 rgb(0 0 0);
    transform: scale(1);
    animation: pulse-a39a231a 2s infinite;
}

a.goNext {
    text-decoration: none;
    margin: 1%;
    color: #4caaf5;
    width: 100%;
}


@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 #4caaf5;
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
}


.journal-style{
    width: 50px;
    height: 50px;
    position: relative;
    overflow: hidden;
    border-radius: 50%;
    border: #d7d7d7 3px solid;
    // bottom: 10%;
    // left: 2%;
}

.FoxNews-icon{
    height: 85%;
    right: 30%;
    bottom: 2%;
}

.Breitbart-icon{
    height: 65%;
    top: 20%;
    left: 10%;
}

.icon {
    height: 100%;
}

.journal-image {
  display: inline;
  margin: 0 auto;
  width: auto;
}
:deep(.hex-svg) {
    width: unset !important;
}
.journal-icon-container {
  display: flex;
  padding-left: 2%;
}
.journal-info-container {
//   width: fit-content;
//   right:0;
//   position: absolute;
    // white-space: nowrap;
    margin: 0.5rem 1rem;
}
</style>