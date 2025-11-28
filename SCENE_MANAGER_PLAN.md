# Scene Manager Implementation Plan

## 当前问题分析

### 代码重复严重
在`main.js`中，每个按钮处理器都包含重复的场景查找逻辑：

```javascript
// 这段代码在多个地方重复出现
const level1Scene = game.scene.getScene('Level1Scene');
const level2Scene = game.scene.getScene('Level2Scene');
// ... 重复8次
const level8Scene = game.scene.getScene('Level8Scene');

const activeScene = (level1Scene && level1Scene.sys.settings.active) ? level1Scene :
                   (level2Scene && level2Scene.sys.settings.active) ? level2Scene :
                   // ... 长长的三元运算符链
```

### 关卡切换逻辑混乱
关卡选择器包含大量硬编码的if-else语句：
- 每个关卡都需要手动停止其他7个场景
- 代码重复超过200行
- 添加新关卡需要修改多处

### 缺乏中心化管理
- 没有统一的场景状态跟踪
- 场景切换逻辑分散在多处
- 难以调试和维护

## 解决方案：SceneManager

### 设计原则
1. **单一职责**：专注于场景管理
2. **DRY原则**：消除代码重复
3. **易于扩展**：添加新场景只需配置
4. **类型安全**：提供清晰的API

### SceneManager架构

```javascript
class SceneManager {
    constructor(game) {
        this.game = game;
        this.scenes = new Map();  // 场景名称 -> 场景实例的映射
        this.currentScene = null; // 当前活跃场景
        this.sceneConfig = [];    // 场景配置数组
    }
    
    // 初始化场景管理器
    initialize(sceneConfigs) { }
    
    // 获取当前活跃场景
    getActiveScene() { }
    
    // 切换到指定场景
    switchToScene(sceneName) { }
    
    // 重启当前场景
    restartCurrentScene() { }
    
    // 切换到下一关
    goToNextLevel() { }
    
    // 切换到上一关
    goToPreviousLevel() { }
    
    // 跳过当前关卡
    skipCurrentLevel() { }
    
    // 执行场景方法（如start、pause、resume）
    executeOnActive(methodName, ...args) { }
}
```

### 场景配置结构

```javascript
const SCENE_CONFIG = [
    {
        name: 'WelcomeScene',
        class: WelcomeScene,
        key: 'WelcomeScene',
        isLevel: false,
        levelNumber: null
    },
    {
        name: 'Level1Scene',
        class: Level1Scene,
        key: 'Level1Scene',
        isLevel: true,
        levelNumber: 1,
        title: 'Monolithic Architecture',
        nextLevel: 'Level2Scene'
    },
    // ... 其他关卡
];
```

### 使用示例

```javascript
// 初始化
const sceneManager = new SceneManager(game);
sceneManager.initialize(SCENE_CONFIG);

// 按钮处理器简化为：
document.getElementById('btn-start').addEventListener('click', () => {
    sceneManager.executeOnActive('startSimulation');
});

document.getElementById('btn-reset').addEventListener('click', () => {
    sceneManager.restartCurrentScene();
});

// 关卡切换简化为：
levelSelector.addEventListener('change', (e) => {
    sceneManager.switchToScene(`Level${e.target.value}Scene`);
});
```

## 实现步骤

### 第1步：创建SceneManager类
- [x] 设计类结构
- [ ] 实现核心方法
- [ ] 添加错误处理
- [ ] 编写单元测试

### 第2步：定义场景配置
- [ ] 创建SCENE_CONFIG常量
- [ ] 为每个场景添加元数据
- [ ] 验证配置完整性

### 第3步：重构main.js
- [ ] 导入SceneManager
- [ ] 初始化SceneManager实例
- [ ] 简化所有按钮处理器
- [ ] 移除重复代码

### 第4步：测试和验证
- [ ] 测试场景切换
- [ ] 验证按钮功能
- [ ] 检查边界情况
- [ ] 性能测试

## 预期收益

### 代码减少
- main.js从~600行减少到~200行
- 消除80%的重复代码
- 提高代码可读性

### 可维护性
- 集中式场景管理
- 清晰的API接口
- 易于调试

### 扩展性
- 添加新场景只需配置
- 支持插件化扩展
- 灵活的场景生命周期

### 性能
- 缓存场景引用
- 减少DOM查询
- 优化场景切换

## 风险和缓解

### 风险1：破坏现有功能
**缓解**：
- 保持向后兼容
- 全面的测试覆盖
- 渐进式重构

### 风险2：增加复杂度
**缓解**：
- 清晰的文档
- 简单的API
- 代码注释

### 风险3：性能影响
**缓解**：
- 性能基准测试
- 优化热路径
- 避免过度抽象

## 后续改进

### 短期
- 添加场景转场动画
- 实现场景预加载
- 添加场景历史栈

### 长期
- 支持场景组合
- 实现场景状态持久化
- 添加场景调试工具

---

**优先级**: High  
**估计工时**: 4-6小时  
**依赖**: 无  
**状态**: 规划完成，准备实施
