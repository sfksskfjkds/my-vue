class Compile {
    constructor(el,vm) {
        /* 
            id属性：getElementById(): 返回dom对象
            class属性：getElementsByClassName(): 返回一个集合
            标签名：getElementsByTagName(): 返回一个集合
            name属性：getElementsByName()：返回一个集合
            选择器：querySelector()：返回dom对象
         */
        this.$el = document.querySelector(el)
        this.$vm = vm

        if (this.$el) {
            this.compile(this.$el)
        }
    }

    compile(parentNode) {
        const childNodes = parentNode.childNodes
            Array.from(childNodes).forEach(child => {
                if (this.isElement(child)) {
                    // 编译元素节点
                    console.log('编译元素节点',child.nodeName);
                    this.compileElement(child)
                    
                }else if(this.isInner(child)) {
                    // 正则匹配后就能Regexp.$1就能拿到分组内容
                    console.log('编译插值绑定',child.textContent);
                    this.compileText(child)
                }

                if (child.childNodes && child.childNodes.length) {
                    this.compile(child)
                }
            })
    }

    isElement(node) {
        return node.nodeType === 1
    }
    // 判断是否为插值绑定语法
    isInner(node) {
        // 3为文本节点
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    compileText(node) {
        // 抽离出公共更新函数，方便在里面创建Watcher实例
        this.update(node,RegExp.$1.trim(),'text')
    }
    // 判断是否是指令
    isDireactive(attrName) {
        return attrName.startsWith('m-')
    }

    compileElement(node) {
        // 遍历元素属性
        const nodeAttrs = node.attributes
        console.log('节点'+node+'属性'+nodeAttrs);
        Array.from(nodeAttrs).forEach(attr => {
            // 规定指令是m-xxx="oo"的形式
            const attrName = attr.name;//属性名m-xx
            const exp = attr.value;//属性值oo
            if (this.isDireactive(attrName)) {
                // 获取指令名xx
                const dirName = attrName.substr(2)
                // 执行指令m-text
                // this[dirName] && this[dirName](node,exp)
                this.update(node,exp,dirName)
            }
        })
    }
    // 处理m-text指令
    textUpdater(node,val) {
        node.textContent = val
    }

    // 处理html指令
    htmlUpdater(node,val) {
        node.innerHTML = val
    }

    // 公共的更新函数
    update(node,exp,dirName) {
        // 执行指令对应的跟新函数
        const fn = this[dirName+'Updater']
        // 初始化页面
        fn && fn(node,this.$vm[exp])

        // 创建Watcher实例，管理页面中每一次出现的exp(即data中的key)
        // 这里把fn在包一层，尽量在这里执行fn，如果直接把fn传进去在Watcher里面执行的话还得把node传进去
        new Watcher(this.$vm, exp, function(val) {
            fn && fn(node,val)
        })
    }
}