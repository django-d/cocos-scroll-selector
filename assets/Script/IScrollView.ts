const { ccclass, property } = cc._decorator;

enum Direction {
    Horizontal, // 横向
    Vertical, // 纵向
}

@ccclass
export default class IScrollView extends cc.ScrollView {

    @property(cc.Prefab)
    itemPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    waitingPrefab: cc.Prefab = null;

    @property({ tooltip: `是否开启Item点击事件` })
    private allowItemClick = false;

    @property({ tooltip: `是否开启初始滑动` })
    private canScroll = false;

    @property()
    spacing: number = 10;
    /**  只能一个方向滑动 */
    @property({ type: cc.Enum(Direction), tooltip: `选一个方向` })
    dir: Direction = Direction.Vertical;
    @property({ type: cc.Component.EventHandler, visible() { return this.allowItemClick; }, tooltip: `item上的点击事件` })
    public itemEvents: cc.Component.EventHandler[] = [];

    /**  总共Item个数 */
    public spawnCount: number = 0;
    /**  缓冲区 */
    private bufferZone: number = 0;

    private lastContentPosY: number = 0;

    private lastContentPosX: number = 0;
    /**  原始contextX */
    private originalX: number = 0;

    private originalY: number = 0;

    private fetching: boolean = false;
    /**  是否已经数据初始化 */
    private initialized: boolean = false;
    /**  单位毫秒 */
    private fetchTime: number = 500;
    /**  增加数据 */
    private fetchData: any[] = null;
    /**  下拉到低端时回调 */
    fechCallBack: Function = null;
    /** 是否要刷新 */
    public isFetch: boolean = true;
    /** 是不是不满节点 */
    public isNoFull: boolean = false;
    /** 滚动回调 */
    scrollingCallBack: Function = null;
    /** 滚动结束回调 */
    scrollEndCallBack: Function = null;
    /** 滚动开始回调 */
    scrollBeginCallBack: Function = null;
    waitNode: cc.Node = null;

    @property
    // tslint:disable-next-line:variable-name
    public _dataProvider: any[] = null;

    set dataProvider(data: any[]) {
        if (!this.initialized) {
            this.init(data);
        } else {
            this._dataProvider = data || [];
            this.refreshDataProvider();
        }
    }
    get dataProvider() {
        return this._dataProvider;
    }

    onLoad() {
        this.horizontal = this.dir === Direction.Horizontal;
        this.vertical = !this.horizontal;
        this.originalX = this.content.x;
        this.originalY = this.content.y;
    }

    init(dataList: any[] = []) {
        // if (Object.prototype.toString.call(dataList) !== '[object Array]') {
        //     throw new Error(`Illegal parameter`);
        // }
        this.initialized = true;
        this.horizontal ? this.initHorizontal(dataList) : this.initVertical(dataList);
    }

    /** 执行item点击挂载方法 */
    dispatchEvent(event) {
        cc.Component.EventHandler.emitEvents(this.itemEvents, this);
    }

    registerEvent(item: cc.Node) {
        if (this.allowItemClick) {
            item.on(cc.Node.EventType.TOUCH_END, this.dispatchEvent, this, true);
        }
    }

    unregisterEvent(item: cc.Node) {
        if (this.allowItemClick) {
            item.off(cc.Node.EventType.TOUCH_END, this.dispatchEvent, this, true);
        }
    }

    initHorizontal(dataList: any) {
        const items = this.content.children;
        this.spawnCount = Math.ceil(this.content.parent.width / (this.itemPrefab.data.width + this.spacing)) + 1;
        const templeNode = items[0] || cc.instantiate(this.itemPrefab);
        templeNode.parent = this.content;
        this.bufferZone = -(this.getPositionInView(templeNode).x - this.itemPrefab.data.width);
        templeNode.destroy();
        this.content.removeAllChildren();
        this.dataProvider = dataList;
    }

    initVertical(dataList: any) {
        const items = this.content.children;
        this.spawnCount = Math.ceil(this.content.parent.height / (this.itemPrefab.data.height + this.spacing)) + 1;
        const templeNode = items[0] || cc.instantiate(this.itemPrefab);
        templeNode.parent = this.content;
        this.bufferZone = this.getPositionInView(templeNode).y + this.itemPrefab.data.height;
        templeNode.destroy();
        this.content.removeAllChildren();
        this.dataProvider = dataList;
    }

    /** 当数据源引用被修改时 */
    refreshDataProvider() {
        const items = this.content.children;
        this.content.x = this.originalX;
        this.content.y = this.originalY;
        this.content.removeAllChildren();

        // this.scrollToTop();
        // const a = this.content.children.length;
        // const b = this.dataProvider.length;

        // for (let i = 0; i < (a > b ? a : b); i++) {
        //     const data = this.dataProvider[i];
        //     let item = items[i];
        //     if (data && item) {
        //         const comp = item.getComponent(this.itemPrefab.name);
        //         comp.updateData(data, i);
        //         item.active = true;
        //     } else if (!data && item) {
        //         item.active = false;
        //     } else if (data && !item) {
        //         item = cc.instantiate(this.itemPrefab);
        //         const comp = item.getComponent(this.itemPrefab.name);
        //         comp.updateData(data, i);
        //         item.parent = this.content;
        //         this.registerEvent(item);
        //     }
        //     if (this.horizontal) item.setPosition(item.width * (0.5 + i) + this.spacing * (i + 1), 0);
        //     else item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
        // }
        for (let i = 0; i < this.spawnCount && i < this.dataProvider.length; i++) {
            let item = items[i];
            if (!item) {
                item = cc.instantiate(this.itemPrefab);
                item.parent = this.content;
                item.active = true;
                this.registerEvent(item);
            }
            if (this.horizontal) item.setPosition(item.width * (0.5 + i) + this.spacing * (i + 1), 0);
            else item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
            item.getComponent(this.itemPrefab.name).updateData(this.dataProvider[i], i);
        }
        this.refreshContentSize();
        // this.lastContentPosX = this.content.x;
        // this.lastContentPosY = this.content.y;
        // this.updateDataHorizontal();
    }

    /** 纵向滑动 */
    updateDataViertical() {
        const items = this.content.children;

        const buffer = this.bufferZone;
        const isDown = this.content.y < this.lastContentPosY; // scrolling direction
        const offset = (this.itemPrefab.data.height + this.spacing) * items.length;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < items.length; ++i) {
            const viewPos = this.getPositionInView(items[i]);
            if (isDown) {
                // 没到达内容顶端
                if (viewPos.y < -buffer && items[i].y + offset < 0) {
                    items[i].setPosition(items[i].x, items[i].y + offset);
                    const item = items[i].getComponent(this.itemPrefab.name);
                    const itemId = item.index - items.length; // update item id
                    item.updateData(this.dataProvider[itemId], itemId);
                }
            } else {
                // 没到达内容底部
                if (viewPos.y > buffer && items[i].y - offset > -this.content.height) {
                    items[i].setPosition(items[i].x, items[i].y - offset);
                    const item = items[i].getComponent(this.itemPrefab.name);
                    const itemId = items.length + item.index; // update item id
                    item.updateData(this.dataProvider[itemId], itemId);
                }
            }
        }
        // update lastContentPosY
        this.lastContentPosY = this.content.y;
    }

    /** 横向滑动 */
    updateDataHorizontal() {
        const items = this.content.children;
        const buffer = this.bufferZone;
        const isRight = this.content.x > this.lastContentPosX; // scrolling direction
        const offset = (this.itemPrefab.data.width + this.spacing) * items.length;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < items.length; ++i) {
            const viewPos = this.getPositionInView(items[i]);
            if (isRight) {
                // 没到达内容顶端
                if (-viewPos.x < -buffer && items[i].x - offset > 0) {
                    items[i].setPosition(items[i].x - offset, items[i].y);
                    const item = items[i].getComponent(this.itemPrefab.name);
                    const itemId = item.index - items.length; // update item id
                    item.updateData(this.dataProvider[itemId], itemId);
                }
            } else {
                // 没到达内容底部
                if (-viewPos.x > buffer && items[i].x + offset < this.content.width) {
                    items[i].setPosition(items[i].x + offset, items[i].y);
                    const item = items[i].getComponent(this.itemPrefab.name);
                    const itemId = items.length + item.index; // update item id
                    item.updateData(this.dataProvider[itemId], itemId);
                }
            }
        }
        this.lastContentPosX = this.content.x;
    }

    /** 滑动事件的监听 */
    scrollEvent(sender, event: cc.ScrollView.EventType) {
        switch (event) {
            case cc.ScrollView.EventType.SCROLLING:
                if (this.isNoFull) return;
                console.log(this.getScrollOffset());
                this.horizontal ? this.updateDataHorizontal() : this.updateDataViertical();
                if (this.scrollingCallBack) this.scrollingCallBack();
                break;
            case cc.ScrollView.EventType.SCROLL_BEGAN:
                console.log('be gin');
                if (this.scrollBeginCallBack) this.scrollBeginCallBack();
                break;
            case cc.ScrollView.EventType.SCROLL_ENDED:
                if (this.scrollEndCallBack) this.scrollEndCallBack();
                break;
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                if (this.horizontal || !this.isFetch) return;
                this.executeFetch();
                break;
            case cc.ScrollView.EventType.SCROLL_TO_RIGHT:
                if (this.vertical || !this.isFetch) return;
                this.executeFetch();
                break;
        }
    }

    refreshContentSize() {
        if (this.dataProvider) {
            if (this.horizontal) {
                let width = this.dataProvider.length * (this.itemPrefab.data.width + this.spacing) + this.spacing;
                if (this.canScroll && width <= this.node.width) {
                    width = this.node.width;
                    this.isNoFull = true;
                } else {
                    this.isNoFull = false;
                }
                this.content.width = width;
            }
            else {
                let height = this.content.height = this.dataProvider.length * (this.itemPrefab.data.height + this.spacing) + this.spacing;
                if (this.canScroll && height <= this.node.height) {
                    height = this.node.height;
                    this.isNoFull = true;
                } else {
                    this.isNoFull = false;
                }
                this.content.height = height;
            }
        }
    }
    /** 下拉执行异步函数 */
    async executeFetch() {
        if (this.fetching) return;
        const callBack = () => {
            this.fetching = true;
            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    if (!this.fechCallBack) return resolve([]);
                    const list = await this.fechCallBack();
                    resolve(list);
                }, this.fetchTime);
            });
        };
        this.showWaitSprite();
        try {
            const dataList = await callBack() as any[];
            console.log(dataList);
            dataList.forEach((item, index) => {
                this.dataProvider.push(item);
            });
            this.refreshContentSize();
        } catch (error) {
            console.error('iscrllview fetch eorr :', error);
        }
        this.showWaitSprite();
        this.fetching = false;
    }

    /** 获得Item世界坐标 */
    getPositionInView(item: cc.Node) {
        const worldPos = item.parent.convertToWorldSpaceAR(item.position);
        const viewPos = this.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    }

    getItemAt(index: number): any {
        return this.dataProvider.indexOf(index);
    }

    getItemIndex(item: any): number {
        return this.dataProvider.indexOf(item);
    }
    /** 显示转圈圈 */
    showWaitSprite() {
        if (this.waitNode) {
            this.waitNode.removeFromParent(true);
            this.waitNode.destroy();
            this.waitNode = null;
        } else {
            this.waitNode = this.waitingPrefab ? cc.instantiate(this.waitingPrefab) : null;
            if (this.waitNode) {
                this.waitNode.parent = this.node;
            }
        }
    }

}
