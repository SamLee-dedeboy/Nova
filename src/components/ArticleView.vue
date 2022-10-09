<script setup lang="ts">
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import ToggleButton from 'primevue/togglebutton'
import SelectButton from 'primevue/selectbutton'
import * as vue from "vue"
import * as _ from "lodash"
import * as SstColors from "./utils/ColorUtils"
import { Ref, ref, nextTick } from "vue"
import { Article } from "../types"
import { useStore } from 'vuex'


const store = useStore()
const props = defineProps({
    articles: Object as () => Article[],
    article_highlights: Object as () => any,
    entity_pair: Object as () => String[],
})
const marked_articles = vue.computed(() => store.state.marked_articles)
const setMarkedArticle = (article_info) => store.commit("setMarkedArticle", article_info)
const removeMarkedArticle = (article_id) => store.commit("removeMarkedArticle", article_id)
// const notes: Ref<string> = ref("")
const notes = vue.computed(() => store.state.notes)
const setNotes = (e) => store.commit("setNotes", e.target.value)

vue.onMounted(() => {
    addHeaderClickEvent()
    const pos_scroll_panel = document.querySelector(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content")
    const neg_scroll_panel = document.querySelector(".neg-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content")
    pos_scroll_panel?.addEventListener("scroll", async function(event) {
        const element = event.target as HTMLElement
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 5) {
            const old_len = pos_panel_articles.value.length
            const next_ten_articles: Article[] | undefined = pos_articles.value?.slice(old_len, old_len+10)
            if(next_ten_articles)
                pos_panel_articles.value = pos_panel_articles.value.concat(next_ten_articles)
            const pos_panel_togglers = document.querySelectorAll(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
            pos_panel_togglers.forEach(toggler => toggler.classList.add("pos-toggler"))
            await nextTick();
            addHeaderClickEvent()
        }
    })
    neg_scroll_panel?.addEventListener("scroll", function(event) {
        const element = event.target as HTMLElement
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 5) {
            const old_len = neg_panel_articles.value.length
            const next_ten_articles: Article[] | undefined = neg_articles.value?.slice(old_len, old_len+10)
            if(next_ten_articles)
                neg_panel_articles.value = neg_panel_articles.value.concat(next_ten_articles)
            const neg_panel_togglers = document.querySelectorAll(".neg-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
            neg_panel_togglers.forEach(toggler => toggler.classList.add("neg-toggler"))
            addHeaderClickEvent()
        }
    })
    const pos_panel_togglers = document.querySelectorAll(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
    pos_panel_togglers.forEach(toggler => toggler.classList.add("pos-toggler"))
    const neg_panel_togglers = document.querySelectorAll(".neg-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
    neg_panel_togglers.forEach(toggler => toggler.classList.add("neg-toggler"))
})
const pos_articles = vue.computed(() => {
    return props.articles?.filter(article => article.sentiment.label === "POSITIVE").sort(sortByRelevance)
})
const pos_panel_articles: Ref<Article[]> = ref(pos_articles.value?.slice(0,10) || []) 
const pos_marks: Ref<boolean[]> = ref(Array(pos_articles.value?.length || 0).fill(false))
const pos_article_notes: Ref<string[]> = ref(Array(pos_articles.value?.length || 0).fill(""))

const neg_articles = vue.computed(() => {
    return props.articles?.filter(article => article.sentiment.label === "NEGATIVE").sort(sortByRelevance)
})
const neg_panel_articles: Ref<Article[]> = ref(neg_articles.value?.slice(0,10) || []) 
const neg_marks: Ref<boolean[]> = ref(Array(neg_articles.value?.length || 0).fill(false))
const neg_article_notes: Ref<string[]> = ref(Array(neg_articles.value?.length || 0).fill(""))

const selected_article: Ref<Article|undefined> = ref(undefined)
const mark_options = [
  {status: 'Fair', value: true},
  {status: 'Unfair', value: false},
]
const selected_article_mark: Ref<boolean|undefined> = ref(undefined)
vue.watch(selected_article_mark, (new_mark, old_mark) => {
    if(new_mark === undefined) return
    // pos_marks.value[index] = mark
    const article_id: number = selected_article.value!.id
    const outlet = selected_article.value!.journal
    // const description = notes.value
    const description = selected_article.value!.headline
    const mark = new_mark
    setMarkedArticle({article_id, outlet, description, mark})
    // console.log(marked_articles.value)
})

// function setNotes(e) {
//     console.log("set notes")
//     notes.value = e.target.value 
//     if(selected_article_mark.value === undefined) return
//     const article_id: number = selected_article.value!.id
//     const outlet = selected_article.value!.journal
//     const description = notes.value
//     const mark = selected_article_mark.value
//     setMarkedArticle({article_id, outlet, description, mark})
// }


function addHeaderClickEvent() {
    return
    const headers = document.querySelectorAll('.p-panel-header') 
    headers.forEach(header => {
        header.addEventListener("click", function(e) {
            console.log("header clicked", header.childNodes[3].childNodes[2])
            if(e.target != header.childNodes[3].childNodes[2] &&
                ![...header.childNodes[3].childNodes[2].childNodes].includes(e.target)
            ) 
            header.childNodes[3].childNodes[2].click()
        })
    })
}

function sortByRelevance(a1, a2): number {
    const r1 = a1.entity_candidates.filter(pair => pair[0] === props.entity_pair![0] || pair[0] === props.entity_pair![1])
    const r2 = a2.entity_candidates.filter(pair => pair[0] === props.entity_pair![0] || pair[0] === props.entity_pair![1])
    const scaler = 5
    const r1_score = _.sumBy(r1, (pair) => pair[0] === props.entity_pair![0]? scaler*pair[1] : pair[1])
    const r2_score = _.sumBy(r2, (pair) => pair[0] === props.entity_pair![0]? scaler*pair[1] : pair[1])
    return -(r1_score - r2_score)
}

vue.watch(pos_articles, (new_value, old_value) => {
    pos_panel_articles.value.length = 0
    pos_panel_articles.value = pos_articles.value?.slice(0, 10) || []
    pos_marks.value = Array(pos_articles.value?.length || 0).fill(false)
    initAnalysisPanel()
    vue.nextTick(() => {
        const pos_panel_togglers = document.querySelectorAll(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
        pos_panel_togglers.forEach(toggler => toggler.classList.add("pos-toggler"))
    })
})

vue.watch(neg_articles, (new_value, old_value) => {
    neg_panel_articles.value.length = 0
    neg_panel_articles.value = neg_articles.value?.slice(0, 10) || []
    neg_marks.value = Array(neg_articles.value?.length || 0).fill(false)
    initAnalysisPanel()
    vue.nextTick(() => {
        const neg_panel_togglers = document.querySelectorAll(".neg-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
        neg_panel_togglers.forEach(toggler => toggler.classList.add("neg-toggler"))
    })
})

function removeTags(content) {
    const res = content.replaceAll("<n>", "\n")
    return res
}

function add_highlights(raw_text: string, highlights: any[]) {
    if(!highlights || highlights?.length === 0) return raw_text
    let non_highlight_start = 0
    let divided_text: any[] = []
    let divided_marks: any[] = []
    highlights.forEach(highlight => {
        const highlight_start = highlight[0]
        const highlight_end = highlight_start + highlight[1]
        if(non_highlight_start !== highlight_start) {
            divided_text.push(raw_text.substring(non_highlight_start, highlight_start))
            divided_marks.push(0)
        }
        divided_text.push(raw_text.substring(highlight_start, highlight_end))
        divided_marks.push(1)
        non_highlight_start = highlight_end 
    })
    if(non_highlight_start < raw_text.length) {
        divided_text.push(raw_text.substring(non_highlight_start))
        divided_marks.push(0)
    }
    let res = ""
    divided_text.forEach((sub_text, index) => {
        if(divided_marks[index] === 0)
            res += sub_text
        else
            res += highlight_element(sub_text)
    })
    return res

}

function highlight_element(text) {
    const highlight_color = "#f4e12c5c"
    return `<span style='background-color:${highlight_color};'>${text}</span>`
}

function handleMark(mark, index: number, type: string) {
    const outlet = props.articles?.[0].journal
    console.log(mark)

    // if(type === "pos") {
    //     pos_marks.value[index] = mark
    //     const article_id: number = pos_articles.value![index].id
    //     const description = `positive #${index+1}` 
    //     if(mark) addMarkedArticle({article_id, outlet, description})
    //     else removeMarkedArticle(article_id)
    // }
    // if(type === "neg") {
    //     neg_marks.value[index] = mark
    //     const article_id: number = neg_articles.value![index].id
    //     const description = `negative #${index+1}` 
    //     if(mark) addMarkedArticle({article_id, outlet, description})
    //     else removeMarkedArticle(article_id)
    // }
}

function removeSelectedArticleMark() {
    const selected_article_id = selected_article.value!.id
    removeMarkedArticle(selected_article_id)
    selected_article_mark.value = undefined
}

function handleArticleClicked(e, article: Article) {
    selected_article.value = article
    initAnalysisPanel(article.id)
}

function initAnalysisPanel(article_id: number|undefined=undefined) {
    if(article_id === undefined) {
        selected_article.value = undefined
        return
    }
    // find article in marked articles
    let found = marked_articles.value.find(existed_article_info => existed_article_info.article_id === article_id)
    console.log("found", found)
    if(!found) {
    selected_article_mark.value = undefined
    // notes.value = ""
    console.log("here")
    } else {
    selected_article_mark.value = found.mark
    // notes.value = found.description
    }
    console.log("notes:", notes.value)
}
defineExpose({
    handleArticleClicked,
})


</script>

<template>
<div class="article-cards-container">
    <div class="pos-cards-container">
        <div class="pos-panel-header"> positive-leaning articles: ({{pos_articles?.length || "0"}})</div>
        <ScrollPanel class="pos-article-list">
            <div class="article-card" v-for="(article, index) in pos_panel_articles" @click="handleArticleClicked($event, article)">
                <div class="card-contents">
                    <div class="icon-container"> 
                        <i class="pi pi-file pos-icon"/>
                    </div>
                    <span class="headlineStyle" v-html="add_highlights(article.headline, props.article_highlights?.headline_entities?.[article.id])">
                    </span>
                </div>

            </div>
        </ScrollPanel>
    </div>
    <div class="neg-cards-container">
        <div class="neg-panel-header"> negative-leaning articles: ({{neg_articles?.length || "0"}})</div>
        <ScrollPanel class="neg-article-list">
            <div class="article-card" v-for="(article, index) in neg_panel_articles" @click="handleArticleClicked($event, article)">
                <div class="card-contents">
                    <div class="icon-container"> 
                        <i class="pi pi-file neg-icon"/>
                    </div>
                    <span class="headlineStyle" v-html="add_highlights(article.headline, props.article_highlights?.headline_entities?.[article.id])">
                    </span>
                </div>
            </div>
        </ScrollPanel>
    </div>
</div>
<div class="analysis-container">
    <div class="analysis-left">
        <h2 class="component-header analysis-header">
            Article Reviewer
        </h2>
        <div class="analysis-content">
            <ScrollPanel style="width: 100%; height: 100%">
                <div class="summary" v-if="selected_article">
                    <div class="articleHeadline">
                        <h4 class="selected-article-headline" v-html="add_highlights(selected_article.headline, props.article_highlights?.headline_entities?.[selected_article.id])"/>
                    </div>
                    <div class="articleSummary">
                        <span class="selected-article-summary" v-html="removeTags(add_highlights(selected_article.summary, props.article_highlights?.summary_entities?.[selected_article.id]))"/>
                    </div>
                    <div class="options">
                        <SelectButton v-model="selected_article_mark" optionValue="value" optionLabel="status" :options="mark_options"/>
                        <div class="remove-button-container"> 
                            <Button class="p-button-raised p-button-secondary p-button-text" label="remove"
                            :disabled="selected_article_mark===undefined"
                            @click="removeSelectedArticleMark()"> </Button>
                        </div>
                    </div>
                    <div style="height: 30px"></div>
                </div>
                <!-- <textarea class="article-note-area" placeholder="make a note here" v-model="article_notes"></textarea> -->

                <!-- <ToggleButton class='mark_toggle'  :model-value="selected_article_mark" onLabel="Unmark" off-label="Mark" @update:model-value="handleMark($event)"></ToggleButton> -->
            </ScrollPanel>
        </div>
    </div>
    <div class="notes" >
        <h2 class="component-header notes-header">
            Notes
            <i class='pi pi-info-circle tooltip'>
                <span class="tooltiptext right-tooltiptext" style="width: 145px">
                    Write down any hypothesis or questions you have.
                    The system will document that for you.
                </span>
            </i>
        </h2>
        <textarea class="notes-style"
         :value="notes"
         placeholder="Write down any thoughts you have..." 
         @input="setNotes" />
    </div>
</div>
</template>
<style scoped>
.article-cards-container {
  display: flex;
  height: 50%;
}
.article-card {
  display: flex;
  border-bottom: 1px solid black;
  cursor: pointer;
  height: 11%;
}
.pi.pi-file.pos-icon {
  font-size: 2em;
  position: relative;
  top: 10%;
  color: #baf0f5
}
.pi.pi-file.neg-icon {
  font-size: 2em;
  position: relative;
  top: 10%;
  color:#f4c49c; 
}
.pos-cards-container {
  width: 100%;
  margin-right: 1%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: black solid 1px;
  padding-right: 1%;
}
.neg-cards-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:deep(.p-panel-header) {
    cursor: pointer;
    background: unset !important;
    color: #25272a !important;
}
:deep(.p-panel .p-panel-header .p-panel-header-icon) {
  color: #25272a !important;
} 
:deep(.pos-toggler) {
    background: #baf0f5 !important;
}
:deep(.neg-toggler) {
    background: #f4c49c !important;
}
.pos-article-list, .neg-article-list {
    /* max-height:50%; */
    height:100%;
    overflow: hidden;
}
.pos-panel-header, .neg-panel-header {
    background: #f7f7f7;
    padding: 1%;
    font-family: "Lato";
    font-weight: bold;
    border-bottom: solid 2px #b7b7b7;
    border-top: solid 1px #b7b7b7;
}
/* .pos-panel-header {
    color:#baf0f5 
}
.neg-panel-header {
    color:#f4c49c
} */

.summary {
    white-space: pre-line;
    height:100%;
    /* display: flex; */
    flex-direction: column;
}
.selected-article-summary {
  margin-left: 1%;
}
:deep(.p-splitter-gutter) {
    pointer-events: none;
}
.selected-article-headline {
  font-weight: 600;
}

.analysis-container {
    display: flex;
  overflow: hidden;
  /*! height: 100%; */
  flex: 1 1 0;
  height: 100%;
}
.component-header.analysis-header {
  background: #f7f7f7;
  padding-left: 1%;
}
.analysis-content {
  display: flex;
  height: 100%;
flex: 1 1 0;
overflow: hidden;
}
.analysis-left {
    width: 75%;
    overflow: hidden;
display: flex;
flex-direction: column;
}
.component-header.notes-header {
    background: #f7f7f7;
    margin: 3% 1% 1% 0%;
    padding-left: 2%;
}
.notes {
  width: 25%;
  /* height: 100%; */
  padding-bottom: 1%;
  display: flex;
  flex-direction: column;
}
.notes-style {
  width: 100%;
  height: 100%;
}

.card-contents {
    width: 100%;
    display: flex;
}

.icon-container {
    width: 10%;
}

.headlineStyle{
   font-size: .75em;
   font-weight: 200;
}

.headlineStyle:hover{
    font-weight: 600;
}

.article-card:hover{
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}


:deep(.p-scrollpanel .p-scrollpanel-bar) {
    background: #838585;
}
.articleHeadline {
    text-align: center;
    margin: 2% 2% 2% 2%;
}

.articleSummary {
    margin-left: 8%;
    margin-right: 8%;
    font-style: italic;
}

.options {
    height: 20%;
    margin-left: 8%;
  display: flex;
  align-items: center;
}

.remove-button-container {
  margin-left: 1%;
}

</style>
