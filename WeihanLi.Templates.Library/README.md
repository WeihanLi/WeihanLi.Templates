# WeihanLi.Templates.Library

## Intro

used for create a class library project

## Install

首先要确保你已经安装 dotnet core 2.0 以上的 sdk，在命令行中执行以下命令

`dotnet pack -o out`

nuspecFile => 在 out 目录中生成的 `nuspec` 文件

``` bash
dotnet new -i WeihanLi.Templates.Library
```

## Use

- 默认配置生成

  ``` bash
  dotnet new weihanli-lib -n WeihanLi.Web.Extensions
  ```

- 不生成测试项目
  
  如果要生成项目的时候不生成测试项目，可以在命令后面加上一个参数: `--includeTest false`

  for example:

  ``` bash
  dotnet new weihanli-lib -n WeihanLi.Web.Extensions --includeTest false
  ```
