---
title: "探究 Python 的类型设计底层"
slug: "python-type-system"
summary: "从运行时模型和设计理念理解 Python 类型系统的笔记。"
category: "python"
categoryLabel: "Python Notes"
tags: ["python", "types", "runtime"]
updated: "2026-06-30"
source: "Python/探究Python的类型设计底层.md"
draft: false
---
## 写在内容之前
Python是一门强类型设计的动态类型语言，这意味着Python本身满足两个要求：
- 强类型——禁止执行类型不匹配的指令
- 动态类型——程序在运行期间可以修改变量类型
-但同时Python实现这种机制的方式也十分独特，值得好好分析一番

在 C 语言中， “类型” 是**编译期的语法标记**（比如`int a`的`int`是编译器识别的标记，运行期消失），**变量是内存地址的别名**
而在 Python 里，**所有能被你操作的东西都是对象，变量只是对对象的引用**
也就是说，Python 的类型是**绑定到对象**的，变量只是一个 “无类型的引用标签”—— 你可以把`int`对象`1`赋值给`a`，再把`str`对象`"abc"`赋值给同一个`a`，本质是`a`这个标签从贴在`int`对象上，换成贴在`str`对象上，而变量本身没有类型属性

这其实就是体现的Python使用“一切皆对象”的方式来重构了设计
将语言中的所有内容底层用对象来实现可以做到使用统一的函数方法处理
```c
void a_function(PyObject *obj) // 接受PyObject对象类型的参数的函数可以处理所有符合类型的输入
```
这样借助C中的结构体来实现对象设计可以使得Python继续拥有安全的类型转换和多态机制，而具体的内容将在下面慢慢介绍

## 统一的对象模型
首先，Python的类型设计原则是“鸭子类型”
这源于著名的格言：“如果它走起来像鸭子，叫起来像鸭子，那么它就是鸭子”
这意味着在Python中，对象的重要性不在于其具体的类继承关系，而在于其是否实现了所需的方法和属性

而为了实现 “一切皆对象”，CPython为**所有对象**设计了**统一的底层 C 结构体基类`PyObject`**
所有类型的对象（包括类型对象本身）都基于这个结构体构建
CPython 中，**每一个 Python 对象**，在 C 层面都对应一个以`PyObject`为**首成员**的结构体 —— 这是 C 语言实现 “伪继承” 的技巧（首成员地址等于整个结构体地址，能强制类型转换）
基于这样的设计，任何一个以`PyObject`为**首成员**的派生结构体都可以使用`PyObject`类型的指针来引用（因为地址相同）
``` C
// CPython底层核心结构体：所有对象的根 
typedef struct _object 
{ 
	// 1. 类型指针：指向该对象的「类型对象」（核心！决定对象的类型） 
	PyTypeObject *ob_type; 
	// 2. 引用计数：用于垃圾回收（和类型设计无关，暂不深究） 
	Py_ssize_t ob_refcnt; 
} PyObject;
```
**这个结构体的核心是`ob_type`指针**—— 它直接决定了 “一个对象是什么类型”：
- 对于 Python 里的整数`1`（`int`对象），它的`ob_type`指针指向 **`int`类型对象的内存地址
- 对于`int`类型对象本身（`type(int)`是`type`），它的`ob_type`指针指向 **`type`元类对象的内存地址
- 对于`type`元类对象本身，它的`ob_type`指针**指向自己**（自举的核心）
简单说：
**Python 中判断一个对象的类型的实际方式就是取它的`ob_type`指针，看它指向哪个类型对象**
我们平时用的`type(obj)`函数，底层就是直接返回`obj`的`ob_type`指针指向的对象

而Python的类型设计的另一个要点就是“**类型也是对象**”
**类型对象**（比如`int`/`str`/`type`）在 C 层面也有自己的结构体，就是`PyTypeObject`
它是`PyObject`的 “子类结构体”（首成员是`PyObject`，这使得使用指向`PyTypeObject`的指针可以被解读为指向`PyObject`，这完成了C层面的继承）,其本体实现是一个超大的结构体，下面的代码只列出了部分比较关键的字段
```c
// 类型对象的底层结构体：所有类型的根 
typedef struct _typeobject 
{ 
	// 首成员：继承PyObject的核心字段（ob_type + ob_refcnt） 
	PyObject ob_base; 
	// 1. 类型名：比如"int"、"str"、"type"、"Person" 
	const char *tp_name; 
	// 2. 该类型实例的内存大小：创建对象时分配内存用 
	Py_ssize_t tp_basicsize; 
	// 3. 父类指针：实现继承（比如list的父类是object） 
	PyObject *tp_base; 
	// 4. 方法字典：保存该类型的所有方法（比如int的__add__） 
	PyObject *tp_dict; 
	// 5. 创建实例的函数：比如调用int(1)时底层执行的逻辑 
	initproc tp_init; 
	// ... 其他字段（属性、运算符、垃圾回收等） 
} PyTypeObject;
```
基于上面的两个CPython中最基础的类型系统中的结构体，可以构建起整个Python类型的系统
Python的类型可以总结为如下，具体的实现在下一个部分继续介绍

| <center>概念</center> | <center>英文</center> | <center>Python 层面</center> | <center>CPython 层面</center> | <center>作用</center> |
| ------------------- | ------------------- | -------------------------- | --------------------------- | ------------------- |
| 对象                  | Instance            | 类型的实例                      | `PyObject`（或子类）结构体实例        | 承载数据和行为（实际使用的实体）    |
| 类型                  | Class               | 元类的实例，对象的类型                | `PyTypeObject`结构体实例         | 定义对象的属性、方法，创建对象     |
| 元类                  | Metaclass           | 类型的类型                      | `type`对应的`PyTypeObject`实例   | 定义类的属性、方法，创建类       |

## 类型的底层实现基础
### 1.声明定义两个结构体
在CPython中，类型的搭建首先是两个基础结构体`PyObject`和`PyTypeObject`的声明与定义
由于两者定义内部存在互相的引用，所以这里是使用的**不完整声明**的方式来构建的
生成的`python.exe`中，我们已经可以解读`PyObject`和`PyTypeObject`这两个结构体类型，知道如何为它们的实例分配内存、计算大小
### 2.创建核心全局变量
在实际启动Python解释器之后，程序会先执行类型系统的实际创建过程
依据CPython的主函数流程，程序会分配内存给`PyTypeObject`的实例，创建对应的全局变量
这些全局变量包括：
- `PyType_Type`：后续将作为 Python 层`type`元类的实例
- `PyBaseObject_Type`：后续将作为 Python 层`object`基类的实例
- `PyLong_Type/PyUnicode_Type/...`：后续要成为`int/str/...`等内置类型的实例
但是此时这些变量只是**分配了内存的空壳**，内部的`ob_base`（PyObject）字段仅初始化了引用计数，**所有指针字段（如`ob_type`）都是 NULL**，还不是合法的类型对象
比如作为type元类的实例变量PyType_Type创建的流程就可以用下面的图来表示
![Pasted image 20260131112718.png](/knowledge-notes-pages-test/assets/Pasted%20image%2020260131112718.png)

但是完成这一步创建之后其实本质上还没有真正意义上完成变量的全部创建
为了完成剩下部分的创建，还需要执行对应的调用初始化函数`_PyType_Init()`，**手动为 PyType_Type 补全指针**
这个函数的内容可以简要写为下面的代码：
```c
// 核心自举代码（简化） 
PyType_Type.ob_base.ob_type = &PyType_Type; // 自己的类型指针指向自己
PyType_Type.ob_base.ob_refcnt = 1; // 初始化引用计数
```
执行完成的关键效果可以如下图所示
![Pasted image 20260131113115.png](/knowledge-notes-pages-test/assets/Pasted%20image%2020260131113115.png)
通过执行最关键的初始化函数，我们可以**成功获取到第一个合法的、可使用的 PyTypeObject 实例**
此时`PyType_Type`成为完整的 type 元类实例，对应 Python 层的`type`，具备了创建其他类的能力

在`_PyType_Init()`中，相似的操作还会为`PyBaseObject_Type`（object 基类）补全指针，**将其类型绑定到 PyType_Type**（即 object 的类型是 type），让它成为合法的类型对象
这个部分的内容可以简要写为下面的代码：
```c
// 核心代码（简化） 
PyBaseObject_Type.ob_base.ob_type = &PyType_Type; // object的类型是type 
PyBaseObject_Type.tp_base = NULL; // object无父类 
_PyType_Ready(&PyBaseObject_Type); // 完成最终初始化（方法字典等）
```
![Pasted image 20260131114404.png](/knowledge-notes-pages-test/assets/Pasted%20image%2020260131114404.png)
经过这样一番操作，`PyBaseObject_Type`成为 Python 层的`object`基类，所有后续类型都会继承它
完成这两步之后，我们就可以开始延伸“对象链”和“类型链”了
对于后续的内部基础类型，我们在初始化中将他们的两个指针分别指向`PyType_Type`和`PyBaseObject_Type`，例如下图所示
![Pasted image 20260131115957.png](/knowledge-notes-pages-test/assets/Pasted%20image%2020260131115957.png)

## 创建类型实例时Python做了什么
有了上面的铺垫，我们可以分析Python在执行变量创建时到底做了什么
比如以`x = 1000`这样一个语句为例
1. Python解释器解析这句语句，词法分析器和语法分析器识别出这是一个右侧为**字面量1**的赋值语句
2. 这是一个没被创建过的值，需要为其**分配一个新的整数对象**（否则进行复用）
3. 将变量名`x`绑定到这个整数对象的内存地址，此时`x`将成为一个引用标签指向一个整数对象
创建的关键在于步骤2：如何创建并分配好一个对象

接受到需要创建的变量值是一个数值1，将对应使用`PyLong_FromLong(1000)`创建 int 实例
```c
// Objects/longobject.c 核心函数：整数字面量创建入口 
PyObject *PyLong_FromLong(long v) // v=1000（C语言long类型） 
{ 
	PyLongObject *op; // 定义PyLongObject指针，接收新创建的实例 
	
	// 【缓存判断】1000超出-5~256，条件不成立，走非小整数分支 
	if (v >= -5 && v <= 256) 
	{ // 小整数缓存分支（x=100走这里，x=1000跳过） 
		return (PyObject *)&_PyLong_Small_ints[v + 5]; 
	} 
	
	// 【非小整数核心逻辑】开始全新创建实例（x=1000走以下所有步骤） 
	// 步骤2.2：调用内部函数_PyLong_New，分配PyLongObject内存 
	op = _PyLong_New(1); // 入参1：表示ob_size=1（1000是小数值，数组长度1即可存储） 
	if (op == NULL) 
	{ 
		return NULL; // 内存分配失败，Python层抛MemoryError 
	} 
	
	// 步骤2.3：初始化数值字段，将C的long值1000存入ob_digit数组 
	op->ob_digit[0] = (digit)v; // digit是CPython自定义的数值类型，适配跨平台 
	
	// 步骤2.4：返回新实例（强转为PyObject*，所有对象统一用PyObject*管理） 
	return (PyObject *)op; 
}
```
Python解释器会在运行时自动创建-5到256的int对象并加入缓存以增快速度
对于不在此区间的数字，将执行一套标准操作：
1. 创建一个`PyLongObject`类型指针，准备为其分配内存空间
2. 从`_PyLong_New`中获取实际的内存并完成器具体实例结构体的创建
3. 使用`op->ob_digit[0] = (digit)v;`语句完成真正意义上的数值赋值，实际上是将`PyLongObject`结构体中的对应字段变量值完成了赋值操作
4. 完成Python语法层面的变量名与实际内存指向的映射
而`PyLongObject`结构体的定义如下：
```c
typedef struct {
    PyObject_HEAD           // 宏展开为 ob_refcnt + ob_type
    long ob_ival;           // 存储实际整数值（C long）
} PyLongObject;
```
`_PyLong_New`函数的实现大致可以概括如下：
```c
static PyLongObject *_PyLong_New(Py_ssize_t size) // size=1（传入的数组长度）当待创建数字为超大数字时，此处输入的size将不再为1
{  
	PyLongObject *op; // 1. 分配内存：按PyLongObject结构体大小分配，底层调用C的malloc 
	op = (PyLongObject *)PyObject_MALLOC(sizeof(PyLongObject)); 
	if (op == NULL) 
	{ 
		PyErr_NoMemory(); // 内存分配失败，设置错误标识 
		return NULL; 
	} 
	
	// 2. 初始化【继承字段】（所有Python对象都需要执行） 
	op->ob_base.ob_refcnt = 1; // 引用计数初始化为1（垃圾回收的基础，无引用时会被回收） 
	op->ob_base.ob_type = &PyLong_Type; // 绑定类型指针→标记为int类型！ 
	
	// 3. 初始化【PyLongObject专属基础字段】 
	op->ob_size = size; // 设置数组长度为1，和传入的size一致 
	// 4. 返回分配并初始化基础字段的PyLongObject空实例 
	return op; 
}
```
也就是说，几乎所有类似的基础类型变量创建在实际分配对象时都有下面的步骤：
1. 执行类型单独的创建函数
2. 创建函数中先执行内存分配
3. 内存分配时创建一块给**单独与类型配套的结构体变量**（如`PyLongObject`）的空间
4. 为这个结构体变量的`PyObject`头完成赋值（`ob_type`和`ob_refcnt`）
5. 初始化结构体变量的专属字段（每一种类型有自己单独的属性）
6. 将这个结构体变量的地址返回给创建函数
7. 创建函数再**完成事实上的数值写入步骤**
8. 最后以`(PyObject *)`的形式统一返回

## 小结
- **PyObject 是所有对象的通用抽象基类**：其结构体设计让所有 Python 对象的底层结构体都能以它为首成员实现伪继承，因此所有对象都可通过`PyObject*`指针统一操作，这是 CPython “一切皆对象” 的核心物理实现。
- **PyTypeObject 是类型的模板定义**：其结构体字段规定了一个 Python 类型需要满足的规范、实现的能力（如实例创建、运算符、方法），是定义 “什么是类型” 的底层模板。
- **PyTypeObject 的实例是合法的 Python 类型对象**：如 PyLong_Type（对应 Python 层的`int`类）、PyUnicode_Type（对应`str`类），这些实例填充了 PyTypeObject 模板的所有具体字段，类型的所有操作方法（如 int 的加法、str 的拼接）都以函数指针的形式保存在对应的类型对象中。
- **PyXXXObject 是基础类型的实例数据载体**：每种基础类型都有专属的 PyXXXObject 结构体（如 int→PyLongObject、list→PyListObject），用于存储该类型**实例对象**的具体业务数据（如 int 的数值、list 的元素指针）；通用的`PyObject*`指针可指向任意 PyXXXObject 实例，再通过实例的`ob_type`核心字段，就能找到该实例对应的 PyTypeObject 类型对象（如 int 实例的`ob_type`指向 PyLong_Type），这是 CPython 底层判断对象类型的唯一依据。
