# Error Handling

- Trong ExpressJS có 2 loại handler

## Request handler

Nhận request từ client và trả về response

Với mỗi request handler thì chúng ta sẽ có 3 tham số là `req` , `res` , `next`

Nếu không dùng `next` thì không cần khai báo cũng được

```ts
app.get('/users', (req, res, next) => {
  // do something
  res.send('Hello world')
})
```

```ts
app.post(
  '/register',
  (req, res, next) => {
    // do something
    console.log('request handler 1')
    // next(new Error('Lỗi rồi bạn êi'))
    throw new Error('Lỗi rồi bạn êi') // === next(new Error('Lỗi rồi bạn êi'))
  },
  (req, res, next) => {
    console.log('request handler 2')
    next()
  },
  (req, res, next) => {
    console.log('request handler 3')
    res.json({ message: 'Request' })
  },
  (err, req, res, next) => {
    console.log('Lỗi là: ' + err.message) // Lỗi là: Lỗi rồi bạn êi
    res.status(400).json({ error: err.message })
  }
)
```

- Gọi `next()` để chuyển request sang request handler tiếp theo
- Gọi `next(err)` để chuyển request sang error handler tiếp theo

Khi xảy ra lỗi trong synchronous handler thì tự động sẽ được chuyển sang error handler
Khi xảy ra lỗi trong asynchronous handler thì phải gọi `next(err)` cho bằng được để chuyển sang error handler

## Error handler

Nhận error từ request handler và trả về response

Với mỗi error handler thì chúng ta bắt **buộc phải khai báo đủ có 4 tham số** là `err`, `req`, `res`, `next`.

Nếu chỉ khai báo 3 tham số thì nó sẽ được coi là request handler

## Format lỗi trả về cho người dùng

Chúng ta nên thống nhất format lỗi trả về cho người dùng

Lỗi thường

```ts
{
  message: string
  error_info?: any
}
```

Lỗi validation

```ts
{
  message: string,
  errors: {
    [field: string]: {
      msg: string
      [key: string]: any
    }
  }
}
```
