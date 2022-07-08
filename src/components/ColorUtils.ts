import * as d3 from "d3"
const brightness = 140
const offset = 0.15
const sst_range = d3.interpolateBrBG
const neg_color = sst_range(0+offset)
const pos_color = sst_range(1-offset)
const neu_color = "grey"
const entity_selected_color = "#007bff"
const key_color_pair = [
                ["negative", neg_color],
                ["positive", pos_color],
                ["neutral",  neu_color],
                ["no mention", 'white'],
            ] 
const color_dict = {
    "pos": pos_color,
    "neg": neg_color,
    "neu": neu_color,
}

export {
    brightness,
    sst_range,
    neg_color,
    pos_color,
    neu_color,
    entity_selected_color,
    key_color_pair,
    color_dict,
}