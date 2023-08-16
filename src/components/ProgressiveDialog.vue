<script setup lang="ts">
import Dialog from "primevue/dialog";
import { Ref, ref, onMounted } from "vue"

const props = defineProps({
    header: String,
    content: String,
}) 

const emit = defineEmits(["toggleTutorial"])

const displayContent = ref("")
onMounted(() => {
    // progressively update content
  let i = 0;
  const stringResponse = props.content
  const intervalId = setInterval(() => {
    if(stringResponse[i] === "<") {
      while(stringResponse[i] !== ">") {
        i++;
      }
    }
    displayContent.value = stringResponse.slice(0, i)
    i++;
    if (i > stringResponse.length) {
      clearInterval(intervalId);
    }
  }, 20);

  return () => clearInterval(intervalId);
})

const showTutorial = ref(true)

function toggleTutorial() {
    showTutorial.value = false
    emit("toggleTutorial")
}


</script>
<template>

    <Dialog v-model:visible="showTutorial" class="tutorialStyle" position="center" :modal="true">
      <template #header>
        <h3 class="header-container"> 
            <i class="pi pi-compass" /> 
            &thinsp;
            <span class="header-text"> {{ header }} </span> 
        </h3>
      </template>

      <p class="introTutorial" v-html="displayContent">
      </p>
      <template #footer>
        <Button label="Ready" icon="pi pi-check" @click="toggleTutorial" autofocus />
      </template>
    </Dialog>
</template>

<style scoped>
.header-container {
    /* text-decoration: underline; */
    padding-right: 2%;
    /* border-bottom: 1px solid black; */
}
.p-dialog.p-component.tutorialStyle {
  width: 50%;
}
</style>