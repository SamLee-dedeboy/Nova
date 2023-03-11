<script setup lang=ts>
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import * as vue from "vue"
import { Ref, ref } from 'vue'
import { Article } from "../types"
import { useUserDataStore } from '../store/userStore'
import * as ColorUtils from "./utils/ColorUtils"

const server_address = vue.inject("server_address")
const store = useUserDataStore()
const props = defineProps({
    entity_pair: Object as () => String[],
    selected_article: Object as () => Article,
    article_highlights: Object as () => any,
})

const indexed_content: Ref<Any[]> = ref([])
const notes = vue.computed(() => store.notes)
const setNotes = (e) => store.setNotes(e.target.value)

vue.watch(() => props.selected_article, async () => {
    console.log(props.selected_article)
    await splitArticleSentences(props.selected_article.content)
    initAnalysisPanel(props.selected_article.id)
})

async function splitArticleSentences(content) {
    await fetch("http://localhost:3040/" + `${server_address}/splitSentences`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(content)
    })
        .then(res => res.json())
        .then(json => {
            indexed_content.value = json
            console.log({content})
            console.log({json})
        })

}

function initAnalysisPanel(article_id: number|undefined=undefined) {
    if(article_id === undefined) {
        selected_article.value = undefined
        return
    }
    // find article in marked articles
    // let found = marked_articles.value.find(existed_article_info => existed_article_info.article_id === article_id)
    // if(!found) {
    //     selected_article_mark.value = undefined
    // // notes.value = ""
    // } else {
    //     selected_article_mark.value = found.mark
    // // notes.value = found.description
    // }
}

function removeTags(content) {
    const res = content.replaceAll("<n>", "\n")
    return res
}

// indexed_content: {0: s0, 1: s1, 2: s2 ...}
// highlight: {0: entities, 1: entities}
function addContentHighlights(indexed_content: any[], highlights: any) {
    let res = ""
    Object.keys(indexed_content).forEach(sentence_index => {
        const sentence = indexed_content[sentence_index]
        const entities = highlights[sentence_index] // list of entity data
        if(entities) {
            res += add_highlights(sentence, entities, true)
        } else { // no entities to highlight
            res += sentence
        }
        res += "\n\n"
    })
    return res
}

function add_highlights(raw_text: string, highlights: any[], filter=false) {
    if(!highlights || highlights?.length === 0) return raw_text
    let non_highlight_start = 0
    let divided_text: any[] = []
    // values:
    // 0 (highlight)
    // undefined
    // positive
    // negative
    // neutral
    let divided_marks: any[] = []
    highlights.forEach(highlight => {
        // console.log(highlight.wiki_id, props.entity_pair, filter)
        const highlight_start = highlight.start_pos
        const highlight_end = highlight_start + highlight.length
        // add normal text
        if(non_highlight_start !== highlight_start) {
            divided_text.push(raw_text.substring(non_highlight_start, highlight_start))
            divided_marks.push(0)
        }
        // add highlight
        divided_text.push(raw_text.substring(highlight_start, highlight_end))

        // devided_marks.push(1)
        if(filter && (highlight.wiki_id == props.entity_pair[0] || highlight.wiki_id == props.entity_pair[1])) {
            console.log(highlight.sentiment)
            divided_marks.push(highlight.sentiment)
        } else {
            divided_marks.push(0)
        }
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
            res += highlight_element(sub_text, ColorUtils.hive_color_dict[divided_marks[index]] || undefined)
    })
    return res

}

function highlight_element(text, highlight_color='#f4e12c5c') {
    return `<span style='background-color:${highlight_color};'>${text}</span>`
}

defineExpose({
    initAnalysisPanel,
})


</script>
<template>
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
                    <!-- <div class="articleSummary">
                        <span class="selected-article-summary" v-html="removeTags(add_highlights(selected_article.summary, props.article_highlights?.summary_entities?.[selected_article.id]))"/>
                        <span class="selected-article-summary" v-html="removeTags(selected_article.content)"/>
                    </div> -->
                    <div class="articleContent">
                        <span class="selected-article-content" v-html="addContentHighlights(indexed_content, props.article_highlights?.content_entities?.[selected_article.id])"/>
                        <!-- <span class="selected-article-content" v-html="selected_article.content"/> -->
                    </div>
                    <div style="height: 30px"></div>
                </div>
            </ScrollPanel>
        </div>
    </div>
</div>
</template>

<style scoped>
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
    margin: 1%
}
.analysis-left {
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.articleHeadline {
    text-align: center;
    margin: 2% 2% 2% 2%;
}

.articleSummary, .articleContent {
    margin-left: 8%;
    margin-right: 8%;
    font-style: italic;
}

.summary {
    white-space: pre-line;
    height:100%;
    /* display: flex; */
    flex-direction: column;
}
.selected-article-summary, .selected-article-content {
  margin-left: 1%;
}
:deep(.p-splitter-gutter) {
    pointer-events: none;
}
.selected-article-headline {
  font-weight: 600;
}
:deep(.p-scrollpanel .p-scrollpanel-bar) {
    background: #838585;
}
</style>