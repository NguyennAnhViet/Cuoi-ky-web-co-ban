// ==================== CONSTANTS ====================
const STORAGE_KEYS = {
  USER_DATA: 'userData',
  LOGGED_IN_USER: 'nguoiDungDangNhap',
  BOOKED_TOURS: 'bookedTours',
  COUNTER: 'soPhieu'
};

const ADMIN_CREDENTIALS = {
  email: 'admin@tour.com',
  password: '123456',
  name: 'Admin',
  role: 'admin'
};

const ELEMENTS = {
  accountMenu: 'menuTaiKhoan',
  adminMenu: 'menuQuanTri',
  registerForm: 'formDangKy',
  loginForm: 'formDangNhap',
  paymentModal: 'thanhToan',
  paymentForm: 'formThanhToan',
  bookedList: 'danhSachDaDat',
  bookedToursUL: 'danhSachTourUL',
  homeContent: 'home-page-content'
};

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
  getElement: (id) => document.getElementById(id),

  showElement: (id) => {
    const el = Utils.getElement(id);
    if (el) el.style.display = 'block';
  },

  hideElement: (id) => {
    const el = Utils.getElement(id);
    if (el) el.style.display = 'none';
  },

  toggleElement: (id) => {
    const el = Utils.getElement(id);
    if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
  },

  formatCurrency: (amount) => Number(amount).toLocaleString('vi-VN') + '₫',

  formatDate: () => new Date().toLocaleDateString('vi-VN'),

  generateCode: (prefix, number) => prefix + number.toString().padStart(2, '0'),

  showAlert: (message) => alert(message),

  showConfirm: (message) => confirm(message)
};

// ==================== STORAGE MANAGER ====================
const Storage = {
  get: (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },

  getString: (key) => localStorage.getItem(key),

  setString: (key, value) => {
    localStorage.setItem(key, value);
  }
};

// ==================== LOADING INDICATOR ====================
const Loading = {
  show: () => {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000;';
    loading.textContent = 'Đang tìm kiếm...';
    document.body.appendChild(loading);
  },

  hide: () => {
    const loading = Utils.getElement('loading');
    if (loading) loading.remove();
  }
};

// ==================== AUTHENTICATION ====================
const Auth = {
  register: () => {
    const hoTen = Utils.getElement('hoTen_dk').value.trim();
    const lienLac = Utils.getElement('lienLac').value.trim();
    const matKhau1 = Utils.getElement('matKhau1').value;
    const matKhau2 = Utils.getElement('matKhau2').value;

    // 1️⃣ Kiểm tra rỗng
    if (!hoTen || !lienLac || !matKhau1 || !matKhau2) {
      Utils.showAlert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    // 2️⃣ Kiểm tra mật khẩu
    if (matKhau1 !== matKhau2) {
      Utils.showAlert('Mật khẩu không khớp.');
      return;
    }

    // 3️⃣ Kiểm tra EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 4️⃣ Kiểm tra SỐ ĐIỆN THOẠI (bắt đầu bằng 0, 9–11 số)
    const phoneRegex = /^0\d{8,10}$/;

    const laEmail = emailRegex.test(lienLac);
    const laSoDienThoai = phoneRegex.test(lienLac);

    if (!laEmail && !laSoDienThoai) {
      Utils.showAlert('Phải là EMAIL hợp lệ hoặc SỐ ĐIỆN THOẠI bắt đầu từ số 0.');
      return;
    }

    // 5️⃣ Lưu user (CHỈ khi hợp lệ)
    const user = {
      hoTen,
      lienLac,
      matKhau: matKhau1
    };

    Storage.set(STORAGE_KEYS.USER_DATA, user);
    Utils.showAlert('Đăng ký thành công!');
    UI.showLoginForm();
  },

  login: () => {
    const lienLacNhap = Utils.getElement('tenDangNhap_dn').value.trim();
    const matKhauNhap = Utils.getElement('matKhau_dn').value;

    // Check admin credentials
    if (lienLacNhap === ADMIN_CREDENTIALS.email && matKhauNhap === ADMIN_CREDENTIALS.password) {
      const adminUser = {
        hoTen: ADMIN_CREDENTIALS.name,
        lienLac: ADMIN_CREDENTIALS.email,
        matKhau: ADMIN_CREDENTIALS.password,
        role: ADMIN_CREDENTIALS.role
      };
      Storage.set(STORAGE_KEYS.USER_DATA, adminUser);
      Storage.setString(STORAGE_KEYS.LOGGED_IN_USER, adminUser.lienLac);
      Utils.showAlert('Đăng nhập thành công với quyền quản trị!');
      window.location.href = 'admin.html';
      return;
    }

    // Check regular user
    const userData = Storage.get(STORAGE_KEYS.USER_DATA);
    if (!userData) {
      Utils.showAlert('Chưa có tài khoản nào. Vui lòng đăng ký trước.');
      return;
    }

    if (lienLacNhap === userData.lienLac && matKhauNhap === userData.matKhau) {
      Utils.showAlert('Đăng nhập thành công!');
      Storage.setString(STORAGE_KEYS.LOGGED_IN_USER, userData.lienLac);
      Auth.updateAccountMenu();
      UI.closeForms();
      window.location.href = 'dulich.html';
    } else {
      Utils.showAlert('Sai thông tin đăng nhập.');
    }
  },

  logout: () => {
    Storage.remove(STORAGE_KEYS.LOGGED_IN_USER);
    window.location.href = 'dulich.html';
  },

  updateAccountMenu: () => {
    const tenDangNhap = Storage.getString(STORAGE_KEYS.LOGGED_IN_USER);
    const menuElement = Utils.getElement(ELEMENTS.accountMenu);

    if (tenDangNhap && menuElement) {
      menuElement.innerHTML = `
        <ul>
          <li><strong>👤 ${tenDangNhap}</strong></li>
          <li><a href="#" onclick="dangXuat()">Đăng xuất</a></li>
        </ul>
      `;
    }
  },

  isLoggedIn: () => !!Storage.getString(STORAGE_KEYS.LOGGED_IN_USER),

  checkAdminAccess: () => {
    const user = Storage.get(STORAGE_KEYS.USER_DATA);
    const adminMenu = document.querySelector('.quan-tri-dropdown');
    if (adminMenu && (!user || user.role !== 'admin')) {
      adminMenu.style.display = 'none';
    }
  }
};

// ==================== UI MANAGER ====================
const UI = {
  showRegisterForm: () => {
    Utils.hideElement(ELEMENTS.loginForm);
    Utils.showElement(ELEMENTS.registerForm);
    Utils.hideElement(ELEMENTS.accountMenu);
  },

  showLoginForm: () => {
    Utils.hideElement(ELEMENTS.registerForm);
    Utils.showElement(ELEMENTS.loginForm);
    Utils.hideElement(ELEMENTS.accountMenu);
  },

  closeForms: () => {
    Utils.hideElement(ELEMENTS.registerForm);
    Utils.hideElement(ELEMENTS.loginForm);
  },

  toggleAccountMenu: (event) => {
    event.stopPropagation();
    Utils.toggleElement(ELEMENTS.accountMenu);
  },

  toggleAdminMenu: (event) => {
    event.stopPropagation();
    Utils.toggleElement(ELEMENTS.adminMenu);
  },

  showPage: (pageId, linkId = null) => {
    const allPages = [ELEMENTS.homeContent, ELEMENTS.bookedList];
    allPages.forEach(id => Utils.hideElement(id));

    Utils.showElement(pageId);

    if (pageId === ELEMENTS.homeContent) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (pageId === ELEMENTS.bookedList) {
      TourBooking.display();
      const element = Utils.getElement(ELEMENTS.bookedList);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }

    document.querySelectorAll('.lien-ket a').forEach(link => {
      link.classList.remove('active');
    });

    if (linkId) {
      const linkElement = Utils.getElement(linkId);
      if (linkElement) linkElement.classList.add('active');
    }
  },

  updateTime: () => {
    const now = new Date();
    const timeString = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const timeElement = Utils.getElement('current-time');
    if (timeElement) {
      timeElement.textContent = `Thời gian: ${timeString}`;
    }
  }
};

// ==================== TOUR BOOKING ====================
const TourBooking = {
  add: (tourData) => {
    const bookedTours = Storage.get(STORAGE_KEYS.BOOKED_TOURS) || [];
    bookedTours.push(tourData);
    Storage.set(STORAGE_KEYS.BOOKED_TOURS, bookedTours);
    TourBooking.display();
  },

  remove: (index) => {
    const bookedTours = Storage.get(STORAGE_KEYS.BOOKED_TOURS) || [];
    if (Utils.showConfirm(`Bạn có chắc chắn muốn hủy tour "${bookedTours[index]?.title}" không?`)) {
      bookedTours.splice(index, 1);
      Storage.set(STORAGE_KEYS.BOOKED_TOURS, bookedTours);
      TourBooking.display();
      Utils.showAlert('Đã hủy tour thành công!');
    }
  },

  display: () => {
    const listElement = Utils.getElement(ELEMENTS.bookedToursUL);
    if (!listElement) return;

    const nguoiDungDangNhap = Storage.getString(STORAGE_KEYS.LOGGED_IN_USER);
    const allTours = Storage.get(STORAGE_KEYS.BOOKED_TOURS) || [];

    const tours = allTours.filter(tour =>
      tour.user?.account === nguoiDungDangNhap
    );

    listElement.innerHTML = '';

    if (tours.length === 0) {
      listElement.innerHTML = '<li>Bạn chưa đặt tour nào.</li>';
      return;
    }

    tours.forEach((tour, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${i + 1}. ${tour.title}</strong>
        <button class="xoa-tour" data-index="${i}">❌</button><br>
        Mã đơn hàng: <strong>${tour.maDonHang || '---'}</strong><br>
        Mã thanh toán: <strong>${tour.maThanhToan || '---'}</strong><br>
        Giá: <span style="color: #ff5722;">${Utils.formatCurrency(tour.price)}</span><br>
        Ngày đặt: ${tour.date}<br>
        👤 <strong>Thông Tin Người đặt:</strong><br>
        🧑‍💼 Họ tên: ${tour.user?.hoTen || 'Không có'}<br>
        📧 Email: ${tour.user?.email || 'Không có'}<br>
        📱 SĐT: ${tour.user?.soDienThoai || 'Không có'}<br>
        💳 Thanh toán: ${tour.user?.phuongThucThanhToan || 'Không rõ'}
      `;
      listElement.appendChild(li);
    });

    document.querySelectorAll('.xoa-tour').forEach(button => {
      button.addEventListener('click', function () {
        TourBooking.remove(this.dataset.index);
      });
    });
  }
};

// ==================== TOUR SEARCH ====================
const TourSearch = {
  filter: (destination, startDate, endDate) => {
    Loading.show();
    const tours = document.querySelectorAll('.phieu-tour');
    let found = false;

    tours.forEach(tour => {
      const tourTitle = tour.querySelector('.thong-tin-tour h3').textContent.toLowerCase();
      const tourDatesText = tour.querySelector('.tieu-de-tour span:first-child').textContent;

      const daysMatch = tourDatesText.match(/(\d+)\s*ngày/);
      const nightsMatch = tourDatesText.match(/(\d+)\s*đêm/);
      const days = daysMatch ? parseInt(daysMatch[1]) : 0;
      const nights = nightsMatch ? parseInt(nightsMatch[1]) : 0;
      let durationDays = days + nights;

      if (daysMatch && !nightsMatch) durationDays = days;
      if (!daysMatch && nightsMatch) durationDays = nights;

      const matchesDestination = destination.toLowerCase() === 'tất cả địa điểm' ||
        destination.toLowerCase() === 'chọn điểm đến' ||
        tourTitle.includes(destination.toLowerCase());

      const matchesDateRange = TourSearch.checkDateRange(startDate, endDate, durationDays);

      if (matchesDestination && matchesDateRange) {
        tour.style.display = 'block';
        found = true;
      } else {
        tour.style.display = 'none';
      }
    });

    setTimeout(() => {
      Loading.hide();
      const message = found
        ? `Tìm kiếm tour: Nơi Khởi Hành - ${destination}, từ ${startDate || 'Không xác định'} đến ${endDate || 'Không xác định'}`
        : 'Không tìm thấy tour phù hợp!';
      Utils.showAlert(message);
    }, 1000);
  },

  checkDateRange: (startDate, endDate, durationDays) => {
    if (!startDate && !endDate) return true;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const tourStart = new Date(startDate);
      const tourEnd = new Date(tourStart);
      tourEnd.setDate(tourStart.getDate() + durationDays - 1);
      return start <= tourEnd && end >= tourStart;
    }

    if (startDate) {
      const start = new Date(startDate);
      const tourStart = new Date(startDate);
      const tourEnd = new Date(tourStart);
      tourEnd.setDate(tourStart.getDate() + durationDays - 1);
      return start <= tourEnd;
    }

    if (endDate) {
      const end = new Date(endDate);
      const tourStart = new Date(endDate);
      tourStart.setDate(tourStart.getDate() - durationDays + 1);
      return end >= tourStart;
    }

    return true;
  }
};

// ==================== PAYMENT ====================
const Payment = {
  openModal: () => {
    Utils.getElement(ELEMENTS.paymentModal).style.display = 'flex';

    let count = Number(Storage.getString(STORAGE_KEYS.COUNTER)) || 0;
    count += 1;
    Storage.setString(STORAGE_KEYS.COUNTER, count);

    Utils.getElement('maDonHang').value = Utils.generateCode('MDH', count);
    Utils.getElement('maThanhToan').value = Utils.generateCode('MTT', count);
  },

  closeModal: () => {
    Utils.hideElement(ELEMENTS.paymentModal);
    const form = Utils.getElement(ELEMENTS.paymentForm);
    if (form) form.reset();
    const tourInfo = Utils.getElement('thongTinTour');
    if (tourInfo) tourInfo.textContent = '';
  },

  process: (e) => {
    e.preventDefault();

    const hoTen = Utils.getElement('hoTen').value.trim();
    const email = Utils.getElement('email').value.trim();
    const soDienThoai = Utils.getElement('soDienThoai').value.trim();
    const phuongThuc = Utils.getElement('phuongThucThanhToan').value;

    if (!hoTen || !email || !soDienThoai || !phuongThuc) {
      Utils.showAlert('Vui lòng điền đầy đủ thông tin thanh toán!');
      return;
    }

    const form = Utils.getElement(ELEMENTS.paymentForm);
    const tenTour = form.dataset.tenTour || 'Không xác định';
    const giaTour = form.dataset.giaTour || '0';
    const maDonHang = Utils.getElement('maDonHang').value;
    const maThanhToan = Utils.getElement('maThanhToan').value;

    const nguoiDungDangNhap = localStorage.getItem('nguoiDungDangNhap');

    // 📦 Tạo dữ liệu booking
    const tourData = {
      title: tenTour,
      price: giaTour,
      date: Utils.formatDate(),
      maDonHang: maDonHang,
      maThanhToan: maThanhToan,
      status: 'confirmed',
      owner: nguoiDungDangNhap,
      user: { 
        hoTen, 
        email, 
        soDienThoai, 
        phuongThucThanhToan: phuongThuc,
        account: nguoiDungDangNhap
      }
    };

    // ✅ 1. Lưu booking
    TourBooking.add(tourData);

    // ✅ 2. TỰ ĐỘNG TẠO PAYMENT (ĐÂY LÀ PHẦN THIẾU!)
    const paymentData = {
      id: `P${Date.now()}`,
      bookingId: tourData.maDonHang,
      maDonHang: maDonHang,
      maThanhToan: maThanhToan,
      customerName: hoTen,
      amount: giaTour,
      paymentMethod: phuongThuc,
      status: 'completed',
      date: Utils.formatDate(),
      createdAt: new Date().toISOString()
    };

    // Lưu vào localStorage payments
    const payments = JSON.parse(localStorage.getItem('payments') || '[]');
    payments.push(paymentData);
    localStorage.setItem('payments', JSON.stringify(payments));

    console.log('✅ Đã tạo payment:', paymentData);

    // Thông báo thành công
    Utils.showAlert(`Đặt tour thành công! Cảm ơn bạn đã đặt tour: ${tenTour}`);
    Payment.closeModal();
  }
};



// ==================== BANNER SLIDER ====================
const BannerSlider = {
  currentSlide: 0,
  slides: [],

  init: () => {
    BannerSlider.slides = document.querySelectorAll('.slide');
    if (BannerSlider.slides.length > 0) {
      BannerSlider.show(BannerSlider.currentSlide);
      setInterval(BannerSlider.next, 3000);
    }
  },

  show: (index) => {
    BannerSlider.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  },

  next: () => {
    BannerSlider.currentSlide = (BannerSlider.currentSlide + 1) % BannerSlider.slides.length;
    BannerSlider.show(BannerSlider.currentSlide);
  }
};

// ==================== GLOBAL FUNCTIONS (for HTML onclick) ====================
window.moDropdownTaiKhoan = UI.toggleAccountMenu;
window.moDropdownQuanTri = UI.toggleAdminMenu;
window.hienFormDangKy = UI.showRegisterForm;
window.hienFormDangNhap = UI.showLoginForm;
window.dongForm = UI.closeForms;
window.xuLyDangKy = Auth.register;
window.xuLyDangNhap = Auth.login;
window.dangXuat = Auth.logout;
window.moFormThanhToan = Payment.openModal;

// ==================== EVENT LISTENERS ====================
const initEventListeners = () => {
  // Close dropdowns when clicking outside
  window.addEventListener('click', () => {
    Utils.hideElement(ELEMENTS.accountMenu);
    Utils.hideElement(ELEMENTS.adminMenu);
  });

  // Search button
  const searchBtn = Utils.getElement('btnTimKiemSimple');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const destination = Utils.getElement('noiDuLichSimple').value;
      const startDate = Utils.getElement('ngayBatDauSimple').value;
      const endDate = Utils.getElement('ngayKetThucSimple').value;

      if (!destination || destination === 'Chọn điểm đến' || !startDate || !endDate) {
        Utils.showAlert('Vui lòng điền đầy đủ thông tin vào thanh tìm kiếm!');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        Utils.showAlert('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!');
        return;
      }

      document.querySelectorAll('.phieu-tour').forEach(tour => tour.style.display = 'block');
      TourSearch.filter(destination, startDate, endDate);
    });
  }

  // Book tour buttons
  document.querySelectorAll('.dat-ngay').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();

      if (!Auth.isLoggedIn()) {
        Utils.showAlert('Bạn cần đăng nhập để đặt tour!');
        UI.showLoginForm();
        return;
      }

      const tenTour = this.dataset.tenTour || 'Không xác định';
      const giaTour = this.dataset.giaTour || '0';

      const tourInfo = Utils.getElement('thongTinTour');
      if (tourInfo) {
        tourInfo.textContent = `Tour: ${tenTour} - Giá: ${Utils.formatCurrency(giaTour)}`;
      }

      const form = Utils.getElement(ELEMENTS.paymentForm);
      if (form) {
        form.dataset.tenTour = tenTour;
        form.dataset.giaTour = giaTour;
      }

      Payment.openModal();

      const paymentMethod = Utils.getElement('phuongThucThanhToan');
      if (paymentMethod) paymentMethod.value = '';
    });
  });

  // Payment form submit
  const paymentForm = Utils.getElement(ELEMENTS.paymentForm);
  if (paymentForm) {
    paymentForm.addEventListener('submit', Payment.process);
  }

  // Close payment modal
  const modal = Utils.getElement(ELEMENTS.paymentModal);
  const closeBtn = modal?.querySelector('.dong-lai');
  if (closeBtn) {
    closeBtn.addEventListener('click', Payment.closeModal);
  }

  // Navigation buttons
  const homeBtn = Utils.getElement('btnTrangChu');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => UI.showPage(ELEMENTS.homeContent, 'btnTrangChu'));
  }

};

// ===== AUTO ACTIVE MENU BY URL =====
function setActiveMenuByUrl() {
  const path = window.location.pathname.toLowerCase();

  // clear active
  document.querySelectorAll('.lien-ket a').forEach(a => {
    a.classList.remove('active');
  });

  // map URL → menu ID
  const menuMap = {
    'dulich': 'btnTrangChu',
    'index': 'btnTrangChu',
    'tourdadat': 'btnDaDat',
    'gioithieu': 'btnGioiThieu',
    'tour': 'btnTours',
    'admin': 'btnQuanTri'
  };

  for (const key in menuMap) {
    if (path.includes(key)) {
      document.getElementById(menuMap[key])?.classList.add('active');
      return;
    }
  }
}



// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  setActiveMenuByUrl();
  Auth.updateAccountMenu();
  Auth.checkAdminAccess();
  UI.updateTime();
  setInterval(UI.updateTime, 1000);
  initEventListeners();
  BannerSlider.init();
});