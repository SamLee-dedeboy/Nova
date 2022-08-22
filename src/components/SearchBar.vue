<script setup lang="ts">
import * as vue from "vue"
import {Ref, ref} from "vue"
import ScrollPanel from "primevue/scrollpanel"

const props = defineProps({
    search_terms: Object as () => String[],
})
const emit = defineEmits(['entity_searched'])
const search_results: Ref<any> = ref([])
function autocompleteMatch(input) {
  if (input == '') {
    return [];
  }
  input = input.toLowerCase()
  var reg = new RegExp(input)
  return props.search_terms!.filter(function(term) {
	  if (term.toLowerCase().match(reg)) {
        return term;
	  }
  });
}

function showSearchResults(e) {
    const list_container = document.querySelector('.list-container') as HTMLElement
    list_container.style.display = "block"
    const scroll_container = document.querySelector('.scroll-panel-container') as HTMLElement
    scroll_container.style.display = "block"
    const val = e.target.value
    search_results.value = autocompleteMatch(val);
}

function handleSearchClicked(item) {
    emit('entity_searched', item)
    vue.nextTick(() => {
        const list_container = document.querySelector('.list-container') as HTMLElement
        list_container.style.display = "none"
        const scroll_container = document.querySelector('.scroll-panel-container') as HTMLElement
        scroll_container.style.display = "none"

    })
}

function handleLoseFocus() {
    setTimeout(() => {
        const list_container = document.querySelector('.list-container') as HTMLElement
        list_container.style.display = "none"
        const scroll_container = document.querySelector('.scroll-panel-container') as HTMLElement
        scroll_container.style.display = "none"
    }, 100)

}
</script>
<template>
    <div class="search-bar-container">
        <input type="text" class="search-input" @input="showSearchResults" @focusout="handleLoseFocus"/>
        <div class="scroll-panel-container">
            <ScrollPanel class="search-result">
                <ul class="list-container">
                    <li v-for="item in search_results" :key="item" 
                    :title="item"
                    @click="handleSearchClicked(item)"
                    >{{item}}</li>
    
                </ul>
            </ScrollPanel>
        </div>
    </div>
</template>
<style scoped>
.search-result {
    height: 100%;
}
.search-result, .list-container {
    background: white;
    border: 1px dotted #ccc;
    padding: 3px;
}
.search-result >>> ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}
.search-result >>> li {
    padding: 5px 0;
}
.search-result >>> li:hover {
    background: #eee;
    cursor: pointer;
}

.scroll-panel-container {
    height: 200px;
    display: none;
    top:30%;
}
.search-bar-container {
    height:100%;
    overflow: visible;
}

:deep(.p-scrollpanel-wrapper) {
  border-right: 9px solid #f4f4f4;
}
:deep(.p-scrollpanel-bar) {
  background-color: #1b81e5  !important;
  opacity: 1;
  transition: background-color .3s;
}
:deep(.p-scrollpanel-bar:hover) {
  background-color: #135ba1;
}
.search-input {
    top: 50%;
    transform:translateY(-50%);
}
</style>