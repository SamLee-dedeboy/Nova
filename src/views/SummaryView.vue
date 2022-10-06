<script setup lang="ts">
/**
 * libraries
 */
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useStore } from 'vuex'
import * as d3 from 'd3'

const store = useStore()
const notes = vue.computed(() => store.state.notes)


</script>

<template>
    <div> {{notes}} </div>
</template>