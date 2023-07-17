# LabManagement

## API Interface

### Login

用于登录, 登录成功后返回一个JWT, 前端需要将该JWT保存在本地, 并在每次请求时将该JWT放在请求头中, 以便后端验证.  

> url: /login  
> Auth: False  
> method: POST  
> Request Body:

```json
{
    "username": "xxx",
    "password": "xxx"
}
```

`NOTICE:` the password is encrypted by `sha256`
> Respond Body:

```json
{
    "status": "success",
    "token": "xxxxx"
}
```

### List

写出所有实验的相关信息, 包括实验名称, 实验开始时间, 实验结束时间.  

> url: /List  
> Auth: True  
> method: GET  
> URL Query: None  
> Respond Body:

```json
{
    "status": "success",
    "labs": [
        {
            "name": "lab1",
            "startTime": "xxxxxxx",
            "endTime": "xxxxxxx",
        },
        {
            "name": "lab2",
            "startTime": "xxxxxxx",
            "endTime": "xxxxxxx",
        },
        {
            "name": "lab3",
            "startTime": "xxxxxxx",
            "endTime": "xxxxxxx",
        }
    ]
}
```

### Reserve

学生预约实验.

> url: /reserve  
> Auth: True  
> method: POST  
> Request Body:

```json
{
    "lab": "lab1",
    "startTime": "xxxx",
    "endTime": "yyyy",
}
```

> Respond Body:

```json
{
    "status": "success",
    "message": ""
}
```

### Punch

学生打卡签到, URL Query中需要带上token, 用于验证用户身份, 该token由二维码给出.

> URL: /punch  
> Auth: False  
> method: POST  
> URL Query: token=xxxxx  
> Request Body:

```json
{
    "lab": "lab1",
    "username": "xxxx",
    "password": "xxxx"
}
```

> Respond Body:

```json
{
    "status": "success",
    "message": ""
}
```

### GenPunchToken

生成签到用到的token, 前端获取到该token后生成二维码, 用于学生签到.

> URL: /genPunchToken  
> Auth: True (Only for teachers)  
> method: GET  
> URL Query: lab=lab1  
> Request Body: None  
> Respond Body:

```json
{
    "status": "success",
    "token": "xxxxx"
}
```

### GradeSubmit

老师提交成绩.  

> URL: /gradeSubmit  
> Auth: True(Only for teachers)  
> method: POST  
> Request Body:

```json
{
    "lab": "lab1",
    "username": "xxxx",
    "score": 100
}
```

> Respond Body:

```json
{
    "status": "success",
    "message": ""
}
```

### QueryScore

查询成绩.

> URL: /queryScore  
> Auth: True  
> method: GET  
> URL Query: None  
> Request Body:

```json
{
    "username": "xxxx", 
    "lab": "lab1"
}
```

`username` field is optional, if not given, return all students' score of the lab; `lab` field is optional, if not given, return all labs' score of the student.
> Respond Body:

```json
{
    "status": "success",
    "recodes": [
        {
            "lab": "lab1",
            "username": "xxxx",
            "score": "85"
        },
        {
            "lab": "lab2",
            "username": "yyyy",
            "score": "89"
        }
    ]
}
```

## MySQL

### Table

#### User

> 该表为用户表，每个用户对应一条记录

| User | Password(before sha256) |
| ---- | -------- |
| root | root     |
| 2021211002 | 2021211002 |

#### Lab

> 该表为实验表，每个实验对应一条记录

| Lab  | StartTime | EndTime |
| ---- | --------- | ------- |
| 模电C    | 1689563264 | 1689649664 |
| 数电A    | 1687057664 | 1687748864 |
| 大物C    | 1690340864 | 1690686464 |

#### Reservation

> 该表为预约表，每次预约后会在该表中插入一条记录

| Lab  | User | StartTime | EndTime | ReservationTime | Status |
| ---- | ---- | --------- | ------- | --------------- | ------ |
| 模电C    | 2021211002 | 1689563264 | 1689649664 | 1689563264 | 1 |
| 数电A    | 2021211002 | 1687057664 | 1687748864 | 1687057664 | 1 |

#### Score

> 该表为成绩表，每次实验结束后会在该表中插入一条记录

| User | Lab  | Score |
| ---- | ---- | ----- |
| 2021211002 | 模电C    | 85   |
| 2021211002 | 数电A    | 89   |

#### AuthToken

> 该表为用户登录凭证表，每次登录后后端向前端返回一个JWT, 并在该表中插入

| User | Token |
| ---- | ----- |
| 2021211002 | xxxxx |
