- Format của header Content-Range: bytes <start> - <end>/<videoSize>
- Ví dụ: Content-Range: bytes 1048567-3145727/3145728
- Yêu cầu là `end` phải luôn nhỏ hơn `videoSize`
- ❌ 'Content-Range': 'bytes 0-100/100'
- ✅ 'Content-Range': 'bytes 0-99/100'

- Còn Content-Length sẽ là end - start + 1. Đại diện cho khoảng cách
- Dễ hình dung, mọi người tưởng tượng từ số 0 đến số 10 thì ta có 11 số
- byte cũng tương tự, nếu start = 0, end = 10 thì ta có 11 byte
- công thức là end - start + 1

chunkSize = 50
videoSize = 100
|0------------50|51--------------99|100 (end)

- stream 1 : start = 0, end = 50, contentLength = 51
- stream 2 : start = 51, end = 99, contentLength = 49
