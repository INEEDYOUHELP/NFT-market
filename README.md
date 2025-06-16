# 项目名称：se-2

## 项目简介
本项目是一个基于区块链的NFT项目，使用Hardhat进行智能合约开发，Next.js构建前端，MySQL作为数据库。项目采用Yarn工作区（workspaces）管理多个子包，包括hardhat、nextjs和mysql模块。

## 主要功能
- 智能合约开发与部署（Hardhat）
- 前端Web应用（Next.js）
- 数据库管理（MySQL）
- 支持Pinata SDK进行NFT元数据管理

## 安装步骤
1. 确保已安装Node.js和Yarn（推荐使用Yarn 3.2.3）
2. 克隆项目后，在项目根目录执行：
   ```bash
   yarn install
   ```
3. 安装完成后，会自动执行husky安装（用于Git钩子）

## 使用方法
### 智能合约相关命令
- 生成账户：`yarn account`
- 启动本地链：`yarn chain`
- 部署合约：`yarn deploy`
- 编译合约：`yarn compile`
- 验证合约：`yarn verify`
- 运行测试：`yarn test`

### 前端相关命令
- 启动开发服务器：`yarn start`
- 构建生产版本：`yarn next:build`
- 代码检查：`yarn next:lint`
- 类型检查：`yarn next:check-types`

### 其他命令
- 格式化代码：`yarn format`
- 部署到Vercel：`yarn vercel`

## 项目结构
- `packages/hardhat`：智能合约开发
- `packages/nextjs`：前端应用
- `packages/mysql`：数据库相关代码

## 依赖
- 主要依赖：ethers、web3、antd、express、mysql、pinata-sdk等
- 开发依赖：husky、lint-staged、TypeScript等

## 许可证
详见项目根目录下的LICENCE文件。

## 功能介绍

### 智能合约模块
- **合约开发**：使用Hardhat框架进行智能合约的编写、编译和测试。
- **合约部署**：支持将合约部署到本地测试链或主网。
- **合约验证**：通过Hardhat插件验证合约代码，确保安全性和正确性。

### 前端应用模块
- **用户界面**：使用Next.js构建现代化的用户界面，支持响应式设计。
- **数据交互**：通过API与智能合约和数据库进行交互，实现数据的实时更新和展示。
- **用户认证**：支持用户登录和注册功能，确保数据安全。

### 数据库模块
- **数据存储**：使用MySQL数据库存储用户信息和交易记录。
- **数据查询**：提供高效的数据查询接口，支持复杂的数据分析。

### NFT管理
- **元数据管理**：使用Pinata SDK进行NFT元数据的上传和管理。
- **NFT展示**：支持在平台上展示用户的NFT资产，提供详细的资产信息。

### 其他功能
- **代码质量**：使用husky和lint-staged确保代码质量，防止低质量代码的提交。
- **自动化测试**：支持自动化测试，确保各个模块的功能正常。 
