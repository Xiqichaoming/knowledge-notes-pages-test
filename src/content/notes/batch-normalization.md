---
title: "批归一化"
slug: "batch-normalization"
summary: "Batch Normalization 的背景、设计目标和训练意义笔记。"
category: "ai"
categoryLabel: "AI Notes"
tags: ["deep-learning", "normalization", "training"]
updated: "2026-06-11"
source: "AI知识库/神经网络Tricks/批归一化.md"
draft: false
---
批归一化对应的开创新论文是 2015 年提交到 ICML 的《Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift》，来自 Google 团队。

## 从背景来看

这篇论文想解决的情况非常实际：**深层网络训练起来很慢，而且对初始化、学习率的选择非常敏感**。

在当时，训练深度神经网络已经要靠各种“trick”才能收敛，比如小心初始化权重、使用比较小的学习率、训练过程中监控梯度等。最让人头疼的还不是收敛本身，而是——**每一层参数更新后，前面层的输出分布会跟着发生变化**，后面的层就不得不在一个不断漂移的输入分布上学习。作者给这个现象起了个名字，叫 **<mark style="background:#b1ffff">内部协变量偏移（Internal Covariate Shift）</mark>**。

于是核心想法就出来了：**能不能强制每一层的输入保持一个稳定的分布？**  
如果能，就可以用更大的学习率、不用那么精细的初始化，训练自然就更快更稳。

批归一化就是把这个想法变成可训练、可微分模块的方案。

---

## 从结构开始分析

批归一化本质上是一个**插在层与层之间的标准化模块**，它的工作流可以拆成两部分：

1. **对当前 mini-batch 做标准化（强制拉到 0 均值、1 方差）**
2. **再通过可学习的参数把分布“放回”一个合适的形状**

为什么标准化之后还要再缩放和平移？  
原因在于：如果直接把每一层的输出强行固定为标准正态分布，网络的表达能力就会被严重限制——有些层可能就是想输出“均值为 5、方差为 10”的分布，这不是网络想不要就不要的。所以 BN 让网络通过两个可学习参数 $\gamma$（缩放）和 $\beta$（平移）**自己学**到底什么分布对本层最合适。极端情况下，如果学习到的 $\gamma = \sqrt{\sigma^2}, \beta = \mu$，它可以直接还原出原始分布，相当于“不做 BN”。

---

## 前向传播（训练时）

对于一个 mini-batch $\mathcal{B} = \{x_1, x_2, ..., x_m\}$，在某一层上执行以下四步：

1. **计算 mini-batch 的均值**  
   $$
   \mu_\mathcal{B} = \frac{1}{m} \sum_{i=1}^m x_i
   $$

2. **计算 mini-batch 的方差**  
   $$
   \sigma_\mathcal{B}^2 = \frac{1}{m} \sum_{i=1}^m (x_i - \mu_\mathcal{B})^2
   $$

3. **标准化**  
   $$
   \hat{x}_i = \frac{x_i - \mu_\mathcal{B}}{\sqrt{\sigma_\mathcal{B}^2 + \epsilon}}
   $$
   （$\epsilon$ 是防止除零的小常数，一般取 $10^{-5}$）

4. **缩放与平移**  
   $$
   y_i = \gamma \hat{x}_i + \beta
   $$
   - $\gamma$ 初始化为 1，$\beta$ 初始化为 0
   - 这两个参数是反向传播学习的

---

## 训练和推理的区别

这是从业者必须吃透的一个点：**BN 在训练时和推理时的行为不一样**。

### 训练阶段
- 每个 mini-batch 进来，**就用这个 batch 自己的统计量**（$\mu_\mathcal{B}$ 和 $\sigma_\mathcal{B}^2$）做标准化。
- 同时，**维护一组全局的滑动平均统计量**，为推理做准备：
  $$
  \mu_{\text{running}} \leftarrow \text{momentum} \cdot \mu_{\text{running}} + (1 - \text{momentum}) \cdot \mu_\mathcal{B}
  $$
  $$
  \sigma_{\text{running}}^2 \leftarrow \text{momentum} \cdot \sigma_{\text{running}}^2 + (1 - \text{momentum}) \cdot \sigma_\mathcal{B}^2
  $$
  - PyTorch 中 `momentum` 默认 0.1，表示新 batch 统计量的权重是 0.1。

### 推理阶段
- 不再有 batch，直接用训练时存下来的全局统计量 $\mu_{\text{running}}$ 和 $\sigma_{\text{running}}^2$。
- $\gamma$ 和 $\beta$ 固定不变。
- 此时 BN 的运算本质上就是一个**线性变换**：
  $$
  y = \gamma \cdot \frac{x - \mu_{\text{running}}}{\sqrt{\sigma_{\text{running}}^2 + \epsilon}} + \beta
  $$
- 正因为是线性变换，部署时可以将 BN **融合到前一层的卷积或全连接层**，把乘法和加法直接合并到卷积核和 bias 中，实现零额外开销推理。

---

## BN 该放在哪里？

原论文的标准做法是：

```
Conv/FC → BatchNorm → Activation
```

也就是**在激活函数之前做标准化**。  
后来社区里也有尝试放在激活函数之后的，两种都有效，但主流框架默认、绝大多数预训练模型采用的是“激活前 BN”的方式。除非你有明确的反例，否则保持这个顺序即可。

---

## 它带来的好处

BN 几个最直接的效果：

- **允许更大学习率**：分布稳定，优化地形更平滑，大学习率不容易把激活值炸飞。
- **降低对初始化的敏感度**：就算初始权重尺度不怎么好，BN 也会强制标准化再重新缩放，给网络“第二次机会”。
- **自带一定正则化效果**：每个样本的输出依赖于同 batch 里其他样本（因为均值和方差是 batch 内共享的），这种“依赖关系”引入的噪声类似 dropout，对泛化有帮助。
- **一定程度上缓解梯度消失/爆炸**：通过稳定分布间接控制梯度的尺度。

---

## 会踩的坑

### 1. Batch size 太小
当 batch size 很小（比如不到 8），均值方差的估计会非常不准，训练变得不稳定，甚至效果比不用 BN 还差。  
**应对方式**：改用 **LayerNorm（RNN/Transformer）** 或 **GroupNorm（小 batch 视觉任务）**。

### 2. 分布式训练中的统计量问题
多卡训练时，主流框架默认每张卡独立计算自己的 $\mu_\mathcal{B}, \sigma_\mathcal{B}^2$。如果单卡 batch 本身就小，会进一步加剧统计不准的问题。  
**应对方式**：使用 **SyncBN（同步批归一化）**，让所有卡通信同步统计量，等效扩大 batch 获得更稳定的估计。

### 3. 微调时 BN 怎么处理
迁移学习时，预训练模型在旧数据集上学到的全局统计量可能不适合新任务。常见的策略有：
- **冻结 BN 统计量**：微调时不更新 `running_mean/var`（即 momentum 设为 1），只训 $\gamma,\beta$。
- **使用极小学习率微调 BN 整层**。
- **完全冻结 BN**（$\gamma,\beta$ 也不更新），让模型只调整卷积/全连接层。

### 4. BN + Dropout 的“方差偏移”
两个模块都引入了随机性，训练时模型习惯了某种噪声水平，推理时噪声消失，可能出现激活值方差不匹配（variance shift）。如果两者同时使用，建议适当降低 Dropout 率，或用其他正则手段。

---

## 常见归一化变体对照

| 方法 | 归一化在哪个维度进行 | 典型适用场景 |
|------|---------------------|-------------|
| **Batch Norm** | 沿 batch 维度，每个通道 | 大 batch 的 CNN、MLP |
| **Layer Norm** | 每个样本的所有特征 | RNN、Transformer |
| **Instance Norm** | 每个样本每个通道独立 | 风格迁移、GAN |
| **Group Norm** | 通道分组内归一化 | 小 batch 视觉任务 |

---

## PyTorch 落地示例

```python
import torch.nn as nn

# CNN 的标准块
nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, padding=1),
nn.BatchNorm2d(64),        # 通道数要和 output channels 匹配
nn.ReLU(inplace=True)

# 全连接层的标准块
nn.Linear(128, 256),
nn.BatchNorm1d(256),
nn.ReLU(inplace=True)

# 部署时进行 Conv + BN 融合
import torch.quantization as quant
model = quant.fuse_modules(model, 'conv', 'bn', 'relu')
# 或使用 torch.ao.quantization.fuse_modules（新版本）
```

---

## 批归一化的考察问题

- Q 为什么 BN 在推理时可以直接融合到前一层卷积，变成纯线性运算？  
- Q 训练时的滑动平均 `momentum` 设置得很小（比如 0.1）会对推理统计量造成什么影响？如果训练最后几个 epoch 分布突然变化，全局统计量还“跟得上”吗？  
- Q 为什么 Batch Norm 在 RNN 里使用效果远不如 LayerNorm？（提示：从“时间步维度是否共享统计量”思考）
