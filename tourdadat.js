function displayBookedTours() {
    const danhSach = document.getElementById('danhSachTourUL');
    if (!danhSach) return;

    const nguoiDungDangNhap = localStorage.getItem('nguoiDungDangNhap');
    const tatCaTour = JSON.parse(localStorage.getItem('bookedTours')) || [];

    // ✅ LỌC THEO OWNER
    const danhSachTour = tatCaTour.filter(
        tour => tour.owner === nguoiDungDangNhap
    );

    danhSach.innerHTML = '';

    if (danhSachTour.length === 0) {
        danhSach.innerHTML = '<li class="empty">Chưa có tour nào được đặt.</li>';
        return;
    }

    danhSachTour.forEach((tour, i) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${i + 1}. ${tour.title}</strong>
          <button class="xoa-tour" data-id="${tour.maDonHang}" style="color:#fff;background:none;border:none;cursor:pointer;">❌</button>

          <div>Mã đơn hàng: <strong>${tour.maDonHang}</strong></div>
          <div>Mã thanh toán: <strong>${tour.maThanhToan}</strong></div>
          <div>Giá: ${Number(tour.price).toLocaleString('vi-VN')}₫</div>
          <div>Ngày đặt: ${tour.date}</div>

          <div><strong>👤 Thông Tin Khách Hàng:</strong></div>
          <div>Họ tên: ${tour.user.hoTen}</div>
          <div>Email: ${tour.user.email}</div>
          <div>SĐT: ${tour.user.soDienThoai}</div>
        `;
        danhSach.appendChild(li);
    });

    document.querySelectorAll('.xoa-tour').forEach(btn => {
        btn.onclick = () => xoaTourDaDat(btn.dataset.id);
    });
}

function xoaTourDaDat(maDonHang) {
    const tours = JSON.parse(localStorage.getItem('bookedTours')) || [];
    const newList = tours.filter(t => t.maDonHang !== maDonHang);
    localStorage.setItem('bookedTours', JSON.stringify(newList));
    displayBookedTours();
}

document.addEventListener('DOMContentLoaded', displayBookedTours);
