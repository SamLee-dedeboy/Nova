<template>
  <div
    contenteditable="true"
    :class="['custom-textarea']"
    @input="onInput"
    @blur="onBlur"
    @focus="onFocus"
    ref="textarea"
  ></div>
</template>

<script setup lang="ts">
import { text } from 'd3';
import { nextTick, onMounted, ref } from 'vue';
const props = defineProps({
    initial_content: String,
    showRaw: Boolean,
})
onMounted(() => {
  textarea.value.innerHTML = props.initial_content || '';
  if(props.showRaw) {
    nextTick(() => {
      console.log(textarea.value.querySelectorAll(".noteReference"), props.initial_content)
      textarea.value.querySelectorAll(".noteReference").forEach((reference) => {
        reference.innerHTML = reference.getAttribute("raw_sentence").replaceAll("_", " ")
      })  
    })
  }
})
const textarea = ref(null);

function addReference(sentence, sentence_index, doc_id) {
  textarea.value.innerHTML += wrapSentence(sentence, sentence_index, doc_id)
  emit('update', textarea.value.innerHTML);
}

function wrapSentence(sentence: string, sentence_index: number, doc_id: string) {
    return `<div class="noteReference" contenteditable="false" sentence_index="${sentence_index}" raw_sentence=${sentence.replaceAll(" ", "_")} doc_id="${doc_id}">"${sentence.slice(0, 35)}..."</div><br>`
}


const emit = defineEmits(['update', 'blur', 'focus']);
const onInput = (input) => {
    console.log("input: ", input)
    emit('update', textarea.value.innerHTML);
};
const onBlur = () => {
    emit('blur');
};
const onFocus = () => {
    emit('focus');
};
defineExpose({
    addReference
})

</script>

<style scoped>
.custom-textarea {
  border: 1px solid #ccc;
  padding: 8px;
  min-height: 100px;
  outline: none;
  overflow-y: auto;
}

.readonly {
  background-color: #f0f0f0;
  pointer-events: none;
}
:deep(.noteReference) {
    border: 1px solid grey;
    border-radius: 5px;
    padding-left: 3px;
    font-family: "Trebuchet MS";
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
    font-style:italic;
    font-size: 0.8rem;
}

</style>
