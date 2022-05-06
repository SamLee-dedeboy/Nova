<script>
import { defineComponent } from '@vue/composition-api'
import TieredMenu from 'primevue/tieredmenu';
export default defineComponent({
    components: {
        TieredMenu
    },
    props:['topics'],
    data() {
        return {
            items:[]
        }
    },
    watch: {
        topics: function() {
            this.items = this.topics.map(topic => Object({label: topic}))
        }
    },
    methods: {
        toggle(event) {
            this.$refs.menu.toggle(event);
        }   
    }

})
</script>

<template>
    <Button type="button" label="Topic" @click="toggle" />
    <TieredMenu id="topic_selection" ref="menu" :model="items" :popup="true"
        style="width: auto"
    >
        
    </TieredMenu>
</template>
