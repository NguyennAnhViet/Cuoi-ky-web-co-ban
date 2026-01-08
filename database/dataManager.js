// ========== NAVIGATION ==========
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
        sections.forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    });
});

// ========== MODAL FUNCTIONS ==========
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});


// ========== TOUR FUNCTIONS ==========
function editTour(tourId) {
    alert(`Chỉnh sửa tour: ${tourId}`);
}

function deleteTour(tourId) {
    if (confirm(`Bạn có chắc muốn xóa tour ${tourId}?`)) {
        alert(`Đã xóa tour ${tourId}`);
    }
}

// ========== BOOKING FUNCTIONS ==========
function viewBooking(bookingId) {
    const booking = DataManager.bookings.getById(bookingId);
    if (!booking) return;

    alert(
        `Thông tin đặt tour:\n\n` +
        `Tour: ${booking.title}\n` +
        `Khách hàng: ${booking.user?.hoTen}\n` +
        `Email: ${booking.user?.email}\n` +
        `SĐT: ${booking.user?.soDienThoai}\n` +
        `Giá: ${Number(booking.price).toLocaleString('vi-VN')}₫`
    );
}


function deleteBooking(bookingId) {
    if (!confirm('Bạn có chắc muốn xóa đơn đặt tour này?')) return;

    DataManager.bookings.delete(bookingId);

    renderBookingsTable();
    renderPaymentsTable();
    renderCustomersTable();
    updateStatistics();

    showNotification('Đã xóa đơn đặt tour!', 'success');
}

function exportBookings() {
    alert('Chức năng xuất Excel đang được phát triển!');
}

// ========== LOGOUT ==========
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('nguoiDungDangNhap');
        window.location.href = 'index.html';
    }
}

// ========== ADD TOUR FORM ==========
document.getElementById('addTourForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const tourData = {
        code: document.getElementById('tourCode').value,
        name: document.getElementById('tourName').value,
        destination: document.getElementById('tourDestination').value,
        duration: document.getElementById('tourDuration').value,
        price: document.getElementById('tourPrice').value,
        description: document.getElementById('tourDescription').value
    };

    alert(`Tour mới đã được thêm:\n${tourData.name}`);
    closeModal('addTourModal');
    document.getElementById('addTourForm').reset();
});

// ========== CHECK ADMIN ACCESS ==========
function checkAdminAccess() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const loggedInUser = localStorage.getItem('nguoiDungDangNhap');

    if (!loggedInUser || !userData || userData.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = 'index.html';
        return false;
    }

    // Update admin info
    document.getElementById('adminName').textContent = userData.hoTen || 'Admin';
    document.getElementById('adminRole').textContent = 'Quản trị viên';

    return true;
}

// ========== INITIALIZE ==========
window.addEventListener('DOMContentLoaded', () => {
    if (checkAdminAccess()) {
        renderToursTable();
        renderBookingsTable();
        renderCustomersTable();
        renderPaymentsTable();
        updateStatistics();
    }
});

// ==================== DATABASE MANAGER ====================
// File: dataManager.js
// Quản lý toàn bộ dữ liệu với localStorage

// ==================== DATABASE MANAGER ====================
// File: dataManager.js
// Quản lý toàn bộ dữ liệu với localStorage

// ==================== DATABASE MANAGER - PHIÊN BẢN HOÀN CHỈNH ====================
// File: dataManager.js
// Quản lý toàn bộ dữ liệu với localStorage - Tự động đồng bộ

const DataManager = {
    // ========== TOURS MANAGEMENT ==========
    tours: {
        getAll() {
            const tours = localStorage.getItem('tours');
            return tours ? JSON.parse(tours) : [];
        },

        save(tours) {
            localStorage.setItem('tours', JSON.stringify(tours));
        },

        // ✅ TỰ ĐỘNG TẠO HOẶC CẬP NHẬT TOUR KHI KHÁCH ĐẶT
        createOrUpdateFromBooking(bookingData) {
            const tours = this.getAll();
            let tour = tours.find(t => t.name === bookingData.title);

            if (!tour) {
                // Tạo tour mới từ thông tin đặt tour
                const newTour = {
                    id: `T${String(tours.length + 1).padStart(3, '0')}`,
                    name: bookingData.title,
                    destination: bookingData.destination || 'Chưa xác định',
                    duration: bookingData.duration || 'N/A',
                    price: bookingData.price,
                    description: `Tự động tạo từ đơn đặt tour`,
                    status: 'active',
                    totalBookings: 1,
                    totalRevenue: Number(bookingData.price),
                    createdAt: new Date().toISOString()
                };
                tours.push(newTour);
                console.log('✅ Tạo tour mới:', newTour.name);
            } else {
                // Cập nhật thống kê tour
                tour.totalBookings = (tour.totalBookings || 0) + 1;
                tour.totalRevenue = (tour.totalRevenue || 0) + Number(bookingData.price);
                tour.updatedAt = new Date().toISOString();
                console.log('✅ Cập nhật tour:', tour.name, '- Tổng đặt:', tour.totalBookings);
            }

            this.save(tours);
            return tour;
        },

        // Tính lại thống kê cho tất cả tours
        recalculateStats() {
            const tours = this.getAll();
            const bookings = DataManager.bookings.getAll();

            tours.forEach(tour => {
                const tourBookings = bookings.filter(b => b.title === tour.name);
                tour.totalBookings = tourBookings.length;
                tour.totalRevenue = tourBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
            });

            this.save(tours);
            console.log('📊 Đã cập nhật thống kê cho', tours.length, 'tours');
        },

        // ✅ ĐẾM TỔNG SỐ TOUR THỰC TẾ (TỪ BOOKINGS)
        getTotalUniqueTours() {
            const bookings = DataManager.bookings.getAll();
            const uniqueTours = [...new Set(bookings.map(b => b.title))];
            return uniqueTours.length;
        },

        add(tourData) {
            const tours = this.getAll();
            const newId = `T${String(tours.length + 1).padStart(3, '0')}`;
            const newTour = {
                id: newId,
                ...tourData,
                status: 'active',
                totalBookings: 0,
                totalRevenue: 0,
                createdAt: new Date().toISOString()
            };
            tours.push(newTour);
            this.save(tours);
            return newTour;
        },

        update(tourId, tourData) {
            const tours = this.getAll();
            const index = tours.findIndex(t => t.id === tourId);
            if (index !== -1) {
                tours[index] = {
                    ...tours[index],
                    ...tourData,
                    updatedAt: new Date().toISOString()
                };
                this.save(tours);
                return tours[index];
            }
            return null;
        },

        delete(tourId) {
            const tours = this.getAll();
            const filtered = tours.filter(t => t.id !== tourId);
            this.save(filtered);
            return true;
        },

        getById(tourId) {
            const tours = this.getAll();
            return tours.find(t => t.id === tourId);
        }
    },

    // ========== BOOKINGS MANAGEMENT ==========
    bookings: {
        getAll() {
            const bookings = localStorage.getItem('bookedTours');
            return bookings ? JSON.parse(bookings) : [];
        },

        save(bookings) {
            localStorage.setItem('bookedTours', JSON.stringify(bookings));
        },

        // ✅ THÊM ĐƠN ĐẶT TOUR VÀ TỰ ĐỘNG CẬP NHẬT
        add(bookingData) {
            const bookings = this.getAll();
            const newBooking = {
                id: `B${Date.now()}`,
                maDonHang: `DH${String(bookings.length + 1).padStart(5, '0')}`,
                maThanhToan: `TT${Date.now()}`,
                ...bookingData,
                status: 'confirmed',
                date: new Date().toLocaleDateString('vi-VN'),
                createdAt: new Date().toISOString()
            };
            bookings.push(newBooking);
            this.save(bookings);

            // ✅ TỰ ĐỘNG TẠO/CẬP NHẬT TOUR
            DataManager.tours.createOrUpdateFromBooking(bookingData);

            // ✅ TỰ ĐỘNG TẠO/CẬP NHẬT KHÁCH HÀNG
            if (bookingData.user) {
                DataManager.customers.getOrCreate(bookingData.user);
            }

            // ✅ TỰ ĐỘNG TẠO PAYMENT
            DataManager.payments.add({
                bookingId: newBooking.id,
                maDonHang: newBooking.maDonHang,
                maThanhToan: newBooking.maThanhToan,
                amount: bookingData.price,
                customerName: bookingData.user?.hoTen,
                paymentMethod: bookingData.user?.phuongThucThanhToan || 'Chuyển khoản'
            });

            console.log('✅ Đã tạo đơn đặt tour:', newBooking.maDonHang);
            return newBooking;
        },

        update(bookingId, updates) {
            const bookings = this.getAll();
            const index = bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
                bookings[index] = {
                    ...bookings[index],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                this.save(bookings);

                // Cập nhật lại thống kê
                DataManager.tours.recalculateStats();
                DataManager.customers.recalculateStats();

                return bookings[index];
            }
            return null;
        },

        delete(bookingId) {
            const bookings = this.getAll();
            const filtered = bookings.filter(b => b.id !== bookingId);
            this.save(filtered);

            // Cập nhật lại thống kê sau khi xóa
            DataManager.tours.recalculateStats();
            DataManager.customers.recalculateStats();

            return true;
        },

        getById(maDonHang) {
            return this.getAll().find(b => b.maDonHang === maDonHang);
        },

        getByCustomer(customerEmail) {
            const bookings = this.getAll();
            return bookings.filter(b => b.user?.email === customerEmail);
        },

        getTodayBookings() {
            const today = new Date().toLocaleDateString('vi-VN');
            const bookings = this.getAll();
            return bookings.filter(b => b.date === today);
        }
    },

    // ========== CUSTOMERS MANAGEMENT ==========
    customers: {
        getAll() {
            const customers = localStorage.getItem('customers');
            return customers ? JSON.parse(customers) : [];
        },

        save(customers) {
            localStorage.setItem('customers', JSON.stringify(customers));
        },

        add(customerData) {
            const customers = this.getAll();
            const newCustomer = {
                id: `KH${String(customers.length + 1).padStart(3, '0')}`,
                ...customerData,
                totalBookings: 0,
                totalSpent: 0,
                createdAt: new Date().toISOString()
            };
            customers.push(newCustomer);
            this.save(customers);
            return newCustomer;
        },

        update(customerId, customerData) {
            const customers = this.getAll();
            const index = customers.findIndex(c => c.id === customerId);
            if (index !== -1) {
                customers[index] = {
                    ...customers[index],
                    ...customerData,
                    updatedAt: new Date().toISOString()
                };
                this.save(customers);
                return customers[index];
            }
            return null;
        },

        delete(customerId) {
            const customers = this.getAll();
            const filtered = customers.filter(c => c.id !== customerId);
            this.save(filtered);
            return true;
        },

        // ✅ TỰ ĐỘNG TẠO HOẶC CẬP NHẬT KHÁCH HÀNG
        getOrCreate(userData) {
            const customers = this.getAll();
            let customer = customers.find(c => c.email === userData.email);

            if (!customer) {
                customer = this.add({
                    hoTen: userData.hoTen,
                    email: userData.email,
                    soDienThoai: userData.soDienThoai,
                    diaChi: userData.diaChi || ''
                });
                console.log('✅ Tạo khách hàng mới:', customer.hoTen);
            }

            // Cập nhật thống kê
            const bookings = DataManager.bookings.getByCustomer(userData.email);
            const totalSpent = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);

            this.update(customer.id, {
                totalBookings: bookings.length,
                totalSpent: totalSpent
            });

            return customer;
        },

        // Tính lại thống kê cho tất cả khách hàng
        recalculateStats() {
            const customers = this.getAll();

            customers.forEach(customer => {
                const bookings = DataManager.bookings.getByCustomer(customer.email);
                customer.totalBookings = bookings.length;
                customer.totalSpent = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
            });

            this.save(customers);
            console.log('📊 Đã cập nhật thống kê cho', customers.length, 'khách hàng');
        },

        // ✅ ĐẾM TỔNG SỐ KHÁCH HÀNG THỰC TẾ
        getTotalUniqueCustomers() {
            const bookings = DataManager.bookings.getAll();
            const uniqueEmails = [...new Set(bookings.map(b => b.user?.email).filter(Boolean))];
            return uniqueEmails.length;
        },

        getById(customerId) {
            const customers = this.getAll();
            return customers.find(c => c.id === customerId);
        }
    },

    // ========== PAYMENTS MANAGEMENT ==========
    payments: {
        getAll() {
            const payments = localStorage.getItem('payments');
            return payments ? JSON.parse(payments) : [];
        },

        save(payments) {
            localStorage.setItem('payments', JSON.stringify(payments));
        },

        add(paymentData) {
            const payments = this.getAll();
            const newPayment = {
                id: `P${Date.now()}`,
                ...paymentData,
                status: 'completed',
                date: new Date().toLocaleDateString('vi-VN'),
                createdAt: new Date().toISOString()
            };
            payments.push(newPayment);
            this.save(payments);
            return newPayment;
        },

        delete(paymentId) {
            const payments = this.getAll();
            const filtered = payments.filter(p => p.id !== paymentId);
            this.save(filtered);
            return true;
        },

        getByBooking(bookingId) {
            const payments = this.getAll();
            return payments.find(p => p.bookingId === bookingId);
        }
    },

    // ========== STATISTICS - CẬP NHẬT ==========
    statistics: {
        // ✅ TỔNG TOUR THỰC TẾ (đếm từ bookings)
        getTotalTours() {
            return DataManager.bookings.getAll().length;
        },

        getTodayBookings() {
            return DataManager.bookings.getTodayBookings().length;
        },

        // ✅ TỔNG KHÁCH HÀNG THỰC TẾ (đếm từ bookings)
        getTotalCustomers() {
            return DataManager.customers.getTotalUniqueCustomers();
        },

        // ✅ DOANH THU THÁNG HIỆN TẠI
        getMonthlyRevenue() {
            const bookings = DataManager.bookings.getAll();

            if (!bookings || bookings.length === 0) {
                return 0;
            }

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthlyBookings = bookings.filter(b => {
                if (b.createdAt) {
                    const bookingDate = new Date(b.createdAt);
                    return bookingDate.getMonth() === currentMonth &&
                        bookingDate.getFullYear() === currentYear;
                }

                if (b.date) {
                    const parts = b.date.split('/');
                    if (parts.length === 3) {
                        const bookingMonth = parseInt(parts[1]) - 1;
                        const bookingYear = parseInt(parts[2]);
                        return bookingMonth === currentMonth &&
                            bookingYear === currentYear;
                    }
                }

                return false;
            });

            const total = monthlyBookings.reduce((sum, b) => {
                return sum + Number(b.price || 0);
            }, 0);

            return Math.round(total / 1000000); // Chuyển sang triệu
        },

        getTotalRevenue() {
            const bookings = DataManager.bookings.getAll();
            return bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
        },

        getRevenueByMonth(year) {
            const bookings = DataManager.bookings.getAll();
            const monthlyData = Array(12).fill(0);

            bookings.forEach(b => {
                if (b.createdAt) {
                    const bookingDate = new Date(b.createdAt);
                    if (bookingDate.getFullYear() === year) {
                        const month = bookingDate.getMonth();
                        monthlyData[month] += Number(b.price || 0);
                    }
                } else if (b.date) {
                    const parts = b.date.split('/');
                    if (parts.length === 3) {
                        const bookingYear = parseInt(parts[2]);
                        if (bookingYear === year) {
                            const month = parseInt(parts[1]) - 1;
                            monthlyData[month] += Number(b.price || 0);
                        }
                    }
                }
            });

            return monthlyData;
        },

        getTopTours(limit = 5) {
            const bookings = DataManager.bookings.getAll();
            const tourCount = {};

            bookings.forEach(b => {
                const tourName = b.title || 'Unknown';
                tourCount[tourName] = (tourCount[tourName] || 0) + 1;
            });

            return Object.entries(tourCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([name, count]) => ({ name, count }));
        }
    },

    // ========== SYNC & MAINTENANCE ==========
    sync: {
        // ✅ ĐỒNG BỘ TẤT CẢ DỮ LIỆU
        syncAll() {
            console.log('🔄 Bắt đầu đồng bộ dữ liệu...');

            // Tính lại thống kê tours
            DataManager.tours.recalculateStats();

            // Tính lại thống kê customers
            DataManager.customers.recalculateStats();

            console.log('✅ Đồng bộ hoàn tất!');
        },

        // Làm sạch dữ liệu không hợp lệ
        cleanup() {
            const bookings = DataManager.bookings.getAll();
            const validBookings = bookings.filter(b =>
                b.user && b.user.email && b.title && b.price
            );

            if (validBookings.length !== bookings.length) {
                DataManager.bookings.save(validBookings);
                console.log(`🧹 Đã xóa ${bookings.length - validBookings.length} đơn không hợp lệ`);
            }
        }
    },

    // ========== UTILITY FUNCTIONS ==========
    clearAll() {
        if (confirm('⚠️ Bạn có chắc muốn xóa TẤT CẢ dữ liệu?\n\nHành động này KHÔNG THỂ hoàn tác!')) {
            localStorage.removeItem('tours');
            localStorage.removeItem('bookedTours');
            localStorage.removeItem('customers');
            localStorage.removeItem('payments');
            alert('✅ Đã xóa tất cả dữ liệu!');
            window.location.reload();
        }
    },

    exportData() {
        const data = {
            tours: this.tours.getAll(),
            bookings: this.bookings.getAll(),
            customers: this.customers.getAll(),
            payments: this.payments.getAll(),
            statistics: {
                totalTours: this.statistics.getTotalTours(),
                totalCustomers: this.statistics.getTotalCustomers(),
                totalRevenue: this.statistics.getTotalRevenue(),
                monthlyRevenue: this.statistics.getMonthlyRevenue()
            },
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tour-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    },

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (data.tours) this.tours.save(data.tours);
            if (data.bookings) this.bookings.save(data.bookings);
            if (data.customers) this.customers.save(data.customers);
            if (data.payments) this.payments.save(data.payments);

            alert('✅ Import dữ liệu thành công!');
            window.location.reload();
        } catch (error) {
            alert('❌ Lỗi import dữ liệu: ' + error.message);
        }
    }

};

// ==================== UI RENDER FUNCTIONS ====================

function renderToursTable() {
    const tours = DataManager.tours.getAll();
    let tbody = document.querySelector('#toursTable tbody');

    if (!tbody) {
        const table = document.getElementById('toursTable');
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }

    if (tours.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
                    <p style="font-size: 16px;">Chưa có tour nào</p>
                    <p style="font-size: 14px; margin-top: 5px;">Tour sẽ tự động tạo khi khách đặt!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = tours.map(tour => `
        <tr>
            <td><strong>${tour.id}</strong></td>
            <td>${tour.name}</td>
            <td>${tour.destination}</td>
            <td>${tour.duration}</td>
            <td><strong style="color: #2ecc71;">${Number(tour.price).toLocaleString('vi-VN')}₫</strong></td>
            <td><span class="status-badge ${tour.status === 'active' ? 'active' : 'cancelled'}">
                ${tour.status === 'active' ? '✓ Hoạt động' : '✕ Tạm dừng'}
            </span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-info" onclick="editTour('${tour.id}')">✏️ Sửa</button>
                    <button class="btn-danger" onclick="deleteTour('${tour.id}')">🗑️ Xóa</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderBookingsTable() {
    const bookings = DataManager.bookings.getAll();
    const tbody = document.getElementById('bookingsTableBody');

    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                    <p style="font-size: 16px;">Chưa có đơn đặt tour nào</p>
                    <p style="font-size: 14px; margin-top: 5px;">Đơn đặt từ khách hàng sẽ hiển thị ở đây</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(booking => {
        const status = booking.status || 'confirmed';
        
        return `
            <tr>
                <td><strong>${booking.maDonHang}</strong></td>
                <td>${booking.user?.hoTen || 'N/A'}</td>
                <td>${booking.title}</td>
                <td>${booking.date}</td>
                <td><strong style="color: #2ecc71;">${Number(booking.price).toLocaleString('vi-VN')}₫</strong></td>
                <td><span class="status-badge ${getStatusClass(status)}">
                    ${getStatusText(status)}
                </span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-info" onclick="viewBooking('${booking.maDonHang}')">👁️ Xem</button>
                        <button class="btn-danger" onclick="deleteBooking('${booking.maDonHang}')">🗑️ Xóa</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderCustomersTable() {
    const customers = DataManager.customers.getAll();
    const section = document.getElementById('section-customers');

    if (!section) return;

    let tableContainer = section.querySelector('.table-container');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        section.appendChild(tableContainer);
    }

    if (customers.length === 0) {
        tableContainer.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #7f8c8d;">
                <div style="font-size: 64px; margin-bottom: 20px;">👥</div>
                <p style="font-size: 18px; font-weight: 600;">Chưa có khách hàng nào</p>
                <p style="font-size: 14px; margin-top: 10px;">Khách hàng sẽ được tự động tạo khi có đơn đặt tour</p>
            </div>
        `;
        return;
    }

    tableContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Mã KH</th>
                    <th>Họ Tên</th>
                    <th>Email</th>
                    <th>Số Điện Thoại</th>
                    <th>Tổng Chi Tiêu</th>
                    <th>Thao Tác</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(customer => `
                    <tr>
                        <td><strong>${customer.id}</strong></td>
                        <td>${customer.hoTen}</td>
                        <td>${customer.email}</td>
                        <td>${customer.soDienThoai}</td>                        
                        <td><strong style="color: #2ecc71;">${Number(customer.totalSpent || 0).toLocaleString('vi-VN')}₫</strong></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-info" onclick="viewCustomer('${customer.id}')">👁️ Xem</button>
                                <button class="btn-danger"  onclick="deleteCustomer('${customer.id}')">🗑️ Xóa</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderPaymentsTable() {
    const payments = DataManager.payments.getAll();
    const tbody = document.getElementById('paymentsTableBody');

    if (!tbody) return;

    if (payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
                    <p style="font-size: 16px;">Chưa có giao dịch nào</p>
                    <p style="font-size: 14px; margin-top: 5px;">Giao dịch sẽ tự động tạo khi có đơn đặt tour</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td><strong>${payment.maThanhToan}</strong></td>
            <td>${payment.maDonHang}</td>
            <td>${payment.customerName}</td>
            <td><strong style="color: #2ecc71;">${Number(payment.amount).toLocaleString('vi-VN')}₫</strong></td>
            <td>${payment.paymentMethod}</td>
            <td><span class="status-badge active">✓ ${payment.status === 'completed' ? 'Đã thanh toán' : 'Chờ xử lý'}</span></td>
            <td>${payment.date}</td>
        </tr>
    `).join('');
}

function updateStatistics() {
    const totalTours = DataManager.statistics.getTotalTours();
    const todayBookings = DataManager.statistics.getTodayBookings();
    const totalCustomers = DataManager.statistics.getTotalCustomers();
    const monthlyRevenue = DataManager.statistics.getMonthlyRevenue();

    document.getElementById('totalTours').textContent = totalTours;
    document.getElementById('todayBookings').textContent = todayBookings;
    document.getElementById('totalCustomers').textContent = totalCustomers;
    document.getElementById('monthlyRevenue').textContent = monthlyRevenue + 'M';
}

// ==================== HELPER FUNCTIONS ====================

function getStatusText(status) {
    const statusMap = {
        'confirmed': '✓ Đã xác nhận',
        'pending': '⏳ Chờ xử lý',
        'cancelled': '✕ Đã hủy',
        'completed': '✓ Hoàn thành'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'confirmed': 'active',
        'pending': 'pending',
        'cancelled': 'cancelled',
        'completed': 'active'
    };
    return classMap[status] || 'pending';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== AUTO INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Tour V&V Data Manager v2.0');
    console.log('🔄 Đang đồng bộ dữ liệu...');

    // Đồng bộ dữ liệu
    DataManager.sync.syncAll();

    // Làm sạch dữ liệu không hợp lệ
    DataManager.sync.cleanup();

    console.log('✅ Data Manager đã sẵn sàng!');
});

// ==================== EXPORT TO WINDOW ====================
window.DataManager = DataManager;
window.renderToursTable = renderToursTable;
window.renderBookingsTable = renderBookingsTable;
window.renderCustomersTable = renderCustomersTable;
window.renderPaymentsTable = renderPaymentsTable;
window.updateStatistics = updateStatistics;
window.showNotification = showNotification;

console.log('✅ DataManager v2.0 loaded successfully!');