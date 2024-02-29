[POST]

```ts
Logout
=> (gửi lên BE) header: Authorization: Bearer access_token
                        body: {refresh_token}
=> users/logout
=> Validate access_token
  +)coi có gửi lên hay không
  +)verify // đúng định dạng hoặc hết hạn hay chưa
  Gán decoded_authorization vào req // biết được ông vừa gửi req là ông nào
=> Validate refresh_token
  +)tồn tại
  +)verify
  +)tồn tại trong db
  Gán decoded_refresh_token vào req
=> Xoá refresh_token trong db
=> Trả về message logout thành công
```

?: Tại sao gửi access_token làm gì?
Vì muốn user_A thì chỉ có user_A logout
?: Tại sao gửi refresh_token làm gì?
Vì lưu refresh_token khi login và register nên khi logout sẽ xoá refresh_token đấy trong db để refresh_token không còn hiệu lực
