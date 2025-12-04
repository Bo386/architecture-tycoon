# 游戏引擎说明 - Phaser 3

## 引擎介绍

这个游戏使用的是 **Phaser 3** - 一个开源的HTML5游戏框架。

### 什么是Phaser？

Phaser是一个快速、免费且有趣的开源HTML5游戏框架，专门用于桌面和移动浏览器游戏开发。

**官方网站**: https://phaser.io  
**版本**: Phaser 3.60.0

## 为什么选择Phaser？

### 1. **易于学习和使用**
- JavaScript/TypeScript编写
- 面向对象的API
- 详细的文档和大量示例

### 2. **强大的功能**
- ✅ **场景管理** (Scenes) - 用于管理游戏的不同关卡
- ✅ **物理引擎** - 虽然本游戏主要用于动画，不用于物理碰撞
- ✅ **粒子系统** - 可以创建特效
- ✅ **动画系统** - 补间动画（Tweens）用于流畅的packet移动
- ✅ **输入处理** - 鼠标、触摸、键盘事件
- ✅ **资源加载** - 图像、音频等资源管理

### 3. **跨平台**
- 浏览器原生支持
- 桌面端（通过Electron）
- 移动端（通过Cordova/Capacitor）

### 4. **性能优秀**
- WebGL渲染器（硬件加速）
- Canvas渲染器（后备方案）
- 高效的游戏循环

## 本游戏中的Phaser使用

### 引入方式

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
```

使用CDN方式引入，无需本地安装。

### 核心架构

```
游戏结构
├── Phaser.Game (main.js)
│   ├── config (游戏配置)
│   ├── scenes (场景列表)
│   └── physics (物理引擎 - 未启用)
│
├── Scenes (场景系统)
│   ├── WelcomeScene - 欢迎界面
│   ├── ChapterSelectScene - 章节选择
│   ├── BaseLevelScene - 基础关卡场景
│   │   ├── Level1Scene
│   │   ├── Level2Scene
│   │   ├── ...
│   │   └── Level9Scene
│   └── (其他场景)
│
└── Game Objects (游戏对象)
    ├── BaseNode (基础节点)
    ├── UserNode (用户节点)
    ├── ServerNode (服务器节点)
    ├── DatabaseNode (数据库节点)
    └── (其他节点类型)
```

### 1. Scene系统（场景管理）

Phaser的Scene是游戏的核心组织单位，类似于"关卡"或"屏幕"。

```javascript
// src/scenes/Level1Scene.js
export class Level1Scene extends BaseLevelScene {
    constructor() {
        super('Level1Scene'); // 场景键名
    }

    create() {
        // 创建场景内容
        // - 创建节点（服务器、用户等）
        // - 设置UI
        // - 启动游戏循环
    }

    update(time, delta) {
        // 每帧更新逻辑
        // - 生成请求
        // - 更新动画
        // - 检查游戏状态
    }
}
```

**优势**:
- 每个关卡独立管理
- 轻松切换场景
- 场景间可以传递数据

### 2. Game Objects（游戏对象）

Phaser提供Container作为基类，我们扩展它创建自定义节点。

```javascript
// src/objects/BaseNode.js
export class BaseNode extends Phaser.GameObjects.Container {
    constructor(scene, x, y, name, type, capacity, speed) {
        super(scene, x, y);
        
        // Phaser自动管理的属性
        scene.add.existing(this); // 添加到场景
        
        // 自定义属性
        this.name = name;
        this.capacity = capacity;
        // ...
    }
}
```

**关键Phaser对象**:
- `Phaser.GameObjects.Container` - 容器，可包含多个子对象
- `scene.add.rectangle()` - 创建矩形
- `scene.add.circle()` - 创建圆形
- `scene.add.text()` - 创建文本
- `scene.add.graphics()` - 创建图形绘制对象

### 3. Tweens（补间动画）

Phaser的补间系统用于创建流畅的packet移动动画。

```javascript
// src/utils/animations.js
export function sendPacketAnim(scene, packet, targetNode, sourceNode) {
    scene.tweens.add({
        targets: packet,              // 动画目标对象
        x: targetNode.x,             // 目标X坐标
        y: targetNode.y,             // 目标Y坐标
        duration: 800,               // 持续时间(毫秒)
        ease: 'Linear',              // 缓动函数
        onComplete: () => {          // 完成回调
            targetNode.receivePacket(packet);
        }
    });
}
```

**支持的缓动函数**:
- Linear - 线性
- Quad, Cubic, Quart - 二次、三次、四次方
- Sine, Expo - 正弦、指数
- Bounce, Elastic - 弹跳、弹性

### 4. 事件系统

Phaser内置强大的事件系统。

```javascript
// 定时事件
this.scene.time.addEvent({
    delay: 1000,                    // 每秒触发
    callback: this.updateRPM,       // 回调函数
    callbackScope: this,            // 上下文
    loop: true                      // 循环执行
});

// 场景切换
this.scene.start('Level2Scene');    // 启动新场景
this.scene.stop('Level1Scene');     // 停止当前场景
```

### 5. 游戏循环

Phaser自动管理游戏循环，我们只需实现`update()`方法。

```javascript
update(time, delta) {
    // time: 游戏启动以来的总时间(毫秒)
    // delta: 距离上一帧的时间差(毫秒)
    
    if (this.isPaused) return;
    
    // 每帧执行的逻辑
    this.generateRequests();
}
```

**游戏循环流程**:
1. 输入处理
2. 物理更新（如果启用）
3. `update()` 执行
4. 渲染
5. 重复（通常60FPS）

## Phaser配置

```javascript
// src/main.js
const config = {
    type: Phaser.AUTO,              // 自动选择WebGL或Canvas
    parent: 'game-container',       // DOM容器ID
    width: 1400,                    // 画布宽度
    height: 800,                    // 画布高度
    backgroundColor: '#2a2a2a',     // 背景色
    scene: [
        WelcomeScene,
        ChapterSelectScene,
        Level1Scene,
        // ... 其他场景
    ]
};

const game = new Phaser.Game(config);
```

## 渲染器

### WebGL渲染器（默认）
- **优势**: 
  - GPU硬件加速
  - 更好的性能
  - 支持更多特效
- **使用场景**: 
  - 现代浏览器
  - 桌面和移动设备

### Canvas渲染器（后备）
- **优势**:
  - 更广泛的浏览器兼容性
  - 适合简单2D游戏
- **使用场景**:
  - 旧版浏览器
  - WebGL不可用时自动切换

## 本游戏的特点

### 1. 不使用物理引擎
```javascript
// 配置中未启用physics
// 原因：这是一个模拟器，不需要碰撞检测
```

### 2. 主要使用的Phaser功能

#### ✅ 使用的功能:
- Scene管理 - 多关卡切换
- Container - 节点对象容器
- Graphics - 绘制连接线
- Tweens - packet移动动画
- Text - 显示统计信息
- Time Events - 定时生成请求

#### ❌ 未使用的功能:
- Physics - 物理引擎
- Sprites - 精灵图
- Sound - 音频系统
- Particles - 粒子系统
- Input (游戏内) - 主要使用DOM按钮

### 3. 混合架构

```
┌─────────────────────────────────┐
│   HTML + CSS (UI层)             │
│   - 按钮控制                     │
│   - 统计显示                     │
│   - 模态对话框                   │
└─────────────────────────────────┘
           ↕
┌─────────────────────────────────┐
│   Phaser 3 (游戏层)             │
│   - 节点渲染                     │
│   - Packet动画                   │
│   - 连接线绘制                   │
└─────────────────────────────────┘
```

**优势**:
- UI使用熟悉的HTML/CSS
- 游戏逻辑用Phaser处理
- 职责清晰分离

## 性能优化

### 1. 对象池（未实现但可考虑）
```javascript
// 可以为packet创建对象池
// 避免频繁创建/销毁对象
```

### 2. 动画优化
```javascript
// 使用Tweens而非手动移动
// Phaser内部优化
scene.tweens.add({ /* ... */ });
```

### 3. 场景管理
```javascript
// 切换场景时自动清理资源
this.scene.start('NextScene');
```

## 学习资源

### 官方资源
- **官网**: https://phaser.io
- **文档**: https://photonstorm.github.io/phaser3-docs/
- **示例**: https://phaser.io/examples
- **论坛**: https://phaser.discourse.group/

### 教程
- **官方教程**: https://phaser.io/tutorials/making-your-first-phaser-3-game
- **GitHub**: https://github.com/photonstorm/phaser

## 替代方案对比

### Phaser vs 其他引擎

| 引擎 | 优势 | 劣势 |
|------|------|------|
| **Phaser 3** | 功能完整、社区活跃、文档详细 | 稍微重量级 |
| PixiJS | 更轻量、渲染性能好 | 需要自己实现游戏逻辑 |
| Three.js | 3D能力强 | 2D游戏过于复杂 |
| Unity (WebGL) | 功能最强大 | 包体积大、加载慢 |
| 原生Canvas | 完全控制 | 需要从头实现所有功能 |

## 总结

Phaser 3是这个架构模拟游戏的理想选择，因为：

1. ✅ **2D游戏框架** - 完美适合节点-连接线的可视化
2. ✅ **场景系统** - 轻松管理9个关卡
3. ✅ **动画系统** - 流畅的packet移动
4. ✅ **易于学习** - JavaScript开发者友好
5. ✅ **性能优秀** - WebGL硬件加速
6. ✅ **免费开源** - MIT许可证

对于教育类模拟游戏来说，Phaser提供了完美的功能平衡 - 既不过于简单需要从头实现所有功能，也不过于复杂增加不必要的开销。

---

**相关文档**:
- `README.md` - 项目整体介绍
- `src/main.js` - Phaser游戏初始化
- `src/scenes/` - 场景实现
- `src/objects/` - 游戏对象实现
