<template>
    <SplitterPanel class="entity-info-panel" :size="entity_info_panel_size">
            <!-- Entity Info -->
            <div class="entity-info-container">
              <div class="target-cooccurr-container" v-if="selected_entity">
                <h2 class="component-header cooccurr-info-header">
                  Topic Info
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 250px">
                      Statistical detail about the main and co-occurred topic.
                    </span>
                  </i>
                </h2>
                <div class="cooccurr-info-content">
                  <div class="num_of_articles">
                    Number of articles about
                    <span style="font-weight:bolder"> {{ selected_entity.name.replaceAll("_", " ") }} </span>
                    <span v-if="selected_cooccurr_entity">
                      and
                      <span style="font-weight:bolder">
                        {{ selected_cooccurr_entity.name.replaceAll("_", " ") }}
                      </span>
                    </span>
                    is {{ selected_cooccurr_entity ? selected_cooccurr_entity.num_of_mentions :
                        selected_entity.num_of_mentions
                    }}
                  </div>
                  <Divider layout="vertical"></Divider>
                  <ul class="entity-info-section">
                    <li> Main topic: {{ selected_entity.name.replaceAll("_", " ") }} </li>
                    <li v-if='selected_cooccurr_entity'> Co-occur topic: {{
                        selected_cooccurr_entity.name.replaceAll("_", " ")
                    }} </li>
                  </ul>
                </div>
                <!-- <EntityInfoView v-if="selected_entity?.outlet === 'Overall'" title="Target Entity"
                  :entity_info="selected_entity">
                </EntityInfoView>
                <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider>
                <EntityInfoView v-if="selected_cooccurr_entity" title="Co-occurr Entity"
                  :entity_info="selected_cooccurr_entity">
                </EntityInfoView> -->
              </div>
              <div class="topic-bar-container" v-if="selected_entity?.outlet === 'Overall'">
                <!-- <TopicBars v-if="selected_entity?.outlet === 'Overall'" id="cooccurr_topic_bars"
                  :targetTopicBins="selected_entity?.articles_topic_dict"
                  :cooccurrTopicBins="selected_cooccurr_entity?.articles_topic_dict">
                </TopicBars> -->
                <h2 class="component-header topic-bar-header">
                  COVID Context
                  <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 300px">
                      Articles about {{ selected_entity.name.replaceAll("_", " ") }} and
                      <span v-if="selected_cooccurr_entity">
                        {{ selected_cooccurr_entity.name.replaceAll("_", " ") }}
                      </span>
                      classified by if they reference a type of government policy or not. <br />
                    </span>
                  </i>
                  <br />
                  <Legend id="policy_legend" class="policy-bar-legend" :color_dict="legendInput">
                  </Legend>
                  <span style="font-size: small; width:20%; font-style:italic;">
                    <!-- Some explanation here a lot of explanation here more explanation here -->
                    <p> *Ratio of articles that addressed a type of policy issued due to COVID-19 or did not.</p>
                  </span>
                </h2>

                <HorizontalTopicBars id="cooccurr_topic_bars" :targetTopicBins="selected_entity?.articles_topic_dict"
                  :cooccurrTopicBins="selected_cooccurr_entity?.articles_topic_dict">
                </HorizontalTopicBars>
              </div>
              <!-- Next Stage -->
            </div>
          </SplitterPanel>
</template>

<script setup lang="ts" >


</script>