<template>
    <div class="noteReference" contenteditable="false" @click="referenceClicked"> 
        "{{ sliced }}"... <i class="pi pi-times-circle" style="cursor: pointer;" @click="removeReference"></i>
    </div>
    <br>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  
  const props = defineProps({
    sentence: String,
    sentence_index: Number
  })
  const emit = defineEmits(['remove-reference', 'reference-clicked'])

  const sliced = computed(() => props.sentence.slice(0, 35))

  function removeReference() {
    console.log("removeReference")
    emit("remove-reference", props.sentence_index)
  }

  function referenceClicked() {
    emit("reference-clicked", props.sentence_index)
  }

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
  