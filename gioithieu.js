function capNhatMenuTaiKhoan() {
    const tenDangNhap = localStorage.getItem("nguoiDungDangNhap");
    const menu = document.getElementById("menuTaiKhoan");

    if (tenDangNhap && menu) {
      menu.innerHTML = `
        <p>👤 <strong>${tenDangNhap}</strong></p>
        <button onclick="dangXuat()">Đăng xuất</button>
      `;
    }
  }

  function dangXuat() {
    localStorage.removeItem("nguoiDungDangNhap");
    localStorage.removeItem("userData");
    location.href = "index.html"; 
  }
  
  // Gọi hàm khi trang tải
  document.addEventListener("DOMContentLoaded", capNhatMenuTaiKhoan);