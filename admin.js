// ==================== ADMIN SCRIPT ====================
// File: adminScript.js
// Xử lý UI và events cho trang admin

// ==================== NAVIGATION ====================
function initNavigation() {
    const menuLinks = document.querySelectorAll('.sidebar-menu a[data-section]');
    const sections = document.querySelectorAll('.content-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            
            // Update active menu
            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show/hide sections
            sections.forEach(section => section.classList.add('hidden'));
            
            const targetSection = document.getElementById(`section-${sectionId}`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                refreshSection(sectionId);
            }
        });
    });
}

function refreshSection(sectionId) {
    switch(sectionId) {
        case 'tours':
            renderToursTable();
            break;
        case 'bookings':
            renderBookingsTable();
            break;
        case 'customers':
            renderCustomersTable();
            break;
        case 'payments':
            renderPaymentsTable();
            break;
    }
}

// ==================== MODAL FUNCTIONS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            form.removeAttribute('data-editing');
            
            // Reset button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '✅ Thêm Tour';
            }
            
            // Enable tour code input
            const tourCodeInput = document.getElementById('tourCode');
            if (tourCodeInput) {
                tourCodeInput.disabled = false;
            }
        }
    }
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Close modal với ESC key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'flex') {
                closeModal(modal.id);
            }
        });
    }
});

// ==================== TOUR ACTIONS ====================
function editTour(tourId) {
    const tour = DataManager.tours.getById(tourId);
    
    if (!tour) {
        showNotification('❌ Không tìm thấy tour!', 'error');
        return;
    }
    
    // Điền dữ liệu vào form
    document.getElementById('tourCode').value = tour.id;
    document.getElementById('tourCode').disabled = true;
    document.getElementById('tourName').value = tour.name;
    document.getElementById('tourDestination').value = tour.destination;
    document.getElementById('tourDuration').value = tour.duration;
    document.getElementById('tourPrice').value = tour.price;
    document.getElementById('tourDescription').value = tour.description || '';
    
    // Mark as editing
    const form = document.getElementById('addTourForm');
    form.setAttribute('data-editing', tourId);
    
    // Change button text
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = '✅ Cập Nhật Tour';
    
    openModal('addTourModal');
}

function deleteTour(tourId) {
    const tour = DataManager.tours.getById(tourId);
    
    if (!tour) {
        showNotification('❌ Không tìm thấy tour!', 'error');
        return;
    }
    
    if (!confirm(`⚠️ Bạn có chắc muốn xóa tour "${tour.name}"?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }
    
    DataManager.tours.delete(tourId);
    renderToursTable();
    updateStatistics();
    showNotification('✅ Đã xóa tour thành công!', 'success');
}

// ==================== BOOKING ACTIONS ====================
function viewBooking(bookingId) {
    const booking = DataManager.bookings.getById(bookingId);
    
    if (!booking) {
        showNotification('❌ Không tìm thấy đơn đặt tour!', 'error');
        return;
    }
    
    const details = `
THÔNG TIN ĐẶT TOUR

📋 Mã đơn: ${booking.maDonHang}
🗺️  Tour: ${booking.title}

👤 THÔNG TIN KHÁCH HÀNG:
   • Họ tên: ${booking.user?.hoTen || 'N/A'}
   • Email: ${booking.user?.email || 'N/A'}
   • SĐT: ${booking.user?.soDienThoai || 'N/A'}
   • Số người: ${booking.user?.soNguoi || 1} người

💰 THANH TOÁN:
   • Tổng tiền: ${Number(booking.price).toLocaleString('vi-VN')}₫
   • Phương thức: ${booking.user?.phuongThucThanhToan || 'Chưa xác định'}

📅 Ngày đặt: ${booking.date}

    `;
    
    alert(details);
}

function deleteBooking(bookingId) {
    const booking = DataManager.bookings.getById(bookingId);
    
    if (!booking) {
        showNotification('❌ Không tìm thấy đơn đặt tour!', 'error');
        return;
    }
    
    if (!confirm(`⚠️ Bạn có chắc muốn xóa đơn "${booking.maDonHang}"?`)) {
        return;
    }
    
    DataManager.bookings.delete(bookingId);
    renderBookingsTable();
    renderPaymentsTable();
    renderCustomersTable();
    updateStatistics();
    showNotification('✅ Đã xóa đơn đặt tour!', 'success');
}function deleteBooking(bookingId) {
    const STORAGE_KEY = 'bookedTours';

    // 👉 1. LẤY DATA TỪ LOCALSTORAGE (nguồn gốc thật)
    const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // 👉 2. TÌM ĐƠN
    const booking = bookings.find(
        b => b.id === bookingId || b.maDonHang === bookingId
    );

    if (!booking) {
        showNotification('❌ Không tìm thấy đơn đặt tour!', 'error');
        return;
    }

    if (!confirm(`⚠️ Bạn có chắc muốn xóa đơn "${booking.maDonHang}"?`)) {
        return;
    }

    // 👉 3. XÓA ĐÚNG ĐƠN
    const newBookings = bookings.filter(
        b => b.id !== bookingId && b.maDonHang !== bookingId
    );

    // 👉 4. GHI LẠI LOCALSTORAGE
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookings));

    // 👉 5. CẬP NHẬT UI
    renderBookingsTable();
    renderPaymentsTable();
    renderCustomersTable();
    updateStatistics();

    showNotification('✅ Đã xóa đơn đặt tour!', 'success');
}


function exportBookings() {
    const bookings = DataManager.bookings.getAll();
    
    if (bookings.length === 0) {
        showNotification('⚠️ Không có dữ liệu để xuất!', 'error');
        return;
    }
    
    // Tạo CSV content với UTF-8 BOM
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Mã Đơn,Khách Hàng,Email,SĐT,Tour,Ngày Đặt,Số Người,Tổng Tiền,Phương Thức,Trạng Thái\n";
    
    bookings.forEach(booking => {
        const row = [
            booking.maDonHang,
            booking.user?.hoTen || 'N/A',
            booking.user?.email || 'N/A',
            booking.user?.soDienThoai || 'N/A',
            `"${booking.title}"`,
            booking.date,
            booking.user?.soNguoi || 1,
            booking.price,
            booking.user?.phuongThucThanhToan || 'N/A',
            getStatusText(booking.status)
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-dat-tour-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showNotification('✅ Đã xuất file Excel thành công!', 'success');
}

// ==================== CUSTOMER ACTIONS ====================
function viewCustomer(customerId) {
    const customer = DataManager.customers.getById(customerId);
    
    if (!customer) {
        showNotification('❌ Không tìm thấy khách hàng!', 'error');
        return;
    }
    
    const bookings = DataManager.bookings.getByCustomer(customer.email);
    
    let bookingsList = bookings.length > 0 
        ? bookings.map((b, index) => `   ${index + 1}. ${b.title} - ${b.date}`).join('\n')
        : '   Chưa có đơn nào';
    
    const totalSpent = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
    
    const details = `

         THÔNG TIN KHÁCH HÀNG

👤 Mã KH: ${customer.id}
📝 Họ tên: ${customer.hoTen}
📧 Email: ${customer.email}
📱 SĐT: ${customer.soDienThoai}
🏠 Địa chỉ: ${customer.diaChi || 'Chưa cập nhật'}

📊 LỊCH SỬ ĐẶT TOUR:
   • Tổng số tour: ${bookings.length}
   • Tổng chi tiêu: ${totalSpent.toLocaleString('vi-VN')}₫

📋 DANH SÁCH TOUR:
${bookingsList}

⏰ Ngày tham gia: ${new Date(customer.createdAt).toLocaleDateString('vi-VN')}
    `;
    
    alert(details);
}

function deleteCustomer(customerId) {
    const CUSTOMER_KEY = 'customers';
    const BOOKING_KEY = 'bookedTours';

    // 1️⃣ LẤY DANH SÁCH KHÁCH
    const customers = JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || [];
    const customer = customers.find(c => c.id === customerId);

    if (!customer) {
        showNotification('❌ Không tìm thấy khách hàng!', 'error');
        return;
    }

    // 2️⃣ HỎI XÁC NHẬN
    if (!confirm(`⚠️ Bạn có chắc muốn xóa khách hàng "${customer.hoTen}"?`)) {
        return;
    }

    // 3️⃣ XÓA KHÁCH HÀNG
    const newCustomers = customers.filter(c => c.id !== customerId);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(newCustomers));

    // 4️⃣ XÓA TOÀN BỘ BOOKING LIÊN QUAN
    const bookings = JSON.parse(localStorage.getItem(BOOKING_KEY)) || [];

    const newBookings = bookings.filter(b =>
        b.user?.email !== customer.email &&
        b.user?.soDienThoai !== customer.soDienThoai
    );

    localStorage.setItem(BOOKING_KEY, JSON.stringify(newBookings));

    // 5️⃣ CẬP NHẬT UI + THỐNG KÊ
    renderCustomersTable();
    renderBookingsTable();
    renderPaymentsTable();
    updateStatistics();

    showNotification(' Đã xóa khách hàng thành công!', 'success');
}


// ==================== FORM HANDLERS ====================
// ==================== FORM HANDLERS ====================
function initFormHandlers() {
    // ========== TOUR FORM HANDLER ==========
    const tourForm = document.getElementById('addTourForm');
    
    if (tourForm) {
        tourForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const tourData = {
                name: document.getElementById('tourName').value.trim(),
                destination: document.getElementById('tourDestination').value,
                duration: document.getElementById('tourDuration').value.trim(),
                price: parseInt(document.getElementById('tourPrice').value),
                description: document.getElementById('tourDescription').value.trim()
            };
            
            // Validate
            if (!tourData.name || !tourData.destination || !tourData.duration || !tourData.price) {
                showNotification('⚠️ Vui lòng điền đầy đủ thông tin!', 'error');
                return;
            }
            
            if (tourData.price <= 0) {
                showNotification('⚠️ Giá tour phải lớn hơn 0!', 'error');
                return;
            }
            
            const editingId = e.target.getAttribute('data-editing');
            
            if (editingId) {
                // Update tour
                DataManager.tours.update(editingId, tourData);
                showNotification('✅ Đã cập nhật tour thành công!', 'success');
            } else {
                // Add new tour
                DataManager.tours.add(tourData);
                showNotification('✅ Đã thêm tour mới thành công!', 'success');
            }
            
            // Close modal & refresh
            closeModal('addTourModal');
            renderToursTable();
            updateStatistics();
            
            // Scroll to tours section
            const toursSection = document.getElementById('section-tours');
            if (toursSection && !toursSection.classList.contains('hidden')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // ========== CUSTOMER FORM HANDLER ==========
    const customerForm = document.getElementById('addCustomerForm');
    
    if (customerForm) {
        customerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const customerData = {
                hoTen: document.getElementById('customerName').value.trim(),
                email: document.getElementById('customerEmail').value.trim(),
                soDienThoai: document.getElementById('customerPhone').value.trim(),
                diaChi: document.getElementById('customerAddress').value.trim()
            };
            
            // Validate
            if (!customerData.hoTen || !customerData.email || !customerData.soDienThoai) {
                showNotification('⚠️ Vui lòng điền đầy đủ thông tin!', 'error');
                return;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerData.email)) {
                showNotification('⚠️ Email không hợp lệ!', 'error');
                return;
            }
            
            // Validate phone
            const phoneRegex = /^0\d{9,10}$/;
            if (!phoneRegex.test(customerData.soDienThoai)) {
                showNotification('⚠️ Số điện thoại phải bắt đầu bằng 0 và có 10-11 số!', 'error');
                return;
            }
            
            // ✅ KIỂM TRA TRÙNG EMAIL
            const existingCustomers = DataManager.customers.getAll();
            const isDuplicate = existingCustomers.some(c => c.email === customerData.email);
            
            if (isDuplicate) {
                showNotification('⚠️ Email này đã tồn tại trong hệ thống!', 'error');
                return;
            }
            
            // ✅ TỰ ĐỘNG TÍNH TỔNG CHI TIÊU TỪ BOOKINGS
            const bookings = DataManager.bookings.getAll();
            const customerBookings = bookings.filter(b => 
                b.user?.email === customerData.email || 
                b.user?.soDienThoai === customerData.soDienThoai
            );
            
            const totalSpent = customerBookings.reduce((sum, b) => 
                sum + Number(b.price || 0), 0
            );
            
            const totalBookings = customerBookings.length;
            
            // ✅ TẠO KHÁCH HÀNG VỚI THỐNG KÊ ĐÚNG
            const customers = DataManager.customers.getAll();
            const newCustomer = {
                id: `KH${String(customers.length + 1).padStart(3, '0')}`,
                ...customerData,
                totalBookings: totalBookings,
                totalSpent: totalSpent,
                createdAt: new Date().toISOString()
            };
            
            customers.push(newCustomer);
            DataManager.customers.save(customers);
            
            // Thông báo chi tiết
            if (totalBookings > 0) {
                showNotification(
                    `✅ Đã thêm khách hàng!\n` +
                    `📋 Tìm thấy ${totalBookings} đơn đặt tour\n` +
                    `💰 Tổng chi tiêu: ${totalSpent.toLocaleString('vi-VN')}₫`,
                    'success'
                );
            } else {
                showNotification('✅ Đã thêm khách hàng mới!', 'success');
            }
            
            // Close modal & refresh
            closeModal('addCustomerModal');
            renderCustomersTable();
            updateStatistics();
            
            const customersSection = document.getElementById('section-customers');
            if (customersSection && !customersSection.classList.contains('hidden')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

function recalculateAllCustomers() {
    const customers = DataManager.customers.getAll();
    const bookings = DataManager.bookings.getAll();
    
    let updated = 0;
    
    customers.forEach(customer => {
        const customerBookings = bookings.filter(b => 
            b.user?.email === customer.email || 
            b.user?.soDienThoai === customer.soDienThoai
        );
        
        const totalSpent = customerBookings.reduce((sum, b) => 
            sum + Number(b.price || 0), 0
        );
        
        if (customer.totalSpent !== totalSpent) {
            customer.totalSpent = totalSpent;
            customer.totalBookings = customerBookings.length;
            updated++;
        }
    });
    
    if (updated > 0) {
        DataManager.customers.save(customers);
        console.log(`✅ Đã cập nhật ${updated} khách hàng`);
        renderCustomersTable();
        updateStatistics();
        showNotification(`✅ Đã đồng bộ ${updated} khách hàng!`, 'success');
    } else {
        showNotification('ℹ️ Dữ liệu đã đồng bộ!', 'info');
    }
}

// ==================== AUTH CHECK ====================
function checkAdminAccess() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const loggedInUser = localStorage.getItem('nguoiDungDangNhap');
    
    if (!loggedInUser || !userData) {
        alert('⚠️ Vui lòng đăng nhập để truy cập!');
        window.location.href = 'index.html';
        return false;
    }
    
    if (userData.role !== 'admin') {
        alert('⚠️ Bạn không có quyền truy cập trang này!\n\nChỉ Admin mới có thể truy cập Dashboard.');
        window.location.href = 'index.html';
        return false;
    }
    
    // Update admin info
    const adminName = document.getElementById('adminName');
    const adminRole = document.getElementById('adminRole');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (adminName) adminName.textContent = userData.hoTen || 'Admin';
    if (adminRole) adminRole.textContent = 'Quản trị viên';
    if (userAvatar && userData.hoTen) {
        userAvatar.textContent = userData.hoTen.charAt(0).toUpperCase();
    }
    
    return true;
}

function logout() {
    if (confirm('🚪 Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('nguoiDungDangNhap');
        localStorage.removeItem('userData');
        showNotification('👋 Đã đăng xuất thành công!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// ==================== AUTO REFRESH ====================
function startAutoRefresh() {
    setInterval(() => {
        const activeSection = document.querySelector('.sidebar-menu a.active');
        if (activeSection) {
            const sectionId = activeSection.getAttribute('data-section');
            if (sectionId) {
                refreshSection(sectionId);
            }
        }
        updateStatistics();
    }, 30000); // 30 seconds
}

// ==================== UTILITIES ====================
function clearAllData() {
    DataManager.clearAll();
}

function exportAllData() {
    DataManager.exportData();
    showNotification('✅ Đã xuất dữ liệu thành công!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            DataManager.importData(event.target.result);
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ==================== ANIMATIONS ====================
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .content-section {
            animation: fadeIn 0.5s ease;
        }
    `;
    document.head.appendChild(style);
}

// ==================== INITIALIZATION ====================
function initDashboard() {
    console.log('🚀 Khởi tạo Dashboard...');
    
    // Check access
    if (!checkAdminAccess()) {
        return;
    }
    
    // Initialize components
    initNavigation();
    initFormHandlers();
    addAnimations();
    
    // Render initial data
    renderToursTable();
    renderBookingsTable();
    renderCustomersTable();
    renderPaymentsTable();
    updateStatistics();
    
    // Start auto refresh
    startAutoRefresh();
    
    console.log('✅ Dashboard đã sẵn sàng!');
    showNotification('👋 Chào mừng bạn đến với Dashboard!', 'success');
}

// ==================== EXPORT FUNCTIONS ====================
window.openModal = openModal;
window.closeModal = closeModal;
window.editTour = editTour;
window.deleteTour = deleteTour;
window.viewBooking = viewBooking;
window.deleteBooking = deleteBooking;
window.exportBookings = exportBookings;
window.viewCustomer = viewCustomer;
window.logout = logout;
window.clearAllData = clearAllData;
window.exportAllData = exportAllData;
window.importData = importData;
window.recalculateAllCustomers = recalculateAllCustomers;

// ==================== START APPLICATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Tour V&V Admin Dashboard v1.0');
    console.log('📅 ' + new Date().toLocaleString('vi-VN'));
    initDashboard();
});

console.log('✅ Admin Script loaded successfully!');