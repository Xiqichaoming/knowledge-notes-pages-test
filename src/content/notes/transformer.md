---
title: "Transformer"
slug: "transformer"
summary: "Transformer 论文的背景、结构与关键机制笔记。"
category: "ai"
categoryLabel: "AI Notes"
tags: ["deep-learning", "transformer", "attention"]
updated: "2026-05-25"
source: "AI知识库/Transformer.md"
draft: false
---
Transformer对应的开创新论文是2017年6月份提交到Arxiv，然后被NeurIPS2017接收的《Attention is all your need》，来自于谷歌的团队
## 从背景来看
这篇论文对应想要解决的情况是：**序列建模主要由RNN和它的变体（LSTM、GRU）来完成，但是这些模型不能并行计算、同时受限于长距离的依赖**

序列建模（sequence tranduction model）对应的任务是输入序列和输出序列的任务，在当时最直接的实际任务就是<mark style="background:#fff88f">机器翻译</mark>。由于这种输入输出的方式天然具备<mark style="background:#b1ffff">输入长度不可测、输入输出不等长</mark>的特性，所以一般的线性层不能直接处理，只能使用RNN这样的方式来解决。而同时这种网络有依赖于时序处理来保证对序列输入的支持，这使得无法在GPU上实现并行的加速，于是冲突问题就出现了。作者虽然在论文中也提到说有使用CNN尝试来兼容GPU并行和序列支持，但是终究没有形成可靠的架构能够代替甚至超越RNN类型的网络。

另一方面，处理序列难以提升性能的一大原因就是序列的变长输入输出的关联建立比较困难：对于一个网络来说，要寻找到两个位置上间距比较大的位置的单元之间的联系，要进行的操作数量是要远高于间距小的情况的。注意力机制是当时已有（2015年提出的）的一种可以尝试解决这一问题的方式。
> 原文中提到的：the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions
自注意力机制本身是一个**关联单个序列不同位置**的操作机制，已经在Transformer之前就已经使用了

## 从结构开始分析
![Pasted image 20260522170451.png](/knowledge-notes/assets/Pasted%20image%2020260522170451.png)
论文中上来就给出了一整个网络最核心的架构示意图，这个结构图中包含了许多的关键信息值得我们来分析

### Encoder-Decoder
首先，Tranformer的原始结构使用的是经典的<mark style="background:#b1ffff">Encoder-Decoder架构</mark>。

这种最初的结构是2014年提出的，为了解决序列到序列的映射，他们把两个单独的RNN分别定义为编码器和解码器，任意长度的输入会逐步读入到编码器中，然后以一个固定长度的**上下文向量**输出。解码器同理，它使用这个上下文向量作为基础，逐步解压出目标序列输出。

这种编码器-解码器的架构设计可以分离输入输出，可以独立进行优化设计，选择合适输入处理和合适输出处理的网络来单独负责。同时这样的架构设计可以摒弃部分序列任务之前一直依靠的<mark style="background:#fff88f">输入输出对其标注</mark>（在翻译任务中对某一个词元进行输入侧和输出侧的对应标注）。这种编解码的结构相当于引入了一个隐式的子空间，所以本身的通用性也很强。

在Transformer里，整个网络也是以Encoder-Decoder架构来搭建的。具体来看，Transformer的编码器和解码器都是由六层相同的子网络堆叠起来得到的。在编码器部分，单层子网络是由一个多头注意力网络和一个前馈网络串联得到的；而在解码器部分，单层子网络是有一个带有掩码的多头注意力网络、一个正常的多头注意力网络和一个前馈网络串联得到的。在这些网络串联的过程中还包含有残差连接和层归一化。

### 注意力设计
具体来看最为核心的注意力设计部分。

Transformer的注意力设计有两个部分：<mark style="background:#b1ffff">缩放点积注意力（Scaled Dot-Product Attention）</mark>和<mark style="background:#b1ffff">多头注意力（Multi-Head Attention）</mark>
![Pasted image 20260522195833.png](/knowledge-notes/assets/Pasted%20image%2020260522195833.png)上面这一张图就是缩放点积注意力的示意图。对于注意力机制来说，以往得到认同的注意力计算的思路是：
- 定义一个Q（Query）向量表示一次查询时想要获取到的特征信息，用于表达关注序列中我们此时<mark style="background:rgba(205, 244, 105, 0.55)">想要的部分需要具有什么特性</mark>
- 定义一个K（Key）向量表示一次查询时，序列的某一个单元<mark style="background:rgba(205, 244, 105, 0.55)">其本身现在具备了什么属性</mark>
- 定义一个V（Value）向量表示一次查询时，序列的某一个单元<mark style="background:rgba(205, 244, 105, 0.55)">本身要提供的内容价值评估</mark>

注意力的发展本身是符合一般演进规律的。最开始的部分，编码器把输入的所有内容进行处理，理解输入各个单元本身特点的同时获取K；让解码器来关注问题本身需要什么，以此获取V。而最开始的注意力计算中并没有V这一设计，或者说V和K是完全相同的。

这时注意力的计算可以用“计算相似性”来理解：问题浓缩为一个要查询的关键词、每一个序列单元本身又浓缩为关键属性，分配注意力时就用查询的关键词和单元的关键属性进行相似度计算（点积），拿到对应的每一个单元的匹配程度，据此来分配给不同单元的注意力。

Transformer的设计直接摒弃了编码器、解码器于QKV的绑定，让QKV的设计直接变成一个单独的模块设计，既可以存在于编码器，也可以存在于解码器中。

在Transform中，缩放点积注意力是基于对序列单元化和向量化的基础上完成的：
![Pasted image 20260522204307.png](/knowledge-notes/assets/Pasted%20image%2020260522204307.png)

在机器翻译任务中，输入的原始自然语言语句会经过Tokenizer（分词器）被拆分成多个词元的组合。Transformer使用Embedding层（词嵌入）将词元对应到指定的向量，组合之后一个句子的信息变成了一个$n \times d_{model}$的矩阵

![Pasted image 20260524160110.png](/knowledge-notes/assets/Pasted%20image%2020260524160110.png)
这样一个矩阵就是我们提供给Transformer的原始输入。在不考虑多头的情况下，这个输入会分别与三个系数矩阵相乘，得到运算结果QKV三个矩阵。这里的矩阵相乘在网络中对应三个线性层。

![Pasted image 20260524161417.png](/knowledge-notes/assets/Pasted%20image%2020260524161417.png)
紧接着，Q和K矩阵会直接进行矩阵乘法，然后使用$d_k$的算数平方根对结果进行缩放，并通过softmax之后与V矩阵再进行计算，最终输出Attention结果
$$
\text{Attention}(Q, K, V) = \mathrm{softmax}\left( \frac{Q K^\top}{\sqrt{d_k}} \right) V
$$

![Pasted image 20260524162831.png](/knowledge-notes/assets/Pasted%20image%2020260524162831.png)
而MHA（多头注意力）没有改变这个基础的思想。它只是将输入与一个矩阵相乘得到QKV的过程拆开了，Wq矩阵会被拆成多个子部分，每一个子部分按照上面的流程分别与X进行计算，完成计算之后再拼接到一起。比如在Transformer里，他们使用了8个头。那么原始的系数矩阵就相应的由$(x,d_{model})$变成了$(x,\frac{d_{model}}{8})$。相应的，中间所有的结果的第二维也是相应的变成了原来的八分之一。只在最后进行拼接还原到和不拆分时一样大小的矩阵。最后加上一个简单的线性层来完成拼接结果到最后结果的投影。
$$
\begin{align*} \text{MultiHead}(Q, K, V) &= \text{Concat}(\text{head}_1, ..., \text{head}_h) W^O \\ \text{where } \text{head}_i &= \text{Attention}(Q W_i^Q, K W_i^K, V W_i^V) \end{align*}
$$

在Transformer的解码器中，MHA被加入了一个掩码处理——Masked MHA。解码器在生成目标序列的时候，是一个**自回归（autoregressive）** 的过程——生成第i个词时，理论上只能用到前面已经生成的i-1个词，不能提前“偷看”到未来位置的信息，否则训练和推理的设定就不一致了。

具体来说，在计算 attention 权重  之后、softmax 之前，会**人为地把第i行中所有j>i的 logit 值替换为**$-\infty$ （或一个非常大的负数），这样经过 softmax 以后，这些位置的权重就会变成 0：
其中掩码矩阵  的上三角部分（不含对角线）为-$\infty$ ，其余为 0。
这样一来，每一个位置在计算它的输出时，**只能 attend 到位置0到 i（包括自己）**，相当于强行给模型戴上了“因果眼罩”。这也是为什么解码器的第一个注意力层常被称为 **Masked Multi-Head Self-Attention** 或者 **Causal Self-Attention**。

另外，解码器只依靠这样的结构还没有办法和编码器对接，于是Transformer里，在Masked MHA之后还有一层MHA。这一层的MHA的KV会直接来源于编码器（提供输入端的特征信息），而Q来自于解码器（告诉现在需要什么信息来生成下一步的结果）。这里不再需要解码器。

### 位置编码
Transformer本身在处理序列输入的时候，其实没有考虑到Token的序列位置，所以这里需要一个机制来处理序列的位置：**位置编码**

Transformer使用的位置编码是对序列中每一个Token的向量的所有维度都进行计算的：
$$
\begin{aligned}
PE (pos,2i) &= \sin(pos/10000^{2i/d_{model}}) \\  
PE (pos,2i+1)&=\cos(pos/10000^{2i/d_{model}})
\end{aligned}
$$
这里的pos表示Token的序号，i则用来表示Token的向量的维度序号。这样的处理能够看出来，向量化的Token在位置编码时，从第一维到第$d_{model}$维被人为的赋予了不同的波长。而且两个一组的，第pos个Token和第pos+k个Token的结果可以通过线性变换得到（与pos无关的线性计算）

## Tranformer的考察问题
Q 为什么注意力计算QK的矩阵乘积的时候要除以一个$\sqrt {d_k}$ ?
Q 设计多头注意力、拆分完整注意力计算的意义在哪里？
