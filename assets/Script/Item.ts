const { ccclass, property } = cc._decorator;

@ccclass
export default class Item extends cc.Component {

    index: number;

    @property(cc.Label)
    label: cc.Label = null;

    updateData(data, index) {
        if (!index) this.node.active = false;
        else this.node.active = true;
        this.index = index;
        this.label.string = `${index}`;
    }

}