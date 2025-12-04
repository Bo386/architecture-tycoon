# Level 1 User Concurrent Request Limit

## Summary

限制第一关中User节点的并发请求数不超过10个，防止过度发送请求。

## 问题描述

在第一关中，User节点的并发请求数(Concurrent)可以达到17或更高，这会导致：
- 显示的数值不符合游戏设计预期
- 服务器承受过大压力
- 玩家体验不真实（实际网络连接也有并发限制）

## 修复方案

### UserNode.js - 限制并发请求数

**文件**: `src/objects/UserNode.js`

**修改**: 在 `routePacket()` 方法开始处添加并发限制检查

**代码**:
```javascript
routePacket(packet) {
    // Check if user has reached maximum concurrent requests (Level 1 limit)
    const maxConcurrent = GameState.currentLevel === 1 ? 10 : 999;
    
    if (this.concurrentRequests >= maxConcurrent) {
        // User is at max capacity, drop the request silently
        packet.destroy();
        return;
    }
    
    // Track request sent
    this.concurrentRequests++;
    this.trackRequest();
    this.updateConcurrentDisplay();
    
    // ... rest of routing logic
}
```

## 行为变化

### 修复前
- User可以无限发送并发请求
- Concurrent数值可以达到17+
- 所有请求都会被发送到服务器

### 修复后
- Level 1: User最多10个并发请求
- 其他关卡: User最多999个并发请求（实际上无限制）
- 超过限制时，新请求被静默丢弃（无提示）

## 游戏设计影响

### 教育价值
- **真实网络模拟**: 真实的浏览器/客户端对同一域名有并发连接数限制（通常6个）
- **资源管理**: 教导玩家客户端也有限制，不只是服务器
- **流量控制**: 展示为什么需要限流和排队机制

### 游戏平衡
- **防止请求堆积**: User端限制防止无限请求累积
- **合理压力**: 保持游戏在合理难度范围内
- **清晰反馈**: 玩家可以看到User何时达到上限

## 视觉反馈

User节点的Concurrent显示会根据数值变色：
- **0-2**: 🟢 绿色（低）
- **3-4**: 🟡 黄色（中等）
- **5-6**: 🟠 橙色（高）
- **7+**: 🔴 红色（危险）

在Level 1中，由于限制为10，可能会显示到红色（7+）。

## 技术细节

### 并发计数机制
- `concurrentRequests` 在发送请求时递增
- 在收到响应时递减（`receivePacket`）
- 在记录错误时递减（`recordError`）

### 关卡特定限制
- 使用 `GameState.currentLevel` 判断当前关卡
- Level 1: 限制10个并发
- 其他关卡: 999个并发（实际无限制）

## 相关文件

- `src/objects/UserNode.js` - User节点类，包含并发限制逻辑
- `src/objects/BaseNode.js` - 基类，提供showFloatText方法
- `src/utils/animations.js` - 处理请求动画

## 测试建议

1. **测试Level 1并发限制**:
   - 启动Level 1
   - 开始游戏
   - 观察User节点的Concurrent数值
   - 验证不会超过10
   - 确认超过限制时请求被静默丢弃（无提示）

2. **测试其他关卡**:
   - 切换到Level 2或更高关卡
   - 验证User可以有更高的并发数
   - 确保没有不必要的限制

## 额外修复

### main.js - 升级按钮逻辑修复

在修复过程中，还发现并修复了升级按钮的一个bug：
- **问题**: 升级按钮先扣钱再升级，导致升级失败时仍扣钱
- **修复**: 先调用upgrade()检查返回值，只在成功时扣钱

这个修复保留，因为它也是一个重要的bug修复。

---

**日期**: 2025年12月4日
**状态**: ✅ 已完成
**影响范围**: Level 1（其他关卡保持原有行为）
