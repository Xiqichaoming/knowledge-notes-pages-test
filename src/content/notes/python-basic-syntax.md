---
title: "Python 的基础语法"
slug: "python-basic-syntax"
summary: "Python 基础语法、注释、变量、分支与循环结构笔记。"
category: "python"
categoryLabel: "Python Notes"
tags: ["python", "syntax", "basics"]
updated: "2026-06-30"
source: "Python/Python的基础语法.md"
draft: false
---
## 注释
### 单行注释
```python
print("hello,world") # 使用单个#号作为单行注释的开始，后面的部分即为注释的内容
```
**依据Python的PEP 8 标准，编写代码时使用单杠注释的规范应该遵守下面的约定：**
- 行内注释应该==至少使用两个空格==与行内代码相隔开
- 注释部分应该==以一个 # 和 一个空格 为开头==，再开始编写具体的内容
- 行内注释应该==保持其使用的必要性==，只对有需要进行即时解释的部分进行使用
- 注释的内容==应该是完整可读的句子==，保持一般语句的规范（如首字母大写）
### 多行注释（文档字符串）
```python
print("hello,world")
'''
使用三个单引号作为多行注释的开始和结束
在内部可以编写多行注释
'''
```
但是按照PEP规范，Python并不提供真正的多行注释
Python中实现多行注释的方式是使用连续多行的单杠注释
而使用三个单引号的方式本质上是定义了一个**文档字符串**
虽然我们可以使用三引号临时注释代码，但==实际上是创建了一个未赋值的字符串字面量==
文档字符串应该在定义语句（def、class、module）之后，使用简要描述+详细作用描述+参数+返回来描述一个模块或者函数的作用
## 变量
Python作为动态类型语言，为变量分配了下面几种类型：
1. int：整数类型
2. float：浮点数类型
3. complex：复数类型
4. str：字符串类型
5. bool：布尔类型
6. list：列表类型
7. tuple：元组类型
8. set：集合类型
9. None：唯一的空值类型
Python使用“鸭子类型”作为设计的核心观念，遵从“一切都是对象”的方式来设计语言的数据结构，具体的内容在[探究Python的类型设计底层](/notes/python-type-system/)中进一步探讨
变量名由**字母**、**数字**和**下划线**构成，数字不能开头
除了硬性规定的命名法则之外，Python还有一些别的惯例约束
- ==变量、函数、方法、模块名使用小写蛇形命名法==，如`user_name`
- ==常量使用大写蛇形命名法==，如`DEFAULT_TIMEOUT`
- ==类名使用驼峰命名法==，如`ClassName`
- ==受保护的变量使用单个下划线开头==，如`_internal_variable`
- ==私有的变量用两个下划线开头==，如`__private_variable`

## 运算符
| 运算符                                                                  | 描述              |
| -------------------------------------------------------------------- | --------------- |
| `[]`、`[:]`                                                           | 索引、切片           |
| `**`                                                                 | 幂               |
| `~`、`+`、`-`                                                          | 按位取反、正号、负号      |
| `*`、`/`、`%`、`//`                                                     | 乘、除、模、整除        |
| `+`、`-`                                                              | 加、减             |
| `>>`、`<<`                                                            | 右移、左移           |
| `&`                                                                  | 按位与             |
| `^`、`                                                                | `               |
| `<=`、`<`、`>`、`>=`                                                    | 小于等于、小于、大于、大于等于 |
| `==`、`!=`                                                            | 等于、不等于          |
| `is`、`is not`                                                        | 身份运算符           |
| `in`、`not in`                                                        | 成员运算符           |
| `not`、`or`、`and`                                                     | 逻辑运算符           |
| `=`、`+=`、`-=`、`*=`、`/=`、`%=`、`//=`、`**=`、`&=`、`\|=`、`^=`、`>>=`、`<<=` | 赋值运算符           |
|                                                                      |                 |
交换变量的值是写代码时经常用到的一个操作，但是在很多编程语言中，交换两个变量的值都需要借助一个中间变量才能做到，如果不用中间变量就需要使用比较晦涩的位运算来实现。在 Python 中，交换两个变量`a`和`b`的值只需要使用如下所示的代码。
```python
a, b = b, a
```
同理，如果要将三个变量`a`、`b`、`c`的值互换，即`b`的值赋给`a`，`c`的值赋给`b`，`a`的值赋给`c`，也可以如法炮制。
```python
a, b, c = b, c, a
```
需要说明的是，上面的操作并没有用到打包和解包语法，Python 的字节码指令中有`ROT_TWO`和`ROT_THREE`这样的指令可以直接实现这个操作，效率是非常高的。但是如果有多于三个变量的值要依次互换，这个时候是没有直接可用的字节码指令的，需要通过打包解包的方式来完成变量之间值的交换
## 分支结构
**Python的if-else结构：**
```python
status_code = int(input('响应状态码: '))
if status_code == 400:
    description = 'Bad Request'
elif status_code == 401:
    description = 'Unauthorized'
elif status_code == 403:
    description = 'Forbidden'
elif status_code == 404:
    description = 'Not Found'
elif status_code == 405:
    description = 'Method Not Allowed'
elif status_code == 418:
    description = 'I am a teapot'
elif status_code == 429:
    description = 'Too many requests'
else:
    description = 'Unknown status Code'
print('状态码描述:', description)
```
**Python的switch-case结构（match case）：**
```python
status_code = int(input('响应状态码: '))
match status_code:
    case 400 | 405: description = 'Invalid Request'
    case 401 | 403 | 404: description = 'Not Allowed'
    case 418: description = 'I am a teapot'
    case 429: description = 'Too many requests'
    case _: description = 'Unknown Status Code'
print('状态码描述:', description)
```

## 循环结构
**for-in结构：**
```python
import time

for i in range(3600):
    print('hello, world')
    time.sleep(1)
```
对于不需要用到循环变量的`for-in`循环结构，按照 Python 的编程惯例，我们通常把循环变量命名为`_`
**while结构：**
```python
total = 0
i = 1
while i <= 100:
    total += i
    i += 1
print(total)
```
`while`中的`break`和`continue`语句与其他语言才有同样的写法

## 列表
列表是Python的有序“数组”
Python中可以使用下面的语法来创建列表
```python
items1 = [35, 12, 99, 68, 55, 35, 87]
items2 = ['Python', 'Java', 'Go', 'Kotlin']
items3 = [100, 12.3, 'Python', True]
print(items1)  # [35, 12, 99, 68, 55, 35, 87]
print(items2)  # ['Python', 'Java', 'Go', 'Kotlin']
print(items3)  # [100, 12.3, 'Python', True]
```
Python支持使用不同类型的数据来构建列表，但是通常不会这么做
不同类别的数据存放在一个列表中增加了数据处理的复杂度
### 列表的操作
#### 拼接
我们可以使用`+`来拼接列表
```python
items5 = [35, 12, 99, 45, 66]
items6 = [45, 58, 29]
items7 = ['Python', 'Java', 'JavaScript']
print(items5 + items6)  # [35, 12, 99, 45, 66, 45, 58, 29]
print(items6 + items7)  # [45, 58, 29, 'Python', 'Java', 'JavaScript']
items5 += items6
print(items5)  # [35, 12, 99, 45, 66, 45, 58, 29]
```
#### 重复
可以使用`*`来重复列表
```python
print(items6 * 3)  # [45, 58, 29, 45, 58, 29, 45, 58, 29]
print(items7 * 2)  # ['Python', 'Java', 'JavaScript', 'Python', 'Java', 'JavaScript']
```
#### 判断元素
可以使用`in`或`not in`运算符判断一个元素在不在列表中
```python
print(29 in items6)  # True
print(99 in items6)  # False
print('C++' not in items7)     # True
print('Python' not in items7)  # False
```
#### 索引
可以使用`[]`来进行元素索引，元素位置可以是`0`到`N - 1`的整数，也可以是`-1`到`-N`的整数，分别称为正向索引和反向索引
```python
items8 = ['apple', 'waxberry', 'pitaya', 'peach', 'watermelon']
print(items8[0])   # apple
print(items8[2])   # pitaya
print(items8[4])   # watermelon
items8[2] = 'durian'
print(items8)      # ['apple', 'waxberry', 'durian', 'peach', 'watermelon']
print(items8[-5])  # 'apple'
print(items8[-4])  # 'waxberry'
print(items8[-1])  # watermelon
items8[-4] = 'strawberry'
print(items8)      # ['apple', 'strawberry', 'durian', 'peach', 'watermelon']
```
#### 切片
可以使用形如`[start:end:stride]`的运算符进行切片，切片可以访问列表中的多个元素
```python
print(items8[1:3:1])     # ['strawberry', 'durian']
print(items8[0:3:1])     # ['apple', 'strawberry', 'durian']
print(items8[0:5:2])     # ['apple', 'durian', 'watermelon']
print(items8[-4:-2:1])   # ['strawberry', 'durian']
print(items8[-2:-6:-1])  # ['peach', 'durian', 'strawberry', 'apple']
```
如果`start`值等于`0`，那么在使用切片运算符时可以将其省略；如果`end`值等于`N`，`N`代表列表元素的个数，那么在使用切片运算符时可以将其省略；如果`stride`值等于`1`，那么在使用切片运算符时也可以将其省略。所以，下面的代码跟上面的代码作用完全相同
```python
print(items8[1:3])     # ['strawberry', 'durian']
print(items8[:3:1])    # ['apple', 'strawberry', 'durian']
print(items8[::2])     # ['apple', 'durian', 'watermelon']
print(items8[-4:-2])   # ['strawberry', 'durian']
print(items8[-2::-1])  # ['peach', 'durian', 'strawberry', 'apple']
```
切片还可以用来修改列表的内容
```python
items8[1:3] = ['x', 'o']
print(items8)  # ['apple', 'x', 'o', 'peach', 'watermelon']
```
> 切片本身**不具备修改序列的能力**，能否通过切片修改，核心取决于**序列是否是可变的**，以及 Python 是否为该序列的`__setitem__`魔法方法实现了**切片对象的赋值逻辑**
> **列表能通过切片修改，是因为 Python 给列表的`__setitem__(self, slice_obj, value)`做了专门实现**，支持 “通过切片对象指定修改范围，用新值替换原范围的元素”；而字符串、元组是不可变序列，它们没有实现`__setitem__`（或实现后直接抛出异常），因此无法通过切片修改

#### 元素遍历
如果想逐个取出列表中的元素，可以使用`for-in`循环的，有以下两种做法。
方法一：在循环结构中通过索引运算，遍历列表元素。
```python
languages = ['Python', 'Java', 'C++', 'Kotlin']
for index in range(len(languages)):
    print(languages[index])
```
方法二：直接对列表做循环，循环变量就是列表元素的代表。

```python
languages = ['Python', 'Java', 'C++', 'Kotlin']
for language in languages:
    print(language)
```


### 列表的方法
#### 添加和删除
可以使用列表的`append`方法向列表中追加元素，使用`insert`方法向列表中插入元素
```python
languages = ['Python', 'Java', 'C++']
languages.append('JavaScript')
print(languages)  # ['Python', 'Java', 'C++', 'JavaScript']
languages.insert(1, 'SQL')
print(languages)  # ['Python', 'SQL', 'Java', 'C++', 'JavaScript']
```
可以用列表的`remove`方法从列表中删除指定元素，还可以使用`pop`方法从列表中删除最后一个元素
除此之外，列表还有一个`clear`方法，可以清空列表中的元素
还可以直接使用Python的关键字del来删除元素，性能稍优
```python
languages = ['Python', 'SQL', 'Java', 'C++', 'JavaScript']
if 'Java' in languages:
    languages.remove('Java')
if 'Swift' in languages:
    languages.remove('Swift')
print(languages)  # ['Python', 'SQL', C++', 'JavaScript']
languages.pop()
temp = languages.pop(1)
print(temp)       # SQL
languages.append(temp)
print(languages)  # ['Python', C++', 'SQL']
languages.clear()
print(languages)  # []
items = ['Python', 'Java', 'C++']
del items[1]
print(items)  # ['Python', 'C++']
```

#### 获取索引和频次
列表的`index`方法可以查找某个元素在列表中的索引位置
列表的`count`方法可以统计一个元素在列表中出现的次数
```python
items = ['Python', 'Java', 'Java', 'C++', 'Kotlin', 'Python']
print(items.index('Python'))     # 0
# 从索引位置1开始查找'Python'
print(items.index('Python', 1))  # 5
print(items.count('Python'))     # 2
print(items.count('Kotlin'))     # 1
print(items.count('Swfit'))      # 0
# 从索引位置3开始查找'Java'
print(items.index('Java', 3))    # ValueError: 'Java' is not in list
```

#### 排序和反转
表的`sort`操作可以实现列表元素的排序，而`reverse`操作可以实现元素的反转
```python
items = ['Python', 'Java', 'C++', 'Kotlin', 'Swift']
items.sort()
print(items)  # ['C++', 'Java', 'Kotlin', 'Python', 'Swift']
items.reverse()
print(items)  # ['Swift', 'Python', 'Kotlin', 'Java', 'C++']
```

### 列表生成式
Python中可以使用特殊的**生成式**语法来创建列表
```python
items = []
for i in range(1, 100):
    if i % 3 == 0 or i % 5 == 0:
        items.append(i)
print(items)
```
这样的代码可以写作下面的生成式：
```python
items = [i for i in range(1, 100) if i % 3 == 0 or i % 5 == 0]
print(items)
```
> 由于 Python 解释器的字节码指令中有专门针对生成式的指令（`LIST_APPEND`指令），而`for`循环是通过方法调用（`LOAD_METHOD`和`CALL_METHOD`指令）的方式为列表添加元素，方法调用本身就是一个相对比较耗时的操作，所以生成式方法性能上优于使用`for-in`循环和`append`方法向空列表中追加元素的方式。如果可以的话尽量使用生成式方法为好。


## 元组
元组也是多个元素按照一定顺序构成的序列，但元组是不可变类型，我们不可以修改元组中的元素内容。元组作为不可变类型，创建速度大幅度优于列表。元组使用`()`进行创建，但是对于单个元素的元组需要加上一个逗号进行区分，例如`('hello', )`
### 打包和解包
当我们把多个用逗号分隔的值赋给一个变量时，多个值会打包成一个元组类型；当我们把一个元组赋值给多个变量时，元组会解包成多个值然后分别赋给对应的变量
```python
# 打包操作
a = 1, 10, 100
print(type(a))  # <class 'tuple'>
print(a)        # (1, 10, 100)
# 解包操作
i, j, k = a
print(i, j, k)  # 1 10 100
```
有一种解决变量个数少于元素的个数方法，就是使用星号表达式。通过星号表达式，我们可以让一个变量接收多个值，代码如下所示。需要注意两点：首先，用星号表达式修饰的变量会变成一个列表，列表中有0个或多个元素；其次，在解包语法中，星号表达式只能出现一次
```python
a = 1, 10, 100, 1000
i, j, *k = a
print(i, j, k)        # 1 10 [100, 1000]
i, *j, k = a
print(i, j, k)        # 1 [10, 100] 1000
*i, j, k = a
print(i, j, k)        # [1, 10] 100 1000
*i, j = a
print(i, j)           # [1, 10, 100] 1000
i, *j = a
print(i, j)           # 1 [10, 100, 1000]
i, j, k, *l = a
print(i, j, k, l)     # 1 10 100 [1000]
i, j, k, l, *m = a
print(i, j, k, l, m)  # 1 10 100 1000 []
```

## 字符串
字符串的一般操作可以完全参照列表，支持索引、拼接、重复、判断
### 字符串方法
#### 大小写相关
```python
s1 = 'hello, world!'
# 字符串首字母大写
print(s1.capitalize())  # Hello, world!
# 字符串每个单词首字母大写
print(s1.title())       # Hello, World!
# 字符串变大写
print(s1.upper())       # HELLO, WORLD!
s2 = 'GOODBYE'
# 字符串变小写
print(s2.lower())       # goodbye
# 检查s1和s2的值
print(s1)               # hello, world
print(s2)               # GOODBYE
```
#### 查找
使用字符串的`find`或`index`方法可以进行查找
```python
s = 'hello, world!'
print(s.find('or'))      # 8
print(s.find('or', 9))   # -1
print(s.find('of'))      # -1
print(s.index('or'))     # 8
print(s.index('or', 9))  # ValueError: substring not found
```
还有逆向查找（从后向前查找）的版本，分别是`rfind`和`rindex`
```python
s = 'hello world!'
print(s.find('o'))       # 4
print(s.rfind('o'))      # 7
print(s.rindex('o'))     # 7
# print(s.rindex('o', 8))  # ValueError: substring not found
```
