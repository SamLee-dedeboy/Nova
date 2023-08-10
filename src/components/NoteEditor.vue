<template>
  <div
    contenteditable="true"
    :class="['custom-textarea', { 'readonly': readonly }]"
    @input="onInput"
    @blur="onBlur"
    @focus="onFocus"
    ref="textarea"
  ></div>
</template>

<script setup lang="ts">
import { defineComponent, ref, watch } from 'vue';

const props = defineProps({
    modelValue: String,
    readonly: Boolean,
})
const textarea = ref(null);
watch(() => props.modelValue, (newVal) => {
    textarea.value.innerHTML = newVal;
    moveCursorToEnd(textarea.value);
});
const emit = defineEmits(['update:modelValue', 'blur', 'focus']);
const onInput = () => {
    emit('update:modelValue', textarea.value.innerHTML);
};
const onBlur = () => {
    emit('blur');
};
const onFocus = () => {
    emit('focus');
};

const moveCursorToEnd = (element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    };
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
</style>
