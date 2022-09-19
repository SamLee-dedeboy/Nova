<script setup lang="ts">
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()


</script>
<template>
    <div class="compare_view_contaienr">
        <div class="compare_view_title">{{route.params.entity}}</div>
    </div>
</template>