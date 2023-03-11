import { defineStore } from "pinia"
import axios from "axios"

const config = {
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    }
}

const server_address = "http://127.0.0.1:5000";




export const useNewsDataStore = defineStore('newsData', {
    state: () => ({
        promiseArray: [],
        overview_overall_scatter_data: [],
        overview_overall_scatter_metadata: [],
        overview_grouped_scatter_data: [],
        overview_grouped_scatter_metadata: [],
        overview_constructed: false,
        overall_scatter_data_loading: true,
        overall_scatter_view: {}
    }),
    getters: {},
    actions: {
        async fetchOverviewClusters() {
            this.isClusterDataReady = false;
            try {
                const data = await axios.post('http://localhost:5000/firedash/perimeters/aggregate', { state: "CA" }, config)
                this.overviewClusters = data.data
                this.isClusterDataReady = true
                console.log("cluster cluster, ", this.overviewClusters)
            }
            catch (error) {
                console.log('error :>> ', error);
                throw error.message
            }
        },
        async fetchOverviewData() {
            this.fetchScatterOverallOverviewData()
            this.fetchScatterGroupedOverviewData()


            await Promise.all(this.promiseArray)
                .then(res => {
                    this.overview_constructed = true
                })
        },
        fetchScatterOverallOverviewData() {
            this.promiseArray.push(new Promise((resolve) => {
                fetch(`${server_address}/overview/scatter/overall/data`)
                    .then(res => res.json())
                    .then(json => {
                        this.overview_overall_scatter_data = json
                        this.overall_scatter_view = {
                            title: "Overall",
                            data: this.overview_overall_scatter_data
                        }
                        console.log("overall scatter fetched")
                        this.overall_scatter_view.data.nodes.forEach(node => {
                            this.overall_entity_dict[node.text] = node
                        })
                        this.overall_scatter_data_loading = false
                        resolve("success")
                    })
            }))
            this.promiseArray.push(new Promise((resolve) => {
                fetch(`${server_address}/overview/scatter/overall/metadata`)
                    .then(res => res.json())
                    .then(json => {
                        this.overview_overall_scatter_metadata = json
                        console.log("overall scatter metadata fetched")
                        resolve("success")
                    })
            }))
        },
        fetchScatterGroupedOverviewData() {
            this.promiseArray.push(new Promise((resolve) => {
                fetch(`${server_address}/overview/scatter/grouped/data`)
                    .then(res => res.json())
                    .then(json => {
                        this.overview_grouped_scatter_data = json
                        console.log("grouped scatter fetched")
                        resolve("success")
                    })
            }))


            this.promiseArray.push(new Promise((resolve) => {
                fetch(`${server_address}/overview/scatter/grouped/metadata`)
                    .then(res => res.json())
                    .then(json => {
                        this.overview_grouped_scatter_metadata = json
                        console.log("grouped scatter metadata fetched")
                        resolve("success")
                    })
            }))
        }

        //         fetchTutorialData() {
        //             const promiseArray: any[] = []


        //             promiseArray.push(new Promise((resolve) => {
        //                 fetch(`${server_address}/processed_data/outlet_article_num_dict`)
        //                     .then(res => res.json())
        //                     .then(json => {
        //                         outlet_article_num_dict.value = json
        //                         console.log("outlet article num dict fetched")
        //                         resolve("success")
        //                     })
        //             }))
        //             promiseArray.push(new Promise((resolve) => {
        //                 fetch(`${server_address}/processed_data/entity_list`)
        //                     .then(res => res.json())
        //                     .then(json => {
        //                         entity_list.value = json
        //                         console.log("entity_list fetched")
        //                         resolve("success")
        //                     })
        //             }))
        //             promiseArray.push(new Promise((resolve) => {
        //                 fetch(`${server_address}/processed_data/outlet_set`)
        //                     .then(res => res.json())
        //                     .then(json => {
        //                         enabled_outlet_set.value = json
        //                         const tmp_weight_dict = {}
        //                         enabled_outlet_set.value.forEach(outlet => {
        //                             tmp_weight_dict[outlet] = 1
        //                         })
        //                         resetOutletWeight(tmp_weight_dict)
        //                         console.log("outlet_set fetched")
        //                         resolve("success")
        //                     })
        //             }))
        //             if (selected_entity.value) {
        //                 promiseArray.push(new Promise((resolve) => {
        //                     fetch(`${server_address}/hexview/overall/${selected_entity.value.name}`, {
        //                         method: "POST",
        //                         headers: {
        //                             "Accept": "application/json",
        //                             "Content-Type": "application/json"
        //                         },
        //                         body: JSON.stringify(outlet_weight_dict.value)
        //                     })
        //                         .then(res => res.json())
        //                         .then(json => {
        //                             const cooccurrences = json
        //                             const hex_view: typeUtils.CooccurrHexView = {
        //                                 title: `co-${selected_entity.value.name}`,
        //                                 data: cooccurrences,
        //                             }
        //                             overall_selected_hexview.value = hex_view
        //                             resolve("success")
        //                         })
        //                 }))
        //                 handleEntityClicked(selected_entity.value.name)

        //             }
        //             await Promise.all(promiseArray)
        //                 .then(res => {
        //                     overview_constructed.value = true
        //                 })

        //         }

    }
})
