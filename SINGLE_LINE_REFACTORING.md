# 单线连接改造总结

## 修改概述

将游戏中所有关卡的节点连接线从**双线**（一条请求线+一条响应线）简化为**单线**（双向共用一条线）。

## 修改内容

### 1. src/utils/animations.js

#### 修改前（双线系统）
- 使用两条平行的线表示双向通信
- 一条青色线表示请求方向（A→B）
- 一条金色线表示响应方向（B→A）
- 两条线各有8像素的偏移量，形成平行线
- 每条线中间有箭头指示器

#### 修改后（单线系统）
- 使用一条直线表示双向通信
- 青色线连接两个节点
- 请求和响应数据包都在同一条线上移动
- 数据包动画路径也更新为沿着中心线移动

### 2. 代码变化

```javascript
// 修改前：drawDualLines() 绘制两条平行线
export function drawDualLines(graphics, nodeA, nodeB) {
    // 计算偏移量
    const offset = 8;
    const ox = offset * Math.cos(angle + Math.PI/2);
    const oy = offset * Math.sin(angle + Math.PI/2);
    
    // 绘制请求线（带偏移）
    graphics.lineBetween(
        nodeA.x + ox, nodeA.y + oy,
        nodeB.x + ox, nodeB.y + oy
    );
    
    // 绘制响应线（相反偏移）
    graphics.lineBetween(
        nodeB.x - ox, nodeB.y - oy,
        nodeA.x - ox, nodeA.y - oy
    );
}

// 修改后：drawDualLines() 绘制一条中心线
export function drawDualLines(graphics, nodeA, nodeB) {
    // 绘制单条双向线
    graphics.lineStyle(2, CONFIG.colors.linkReq);
    graphics.lineBetween(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
}
```

## 优势

1. **视觉更简洁** - 减少了屏幕上的线条数量，画面更清爽
2. **性能更好** - 每对节点只需绘制一条线，而不是两条
3. **更易理解** - 新手玩家更容易理解节点之间的连接关系
4. **代码更简单** - 移除了复杂的偏移量计算逻辑

## 影响范围

- **所有关卡** - 因为所有关卡都继承自BaseLevelScene，使用相同的drawDualLines函数
- **所有节点类型** - User、AppServer、Database、Cache、CDN、LoadBalancer等所有节点间的连接
- **数据包动画** - 请求和响应数据包现在都沿着同一条中心线移动

## 测试结果

✅ 在Level 1中测试通过
- User节点与App Server之间显示单条青色连接线
- 数据包（青色圆点表示读请求，菱形表示写请求）在线上正常移动
- 响应数据包（黄色圆点）也在同一条线上返回

## 兼容性

- ✅ 不影响现有游戏逻辑
- ✅ 不需要修改任何节点类
- ✅ 不需要修改任何场景配置
- ✅ 保持函数名称不变（drawDualLines），确保向后兼容

## 日期

2025年12月2日
