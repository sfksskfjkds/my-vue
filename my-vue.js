class MyVue {
    constructor(options) {
        this.$options = options
        this.$data = options.data
        // 实现数据响应式
        observe(options.data)

        // 代理data
        proxy(this,options.data)

        // 编译模板
        new Compile(options.el,this)
    }
    
}

// 根据传的value类型(对象、数组)来做响应化
class Observer {
    constructor(value) {
        this.value = value
        if (typeof value === 'object') {
            this.walk(value)
        }
    }
    // 响应化处理对象
    walk(obj) {
        Object.keys(obj).forEach(key => {
            defineReactive(obj,key,obj[key])
            // 递归遍历
            observe(obj[key])
        })
    }
}

// 代理data中的每个key，方便用户直接访问实例数据而不用中间加上$options
function proxy(vm,data) {
    Object.keys(data).forEach(key => {
        // 将vm中data中的属性代理到vm中(把key代理到vm上)
        Object.defineProperty(vm,key,{
            get() {
                return data[key]
            },
            set(val) {
                data[key] = val
            }
        })
    })
}

function observe(obj) {
    new Observer(obj)
}

function defineReactive(obj,key,val) {
    // 创建一个dep，与当前的key一一对应,当Watcher创建的时候就把Watcher实例添加到dep里面管理起来
    const dep = new Dep()
    // 对传入的obj进行访问拦截
    Object.defineProperty(obj,key,{
        get() {
            Dep.target && dep.addWatcher(Dep.target)
            console.log('get',key,val);
            // 内层函数访问了外层函数的变量，这里形成了闭包，val和dep都不会被垃圾回收机制回收
            return val
        },
        set(newVal) {
            if (newVal !== val) {
                console.log('set',key,newVal);
                // 由于val没有被回收，所以这里直接赋值
                val = newVal
                // newVal也可能是对象(但是如果给对象新添加一个属性则没办法拦截到，这就是$set方法的作用，其实$set还是执行了一下observe)
                observe(newVal)
                dep.notify()
            }
        }
    })
}

/* 
    管理模板中每一次出现的key及其对应的更新函数
    编译器compile执行时就能知道出现了多少次，所以编译器碰到指令或者插值绑定就实例化Watcher实例
    当key值变化(setter被触发)的时候，执行所有的更新函数
 */
class Watcher {
    constructor(vm,key,updateFn) {
        // vm[key]就能知道更新后的值是多少，所以Watcher实例化时需要传进来
        this.vm = vm
        this.key = key
        this.updateFn = updateFn
        Dep.target = this
        // 触发一下get,收集依赖Watcher实例
        vm[key]
        // 收集完马上置空
        Dep.target = null
    }
    update() {
        // 执行更新函数
        this.updateFn.call(this.vm, this.vm[this.key])
    }
}

// 管理某个key相关的Watcher实例，当key变化时，只通知变化的那个key相关的Watcher执行所有更新函数
class Dep {
    constructor() {
        this.watchers = []
    }
    addWatcher(watcher) {
        this.watchers.push(watcher)
    }
    notify() {
        this.watchers.forEach(w => w.update())
    }
}
