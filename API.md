# 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`

---

## 用户模块

### 注册 `POST /user/register`

**请求：**

```json
{
  "username": "xiaohua",
  "password": "123456",
  "email": "xiaohua@example.com"
}
```

**响应：**

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": "uuid-xxx",
    "username": "xiaohua"
  }
}
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| username | string | 必填，最小2字符 | 用户名，唯一 |
| password | string | 必填，最小6字符 | 密码（bcrypt加密） |
| email | string | 必填，合法邮箱 | 邮箱，唯一 |

---

### 登录 `POST /user/login`

**请求：**

```json
{
  "username": "xiaohua",
  "password": "123456"
}
```

**响应：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "id": "uuid-xxx",
    "username": "xiaohua",
    "email": "xiaohua@example.com",
    "avatar": "https://..."
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| username | string | 用户名 |
| password | string | 密码 |

---

## 响应码说明

| code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误 / 用户名已存在 |
| 401 | 用户名或密码错误 |
| 403 | 账号已被禁用 |

---

## 技术实现

| 项目 | 实现 |
|------|------|
| 框架 | NestJS |
| 数据库 | MySQL 8.0 (Docker) |
| ORM | Prisma 5 |
| 密码加密 | bcrypt (强度10) |
| Token | JWT (7天过期) |
| 数据校验 | class-validator |

---

## 数据库表

### users 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| password | VARCHAR(255) | 加密密码 |
| email | VARCHAR(100) | 邮箱，唯一 |
| avatar | VARCHAR(500) | 头像URL |
| status | TINYINT | 1正常 0禁用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| last_login | DATETIME | 最后登录时间 |

### user_tokens Token表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| user_id | VARCHAR(36) | 关联用户 |
| token | VARCHAR(500) | JWT Token |
| device_info | VARCHAR(200) | 设备信息 |
| expires_at | DATETIME | 过期时间 |
| created_at | DATETIME | 创建时间 |
