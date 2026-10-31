# zWhisFlow — ReactJS + Firebase V5

Ứng dụng quản lý tài chính cá nhân bằng JavaScript/React + Vite + Firebase Authentication/Firestore.

## Cài đặt và chạy

1. Sao lưu project hiện tại. Giữ nguyên `.env.local`, `.git` và toàn bộ dữ liệu Firebase trên cloud.
2. **Xóa thư mục `src` cũ**, thay bằng nguyên thư mục `src` trong ZIP này. Không dùng Merge.
3. Ghi đè `index.html`, `vite.config.js`, `package.json`, `public/`, `tests/` cùng các file cấu hình trong ZIP.
4. Chạy:

```bash
npm install
npm run test:logic
npm run build
npm run dev
```

Để deploy Github Pages (`expense-tracker` vẫn là tên repository, không phải tên thương hiệu):

```bash
npm run deploy
```

Vào Repository → Settings → Pages → `gh-pages / (root)`. `vite.config.js` dùng base `/expense-tracker/`; nếu repo của bạn có tên khác, sửa `base` cho khớp.

## Kết nối Firebase

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, ... được đọc từ `.env.local`. Các biến này không nằm trong ZIP. Bật Email/Password ở Firebase Authentication và publish Security Rules trong `firestore.rules`. `npm run deploy` chỉ đẩy website, **không** tự publish Firestore Rules.

## Quy tắc thu chi / sổ mừng

- `Sổ mừng & thăm hỏi` chứa dữ liệu nguồn ở collection `socialEntries`, không tạo bản sao trong collection `transactions`.
- Khi tổng hợp, “Mình gửi” = chi tiêu; “Họ gửi” = thu nhập của đúng tháng theo ngày ghi nhận; khoản mang ngày tương lai không tính là thực thu/chi cho đến ngày đó.
- Trên Sổ mừng, tiền được nhập theo **nghìn đồng**: `2000` được hiểu là `2.000.000 đ`. Dữ liệu Firestore luôn lưu **đồng Việt Nam** để đảm bảo tương thích các mục khác.
- Trên bảng desktop, tiền hiển thị theo **nghìn đồng** để tránh cuộn ngang. Di chuột để thấy tiền đầy đủ.
- Nếu bạn đã nhập thủ công một khoản thu/chi tương ứng với khoản trong Sổ mừng, hãy xóa bản ghi thủ công đó sau khi đối chiếu để không tính hai lần.

## Danh mục

Vào **Cài đặt → Quản lý danh mục** để thêm/đổi tên/ẩn danh mục thu, chi và đổi tên/thêm nhóm chi. Chọn **Lưu thay đổi** để đồng bộ Firestore. Các category ID luôn giữ nguyên; danh mục ẩn vẫn gắn với giao dịch cũ.

## Kiểm thử

`npm run test:logic` kiểm tra xử lý dữ liệu và một số yêu cầu cấu trúc; không thay thế cho kiểm thử giao diện trong trình duyệt. Kiểm tra `npm run build` rồi thử đăng nhập, ghi Sổ mừng, đối chiếu Thu/Chi/Tổng kết trước khi deploy.
