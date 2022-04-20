<script>

export default {
    props: {
        enabled_outlet_set: Array
    },
    emit: ["outlet-filtered"],
    methods: {
        updateFilter(event, index) {
            var old_state = event.target.getAttribute("data-selected")
            console.log(this.enabled_outlet_set, index)
            if(old_state == "selected") {
                event.target.classList.remove("p-button-raised")
                event.target.classList.add("p-button-outlined")
                event.target.setAttribute("data-selected", "not_selected")
                this.enabled_outlet_set[index].enabled=false
            } else {
                event.target.classList.remove("p-button-outlined")
                event.target.classList.add("p-button-raised")
                event.target.setAttribute("data-selected", "selected")
                this.enabled_outlet_set[index].enabled=true
            }
            this.$emit("outlet-filtered", this.enabled_outlet_set)

        }
    }
}
</script>

<template>
    <div>   
        <Button
        v-for="(outlet, index) in enabled_outlet_set" :key="outlet"
        @click ="updateFilter($event, index)"
        data-selected=selected
        >{{outlet.outlet}}</Button>
    </div>
</template>
<style scoped>

.clicked  {
    background-color: black;
}

</style>
