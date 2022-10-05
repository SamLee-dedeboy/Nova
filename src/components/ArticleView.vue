<script setup lang="ts">
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import * as vue from "vue"
import * as SstColors from "./utils/ColorUtils"
import { Ref, ref } from "vue"
import { Article } from "../types"


const props = defineProps({
    articles: Object as () => Article[],
    article_highlights: Object as () => Any,
})


vue.onMounted(() => {
    const pos_scroll_panel = document.querySelector(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content")
    const neg_scroll_panel = document.querySelector(".neg-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content")
    pos_scroll_panel?.addEventListener("scroll", function(event) {
        const element = event.target as HTMLElement
        if (element.scrollHeight - element.scrollTop - element.clientHeight < 5) {
            const old_len = pos_panel_articles.value.length
            const next_ten_articles: Article[] | undefined = pos_articles.value?.slice(old_len, old_len+10)
            if(next_ten_articles)
                pos_panel_articles.value = pos_panel_articles.value.concat(next_ten_articles)
            const pos_panel_togglers = document.querySelectorAll(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
            pos_panel_togglers.forEach(toggler => toggler.classList.add("pos-toggler"))
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
        }
    })
    const pos_panel_togglers = document.querySelectorAll(".pos-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
    pos_panel_togglers.forEach(toggler => toggler.classList.add("pos-toggler"))
    const neg_panel_togglers = document.querySelectorAll(".neg-article-list > .p-scrollpanel-wrapper > .p-scrollpanel-content > .p-panel-toggleable > .p-panel-header > .p-panel-icons > .p-panel-toggler")
    neg_panel_togglers.forEach(toggler => toggler.classList.add("neg-toggler"))
})
const pos_articles = vue.computed(() => {
    return props.articles?.filter(article => article.sentiment.label === "POSITIVE")
})
const pos_panel_articles: Ref<Article[]> = ref(pos_articles.value?.slice(0,10) || []) 
const neg_articles = vue.computed(() => {
    return props.articles?.filter(article => article.sentiment.label === "NEGATIVE")
})
const neg_panel_articles: Ref<Article[]> = ref(neg_articles.value?.slice(0,10) || []) 

function removeTags(content) {
    const res = content.replaceAll("<n>", "\n")
    return res
}

function add_highlights(raw_text: string, highlights: any[]) {
    if(!highlights || highlights?.length === 0) return raw_text
    let non_highlight_start = 0
    let divided_text = []
    let divided_marks = []
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
    const highlight_color = "rgb(242, 247, 99)"
    return `<span style='background-color:${highlight_color};'>${text}</span>`
}
</script>

<template>
<ScrollPanel class="pos-article-list">
    <div class="pos-panel-header"> positive-leaning articles: ({{pos_articles?.length || "0"}})</div>
    <Panel v-for="(article, index) in pos_panel_articles"
    :header="index+1 + '. ' + article.headline"
    :key="article.id"
    :toggleable=true
    :collapsed="true">
    <template #header>
        <span class="headline">
            <span v-html="index+'. ' + add_highlights(article.headline, props.article_highlights?.headline_entities?.[article.id])">
            </span>
        </span>
    </template>
    <ScrollPanel style="width: 100%; height: 200px">
        <!-- <span class="summary">
            {{removeTags(article.summary)}}
        </span> -->
        <span class="summary">
            <span v-html="removeTags(add_highlights(article.summary, props.article_highlights?.summary_entities?.[article.id]))">
            </span>
        </span>
    </ScrollPanel>
    </Panel>
</ScrollPanel>

<ScrollPanel class="neg-article-list">
    <div class="neg-panel-header"> negative-leaning articles: ({{neg_articles?.length || "0"}}) </div>
    <Panel v-for="(article, index) in neg_panel_articles"
    :header="index+1 + '. ' + article.headline"
    :key="article.id"
    :toggleable="true"
    :collapsed="true">
    <template #header>
        <span class="headline">
            <span v-html="index+'. ' + add_highlights(article.headline, props.article_highlights?.headline_entities?.[article.id])">
            </span>
        </span>
        <!-- <Chip >
            {{article.sentiment.score.toFixed(2)}}
        </Chip> -->
    </template>
    <ScrollPanel style="width: 100%; height: 200px">
        <span class="summary">
            <span v-html="removeTags(add_highlights(article.summary, props.article_highlights?.summary_entities?.[article.id]))">
            </span>
        </span>
    </ScrollPanel>
    </Panel>
</ScrollPanel>
</template>
<style scoped>
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
    max-height:50%;
    /* height:50%; */
}

.summary {
    white-space: pre-line;
}
:deep(.p-splitter-gutter) {
    pointer-events: none;
}

</style>