# https://duthanhduoc.com/blog/on-tap-callback-promise-async-await

- 1 promise mà nó reject thì sẽ làm crash ứng dụng. Muốn không bị crash thì phải luôn `catch` nó
- `catch` mà không không làm gì trong đó (ví dụ không console.log) thì khi nó lỗi không biết lỗi chỗ nào đấy (lỗi vô hình)
- Một khi đã `.catch` thì cái chain phía sau luôn luôn là `promise.resolve`, trừ khi bạn `throw` hoặc `return Promise.reject trong .catch` thì chain phía sau lọt vào `catch`

# Async / await

- Một khi đã try catch thì function luôn return một `promise.resolve(x)`

# Git status

- git status: xem bạn đang ở branch nào và trạng thái branch của bạn so với origin như thế nào (Cái này nhiều lúc ko chính xác vì dữ liệu đã được thay đổi trên origin, muốn chính xác phải `git fetch` để tải về dữ liệu mới nhất)
- Trạng thái file trong dự án, file nào đang được git track (theo dõi)

## Git log

- Dùng để hiển thị các commit gần đây nhất
- git log --oneline : hiển thị dạng rút gọn
- Dùng q để thoát khi vào giao diện git log

## Git remote

- Để tạo mối liên kết giữa local repo và remote repo

## Tạo nhánh mới

- git branch tên_nhánh : sẽ tạo nhánh mới
- git checkout -b tên_nhánh: sẽ tạo nhánh mới và di chuyển sang nhánh ta vừa tạo
- git switch -c tên_nhánh = git checkout -b tên_nhánh
- git branch: hiển thị các nhánh
- git branch -r: hiển thị các nhánh trên remote
- git branch -a: hiển thị các nhánh ở local và trên remote
- git fetch : cập nhập lại các nhánh trên remote về máy
- git fetch -p: cập nhập lại các branch đã bị xoá trên remote
- git checkout tên_nhánh = git switch tên_nhánh: chuyển nhánh
- git branch -m tên_nhánh_cần_sửa: sửa tên nhánh
- git branch -m tên_nhánh_muốn_sửa tên_nhánh_sau_sửa: đứng từ nhánh khác (VD đứng từ nhánh main có để sửa nhánh feature/Login -> feature/FuncLogin: git branch -m feature/Login feature/FuncLogin)
  (Chỉ đổi được tên branch ở dưới local)
- git branch -D tên_nhánh_cần_xoá: Xoá branch ở local
- git push origin --delete tên_nhánh_cần_xoá: Xoá 1 branch ở trên remote
- git push -u origin tên_nhánh: dùng để đẩy (push) các thay đổi từ nhánh hiện tại của bạn lên nhánh có tên là <tên_nhánh> trên máy chủ từ xa (remote server) có tên là origin (Sau lần đầu tiên commit bằng câu lệnh này thì những lần sau chỉ cần git push mà không cần git push origin tên_nhánh nữa)

## Git Merge

Trong quá trình Merge có bị conflict thì thao tác theo thứ tự

1. Tìm file conflict trong tab source và fix nó
2. Sau khi fix hết các file bị conflict rồi thì dùng `git add .` hoặc add từng file
3. Tiến hành thêm commit cho những file vừa fix conflict bằng câu lệnh `git merge --continue --no-edit`, nếu muốn edit commit thì `git merge --continue`, còn nếu muốn tự viết commit thì cứ `git commit -m 'thông điệp'` như thường
4. push hết lên vơí câu lệnh `git push`

**git pull** là sự kết hợp giữa `git fetch` và `git merge`

## Hoàn tác Git reset

Khi mà lỡ merge request và đã push hoặc chưa push lên git mà chúng ta muốn hoàn tác

- git reset --hard mã_has (VD: git reset --hard b1ca690)
- git push -f : ép git commit lên sau khi đã reset (báo với git mà commit ở local của chúng ta mới chính xác và git hãy dùng các commit ở local của cta)
  (Lưu ý: khi dùng 2 lệnh git trên nó có thể làm mất commit của người khác trên origin)

## Git rebase

- Lấy tất cả các commit của `branchTarget` làm lại base (gọi là re-base) cho mình, các commit của mình mà khác so với `branchTarget` sẽ bị thay đổi hash và thêm vào sau cùng

## Kỹ thuật hoàn tác

- git checkout tên_file : đưa file này về trạng thái ban đầu
- git restore tên_file = git checkout tên_file
- git reset tên_file : đưa file từ khu vực staged changes về changes
- git restore -S tên_file = git reset tên_file
- git restore --source=mã_has tên_file: Khôi phục file về 1 thời điểm trong quá khứ
  (VD: git restore --source=4aefa2a README.md)

## Git reset

- git reset mã_has (default là --mixed): đưa thay đổi về changes
- git reset --soft mã_has => đưa thay đổi về staged changes
- git reset --hard mã_has => mất luôn thay đổi
- git reset --merge mã_has => giống --hard nhưng an toàn hơn, chỉ làm mất những thay đổi cần thiết

## Git revert

Git revert sẽ tạo commit đối ngược với commit trước (Xoá đi)

- git revert mã_has --no-edit : --no-edit để git ko hỏi cta có muốn exit message ko

## Cách gom tất cả commit thành 1 commit duy nhất

- git rebase -i HEAD~3 (-i: interactive 3: lấy tại vị trí thứ 3 từ trên xuống HEAD:là con trỏ trỏ đến vị trí hiện tại của bạn) => Chuyển sang chế độ `switch to text`
  (Chỉ có thể gộp thằng phía sau vào thằng phía trước)
  2096eed (HEAD -> feature,origin feature) Test
  428747f Add test.js
  dacdc54 Add test.html
  =>> Chỉ được gộp 2096eed và 428747f vào dacdc54

## Cách chèn thay đổi vào commit cuối cùng

- git commit --amend
- git push -f (Thay đổi 1 mã has phải push -f)

## Khi chưa commit thì sẽ ko chuyển được branch khác

- git stash : nó sẽ làm cho file trở lại trạng thái ban đầu và đánh dấu 1 vị trí bạn stash tại commit nào
  => Nhảy sang nhánh khác để xử lý việc khác rồi quay trở lại nhánh vừa stash và muốn lấy lại đoạn code vừa stash
- git stash list -p (Xem danh sách stash (-p: để xem chi tiết))
- git stash show show stash@{0} -p: xem chi tiết 1 stash (0 là cái stash mình muốn xem)
- git stash apply stash@{0}: apply lại cái code của ta
- git stash drop stash@{0} : sau khi apply xong muốn xoá stash thì xử dụng lệnh này
- git stash clear : xoá toàn bộ stash

  /////////////////////////////////
  => Video 19 phải là video 7
  => Video 7 lại là video 17
  => Video 20 phải là video 27
  => Video 33 tạo SSH Key
