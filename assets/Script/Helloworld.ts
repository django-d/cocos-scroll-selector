import IScrollView from "./IScrollView";
import Item from "./Item";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(IScrollView)
    view: IScrollView = null;

    @property(cc.Prefab)
    item: cc.Prefab = null;

    can: boolean = false;

    start() {
        // init logic
        // this.view.elastic = false;
        this.view.scrollEndCallBack = this.endCall.bind(this);
        this.view.scrollBeginCallBack = () => {
            this.view.scrollEndCallBack = this.endCall.bind(this);
        }
        this.init();

    }

    init() {
        const arr = [];
        for (let i = 0; i < 100; i++) {
            arr.push({ index: i });
        }
        this.view.bounceDuration = 0.1;
        console.log(arr);
        this.view.dataProvider = arr;

        const world = this.view.node.parent.convertToWorldSpaceAR(this.view.node.position);
        const position = this.view.content.convertToNodeSpaceAR(world);
        console.log('position:', position);
        this.endCall();
    }

    endCall() {
        let node = this.view.content.children[1];
        let x = 0;
        const world1 = this.view.node.parent.convertToWorldSpaceAR(this.view.node.position);
        this.view.content.children.forEach((n) => {
            const world2 = n.parent.convertToWorldSpaceAR(n.position);
            console.log()
            if (!x) {
                x = Math.abs(world2.x - world1.x);
                node = n;
            }
            if (Math.abs(world2.x - world1.x) < x) {
                x = Math.abs(world2.x - world1.x);
                node = n;
            }
            n.scaleX = 0.9;
            n.scaleY = 0.9
        });
        node.scaleX = 1.2;
        node.scaleY = 1.2;
        const world2 = node.parent.convertToWorldSpaceAR(node.position);
        const comp = node.getComponent(Item);
        console.log('end', comp.index);
        console.log('world2', world2);
        console.log('world1', world1);
        console.log('content', this.view.content.x);
        console.log('world2.x - world1.x', world2.x - world1.x);
        // this.view.content.runAction(cc.moveTo(0.5, cc.p(-(world2.x - world1.x) - 200, 0)));
        // this.view.setContentPosition(cc.p(100, 0));
        if (parseInt((world2.x - world1.x).toFixed(2)) - (this.view.content.x + 200) > 0) {
            if (this.view.getScrollOffset().x) {
                this.view.scrollToOffset(cc.p(world2.x - world1.x - (this.view.content.x + 200), 0), 0.5, true);
            }
        } else if (parseInt((world2.x - world1.x).toFixed(2)) - (this.view.content.x + 200) < 0) {
            // this.view.scrollToOffset(cc.p(world2.x - world1.x - (this.view.content.x + 200), 0), 0.5, true);
            this.view.content.runAction(cc.moveTo(0.5, cc.p(-(world2.x - world1.x) + this.view.content.x, 0)));
        }
        this.view.scrollEndCallBack = null;
    }


    onLocationClick() {
        this.view.scrollTo(cc.p(-0.2, 0), 0.5);
    }
}
