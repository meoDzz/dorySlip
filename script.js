// script.js - Đặt gần đầu file, sau các khai báo appData, dbFs
const EMAILJS_SERVICE_ID = 'service_9h1ejxa';
const EMAILJS_TEMPLATE_ID = 'template_rrfzyjl';
const EMAILJS_PUBLIC_KEY = 'V8_GRui5iRp1N95Sx';
// ... các code khác của script.js ...

/** ================== CONFIGURATION ================== **/
const firebaseConfig = {
  apiKey: "AIzaSyD6P3DDBDtdJYGo9GADi3-hP6Ex2Ijkr8M",
  authDomain: "dorydata-d9957.firebaseapp.com",
  projectId: "dorydata-d9957",
  storageBucket: "dorydata-d9957.appspot.com",
  messagingSenderId: "60750852171",
  appId: "1:60750852171:web:4d05a104fa96b2d6bc1dce",
  measurementId: "G-V9SX4C86HC"
};

// Khởi tạo Firebase (compat)
firebase.initializeApp(firebaseConfig);
const dbFs = firebase.firestore(); // Firestore sẽ là CSDL chính của chúng ta

/** =================================================== **/
/** Utility DOM helpers **/
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function show(sel) {
  $$(".view").forEach(v => v.style.display = "none");
  $(sel).style.display = "block";
}
function activateTabs(scopeSel) {
  const scope = $(scopeSel);
  if (!scope) return;
  $$(".tab", scope).forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      $$(".tab", scope).forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const targetSel = tab.getAttribute("data-target");
      if (!targetSel) return;

      if (targetSel.startsWith("#view-")) {
        show(targetSel);
      } else { 
        $$(".tab-pane", scope).forEach(p => p.style.display = "none");
        const pane = $(`#${targetSel}`, scope);
        if (pane) pane.style.display = "block";
      }
    });
  });
}

function setSession(user) {
  if (user) localStorage.setItem("sessionUser", JSON.stringify(user));
  else localStorage.removeItem("sessionUser");
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("sessionUser") || "null");
  } catch {
    return null;
  }
}

/** ================== DỮ LIỆU ỨNG DỤNG ================== **/
let appData = {
  users: [
    { username: "nhaplieu", password: "123456", role: "nhap_lieu" },
    { username: "ketoan",   password: "123456", role: "ke_toan"   },
    { username: "admin",    password: "123456", role: "admin"     }
  ],
  employees: [],
  entryMonthly: [],
  payrolls: []
};
window.currentUser = null;


/** ============= FIRESTORE DATA HANDLING ============= **/
async function loadInitialData() {
  console.log("Loading initial data from Firestore...");
  try {
    const [employeesSnapshot, entryMonthlySnapshot, payrollsSnapshot] = await Promise.all([
      dbFs.collection("employees").orderBy("nameVi").get(),
      dbFs.collection("entryMonthly").get(),
      dbFs.collection("payrolls").get()
    ]);

    appData.employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    appData.entryMonthly = entryMonthlySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    appData.payrolls = payrollsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log("Data loaded!", appData);
    refreshStats();
  } catch (error)
  {
    console.error("Error loading initial data: ", error);
    alert("Lỗi khi tải dữ liệu ban đầu. Vui lòng kiểm tra kết nối mạng và F5 lại trang.");
  }
}

/** ============= UI RENDERING & LOGIC ============= **/

function createEntryRowHtml(data = {}) {
    // Nếu data có employeeId, tìm thông tin nhân viên đầy đủ
    const employeeInfo = data.employeeId ? appData.employees.find(e => e.id === data.employeeId) : data;
    const finalData = { ...employeeInfo, ...data };

    return `
        <td><input type="text" class="en-nameVi" placeholder="Tên tiếng Việt" value="${finalData.nameVi || ''}"></td>
        <td><input type="text" class="en-nameEn" placeholder="Tên tiếng Anh" value="${finalData.nameEn || ''}"></td>
        <td><input type="text" class="en-code" placeholder="Mã NV" value="${finalData.code || ''}"></td>
        <td><input type="text" class="en-bankAcc" placeholder="Số tài khoản" value="${finalData.bankAcc || ''}"></td>
        <td><input type="text" class="en-bankName" placeholder="Ngân hàng" value="${finalData.bankName || ''}"></td>
        <td><input type="email" class="en-email" placeholder="email@example.com" value="${finalData.email || ''}"></td> <td><input type="text" class="en-className" placeholder="Lớp" value="${finalData.className || ''}"></td>
        <td><input type="number" class="en-totalSessions" step="0.5" placeholder="Buổi" value="${finalData.totalSessions || 0}"></td>
        <td><input type="number" class="en-totalHours" step="0.25" placeholder="Giờ" value="${finalData.totalHours || 0}"></td>
        <td><button class="btn danger small btn-en-deleterow">Xóa</button></td>
    `;
}

function addEmptyEntryRow() {
    const tableBody = $("#tbl-entry tbody");
    if (!tableBody) return;
    const newRow = tableBody.insertRow();
    newRow.innerHTML = createEntryRowHtml();
}

function refreshStats() {
  $("#stat-emps").textContent = appData.employees.length;
  // Sửa lại cách đếm, vì entryMonthly giờ là chi tiết từng lớp
  const uniqueEntries = new Set(appData.entryMonthly.map(e => `${e.month}_${e.employeeId}`)).size;
  $("#stat-rows").textContent = uniqueEntries;
}

/** ============= KHỞI ĐỘNG ỨNG DỤNG ============= **/
async function main() {
  const s = getSession();
  if (s) window.currentUser = s;

  if (window.currentUser) {
    $("#userBox").textContent = `${window.currentUser.username} (${window.currentUser.role})`;
    $("#btn-logout").style.display = "inline-flex";
    $$(".role-nhap_lieu").forEach(el => el.style.display = (["nhap_lieu", "admin"].includes(window.currentUser.role) ? "" : "none"));
    $$(".role-ke_toan").forEach(el => el.style.display = (["ke_toan", "admin"].includes(window.currentUser.role) ? "" : "none"));
    $$(".role-admin").forEach(el => el.style.display = (window.currentUser.role === "admin" ? "" : "none"));
    
    show("#view-dashboard");
    activateTabs(".topbar");
    activateTabs("#view-dashboard");
    
    await loadInitialData();
    initDefaults(); // Chuyển xuống sau khi load data để có thể auto-fill

  } else {
    show("#view-login");
  }

  /** ====== GẮN SỰ KIỆN CHO CÁC NÚT ====== **/
  const btnLogin = $("#btn-login");
  if (btnLogin) btnLogin.addEventListener("click", async () => {
    const u = $("#login-username").value.trim(), p = $("#login-password").value;
    const user = appData.users.find(x => x.username === u && x.password === p);
    if (!user) { alert("Sai tài khoản hoặc mật khẩu"); return; }
    window.currentUser = user; setSession(user);
    location.reload(); 
  });

/**
 * File: script.js
 * THAY THẾ TOÀN BỘ PHẦN XỬ LÝ SỰ KIỆN CỦA NÚT NÀY
 */
const btnSaveMonth = $("#btn-en-save");
if (btnSaveMonth) btnSaveMonth.onclick = async () => {
    const month = $("#en-month").value;
    if (!month) {
        alert("Vui lòng chọn tháng để lưu.");
        return;
    }
    
    const rows = $$("#tbl-entry tbody tr");
    if (rows.length === 0) {
        alert("Không có dữ liệu nào để lưu.");
        return;
    }

    btnSaveMonth.textContent = "Đang lưu...";
    btnSaveMonth.disabled = true;

    try {
        const batch = dbFs.batch();

        // **QUAN TRỌNG: Xóa tất cả các entry cũ của tháng này trước khi thêm mới**
        const oldEntriesQuery = await dbFs.collection("entryMonthly").where("month", "==", month).get();
        oldEntriesQuery.forEach(doc => {
            batch.delete(doc.ref);
        });

        for (const row of rows) {
            const code = row.querySelector(".en-code").value.trim();
            if (!code) continue; // Bỏ qua các dòng trống

            let employee = appData.employees.find(e => e.code === code);
            let employeeRef;

            if (employee) {
                employeeRef = dbFs.collection("employees").doc(employee.id);
            } else {
                employeeRef = dbFs.collection("employees").doc();
                employee = { id: employeeRef.id, code: code };
            }
            
            // Cập nhật thông tin nhân viên
            const employeeData = {
                code: code,
                nameVi: row.querySelector(".en-nameVi").value.trim(),
                nameEn: row.querySelector(".en-nameEn").value.trim(),
                bankAcc: row.querySelector(".en-bankAcc").value.trim(),
                bankName: row.querySelector(".en-bankName").value.trim(),
                email: row.querySelector(".en-email").value.trim(), // THÊM DÒNG NÀY ĐỂ LẤY EMAIL
            };
            batch.set(employeeRef, employeeData, { merge: true });

            // **Tạo một entry MỚI cho mỗi dòng (mỗi lớp)**
            const entryRef = dbFs.collection("entryMonthly").doc(); // ID tự động
            const entryData = {
                month: month,
                employeeId: employee.id,
                className: row.querySelector(".en-className").value.trim() || 'Không có tên lớp',
                totalSessions: parseFloat(row.querySelector(".en-totalSessions").value) || 0,
                totalHours: parseFloat(row.querySelector(".en-totalHours").value) || 0,
            };
            batch.set(entryRef, entryData);
        }

        await batch.commit();

        alert(`Đã lưu thành công dữ liệu cho tháng ${month}!`);
        await loadInitialData(); // Tải lại toàn bộ dữ liệu để đồng bộ

    } catch (error) {
        console.error("Lỗi khi lưu dữ liệu: ", error);
        alert("Đã xảy ra lỗi. Vui lòng kiểm tra lại dữ liệu hoặc xem console log.");
    } finally {
        btnSaveMonth.textContent = "Lưu tháng";
        btnSaveMonth.disabled = false;
    }
};

  /** ====== GẮN SỰ KIỆN CHO CÁC NÚT NHẬP LIỆU ====== **/
  const btnNewRow = $("#btn-en-newrow");
  if (btnNewRow) {
    btnNewRow.addEventListener("click", addEmptyEntryRow);
  }

  const btnCopyMonth = $("#btn-en-copy");
  if (btnCopyMonth) {
      btnCopyMonth.addEventListener("click", () => {
          const currentMonth = $("#en-month").value;
          if (!currentMonth) {
              alert("Vui lòng chọn tháng hiện tại để sao chép.");
              return;
          }
          const [year, monthNum] = currentMonth.split('-').map(Number);
          const prevMonthDate = new Date(year, monthNum - 2);
          const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
          
          const prevEntries = appData.entryMonthly.filter(e => e.month === prevMonth);
          $("#tbl-entry tbody").innerHTML = "";

          if (prevEntries.length > 0) {
              prevEntries.forEach(entry => {
                  const row = $("#tbl-entry tbody").insertRow();
                  row.innerHTML = createEntryRowHtml(entry);
              });
              alert(`Đã sao chép dữ liệu từ tháng ${prevMonth}.`);
          } else {
              alert(`Không tìm thấy dữ liệu cho tháng ${prevMonth}.`);
          }
      });
  }

const entryTbody = $("#tbl-entry tbody");
if (entryTbody) {
    // Xóa dòng trực tiếp trên UI
    entryTbody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-en-deleterow')) {
            e.target.closest('tr').remove();
        }
    });
    
    // **TÍNH NĂNG MỚI: Tự động điền thông tin nhân viên khi nhập Mã NV**
    entryTbody.addEventListener('change', (e) => {
        if (e.target.classList.contains('en-code')) {
            const code = e.target.value.trim();
            const employee = appData.employees.find(emp => emp.code === code);
            if (employee) {
                const row = e.target.closest('tr');
                row.querySelector('.en-nameVi').value = employee.nameVi || '';
                row.querySelector('.en-nameEn').value = employee.nameEn || '';
                row.querySelector('.en-bankAcc').value = employee.bankAcc || '';
                row.querySelector('.en-bankName').value = employee.bankName || '';
                row.querySelector('.en-email').value = employee.email || ''; // THÊM DÒNG NÀY
            }
        }
    });
}

  /** ====== GẮN SỰ KIỆN CHO TAB KẾ TOÁN ====== **/
  const btnPrBuild = $("#btn-pr-build");
  if (btnPrBuild) {
      btnPrBuild.addEventListener("click", buildPayrollForMonth);
  }
  
  handlePayrollActions(); // Kích hoạt listener cho các nút trong bảng lương
  const modal = $("#payslip-modal");
    if (modal) {
        const closeModal = () => modal.style.display = 'none';
        // Đóng khi nhấn nút (x)
        $(".modal-close-btn", modal).addEventListener('click', closeModal);
        // Đóng khi nhấn vào nền mờ bên ngoài
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

window.addEventListener("DOMContentLoaded", main);


/** ============= CÁC HÀM PHỤ TRỢ APP ============= **/
function initDefaults() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${year}-${month}`;

  const monthInput = $("#en-month");
  if (monthInput) {
    if (!monthInput.value) {
      monthInput.value = currentMonth;
    }
    monthInput.addEventListener("change", () => loadEntriesForMonth(monthInput.value));
    loadEntriesForMonth(monthInput.value);
  }
  
  const prMonthInput = $("#pr-month");
  if (prMonthInput && !prMonthInput.value) {
      prMonthInput.value = currentMonth;
  }
}

async function loadEntriesForMonth(month) {
  try {
    const entries = appData.entryMonthly.filter(entry => entry.month === month);
    const tbody = $("#tbl-entry tbody");
    tbody.innerHTML = "";

    entries.sort((a,b) => {
        const empA = appData.employees.find(e => e.id === a.employeeId)?.nameVi || '';
        const empB = appData.employees.find(e => e.id === b.employeeId)?.nameVi || '';
        return empA.localeCompare(empB);
    });

    for (const entry of entries) {
      const row = tbody.insertRow();
      row.innerHTML = createEntryRowHtml(entry);
    }
    console.log(`Đã load ${entries.length} dòng cho tháng ${month}`);
  } catch (err) {
    console.error("Lỗi khi load dữ liệu tháng:", err);
    alert("Không thể tải dữ liệu tháng.");
  }
}

/** ============= CÁC HÀM CHO TAB KẾ TOÁN (ĐÃ CẬP NHẬT) ============= **/

/**
 * File: script.js
 * Thay thế hàm cũ bằng hàm đã sửa lỗi này
 */
async function buildPayrollForMonth() {
    const month = $("#pr-month").value;
    if (!month) {
        alert("Vui lòng chọn tháng để tổng hợp.");
        return;
    }

    const btn = $("#btn-pr-build");
    btn.textContent = "Đang tổng hợp...";
    btn.disabled = true;

    try {
        const entriesForMonth = appData.entryMonthly.filter(e => e.month === month);
        const tbody = $("#tbl-pr tbody");
        tbody.innerHTML = "";

        if (entriesForMonth.length === 0) {
            alert(`Không có dữ liệu chấm công cho tháng ${month}.`);
            return;
        }

        // Bước 1: Gom nhóm tất cả các lớp dạy theo employeeId
        const entriesByEmployee = entriesForMonth.reduce((acc, entry) => {
            if (!acc[entry.employeeId]) {
                acc[entry.employeeId] = [];
            }
            acc[entry.employeeId].push(entry);
            return acc;
        }, {});

        // Bước 2: Lấy danh sách nhân viên đã chấm công và sắp xếp theo tên
        const employeesInMonth = appData.employees
            .filter(emp => entriesByEmployee[emp.id])
            .sort((a, b) => a.nameVi.localeCompare(b.nameVi));

        // Bước 3: Dựng bảng cho từng nhân viên
        for (const employee of employeesInMonth) {
            const employeeEntries = entriesByEmployee[employee.id];
            let totalHoursForEmployee = 0;
            let totalGrossForEmployee = 0;
            
            // Lấy thông tin lương đã lưu
            const payrollId = `${month}_${employee.id}`;
            const existingPayroll = appData.payrolls.find(p => p.id === payrollId) || {};
            const rate = existingPayroll.rate || employee.rate || 0;
            const bhxh = existingPayroll.bhxh || employee.bhxh || 0;
            const pitax = existingPayroll.pitax || 0;
            const deductions = existingPayroll.deductions || 0;
            const advance = existingPayroll.advance || 0;

            // Dựng các dòng chi tiết cho từng lớp
            employeeEntries.forEach((entry, index) => {
                const hours = entry.totalHours || 0;
                const gross = hours * rate;
                totalHoursForEmployee += hours;
                totalGrossForEmployee += gross;

                const detailRow = tbody.insertRow();
                detailRow.className = 'payroll-detail-row';
                detailRow.innerHTML = `
                    <td>${index === 0 ? `${employee.nameVi} (${employee.code})` : ''}</td>
                    <td>${entry.className || 'N/A'}</td>
                    <td>${hours}</td>
                    <td class="number">${rate.toLocaleString()}</td>
                    <td class="number">${gross.toLocaleString()}</td>
                    <td colspan="7"></td>
                `;
            });

            // Dựng dòng tổng kết cho nhân viên
            const net = totalGrossForEmployee - bhxh - pitax - deductions;
            const remaining = net - advance;

            const summaryRow = tbody.insertRow();
            summaryRow.className = 'payroll-summary-row';
            summaryRow.dataset.employeeId = employee.id;
            summaryRow.dataset.month = month;
            summaryRow.innerHTML = `
                <td></td>
                <td><strong>Tổng cộng</strong></td>
                <td><strong>${totalHoursForEmployee}</strong></td>
                <td></td>
                <td><strong>${totalGrossForEmployee.toLocaleString()}</strong></td>
                <td><input type="number" class="pr-bhxh" value="${bhxh}"></td>
                <td><input type="number" class="pr-pitax" value="${pitax}"></td>
                <td><input type="number" class="pr-deductions" value="${deductions}"></td>
                <td class="number"><strong>${net.toLocaleString()}</strong></td>
                <td><input type="number" class="pr-advance" value="${advance}"></td>
                <td class="number"><strong>${remaining.toLocaleString()}</strong></td>
                <td>
                    <button class="btn small primary btn-pr-save">Lưu</button>
                    <button class="btn small btn-pr-slip">Phiếu lương</button>
                </td>
            `;
        }
    } catch (error) {
        console.error("Lỗi khi tổng hợp lương:", error);
        alert("Đã xảy ra lỗi trong quá trình tổng hợp lương.");
    } finally {
        btn.textContent = "Tổng hợp tháng";
        btn.disabled = false;
    }
}

function handlePayrollActions() {
    const tbody = $("#tbl-pr tbody");
    if (!tbody) return;

    tbody.addEventListener("click", async (e) => {
        const target = e.target;
        const row = target.closest(".payroll-summary-row"); // Chỉ lắng nghe trên dòng tổng kết
        if (!row) return;
        
        const employeeId = row.dataset.employeeId;
        const month = row.dataset.month;

        if (target.classList.contains("btn-pr-save")) {
            const btnSave = target;
            if (!employeeId || !month) return alert("Lỗi: Không tìm thấy ID nhân viên hoặc tháng.");
            btnSave.textContent = "Đang lưu...";
            btnSave.disabled = true;
            try {
                // Lấy rate từ dữ liệu nhân viên hoặc từ một input nếu bạn có (hiện tại không có input rate trên dòng tổng kết)
                const employee = appData.employees.find(e => e.id === employeeId);
                const rate = employee?.rate || 0; // Giả sử rate đã được định nghĩa ở employee

                const bhxh = parseFloat(row.querySelector(".pr-bhxh").value) || 0;
                const pitax = parseFloat(row.querySelector(".pr-pitax").value) || 0;
                const deductions = parseFloat(row.querySelector(".pr-deductions").value) || 0;
                const advance = parseFloat(row.querySelector(".pr-advance").value) || 0;

                const batch = dbFs.batch();
                
                // Cập nhật payroll
                const payrollId = `${month}_${employeeId}`;
                const payrollRef = dbFs.collection("payrolls").doc(payrollId);
                const payrollData = { id: payrollId, month, employeeId, rate, bhxh, pitax, deductions, advance };
                batch.set(payrollRef, payrollData, { merge: true });
                await batch.commit();

                // Cập nhật appData local
                const payrollIndex = appData.payrolls.findIndex(p => p.id === payrollId);
                if(payrollIndex > -1) appData.payrolls[payrollIndex] = { ...appData.payrolls[payrollIndex], ...payrollData }; 
                else appData.payrolls.push(payrollData);
                
                alert(`Đã cập nhật thành công.`);
                
                // Tính toán lại Net và Còn lại trên UI
                const totalGrossText = row.children[4].textContent.replace(/,/g, '');
                const totalGross = parseFloat(totalGrossText) || 0;
                const net = totalGross - bhxh - pitax - deductions;
                const remaining = net - advance;

                row.children[8].innerHTML = `<td class="number"><strong>${net.toLocaleString()}</strong></td>`;
                row.children[10].innerHTML = `<td class="number"><strong>${remaining.toLocaleString()}</strong></td>`;

            } catch (error) {
                console.error("Lỗi khi lưu dữ liệu payroll:", error);
                alert("Đã có lỗi xảy ra khi lưu.");
            } finally {
                btnSave.textContent = "Lưu";
                btnSave.disabled = false;
            }
        }

        if (target.classList.contains("btn-pr-slip")) {
            // Nút "Phiếu lương" sẽ in ra phiếu lương
            generateAndPrintPayslip(employeeId, month, 'print');
        }

        // Đã thêm nút này trực tiếp vào HTML của phiếu lương, nên không cần xử lý ở đây nữa
        // nếu bạn muốn nút riêng ở bảng chính thì thêm vào đây
        // if (target.classList.contains("btn-pr-send-email")) {
        //     sendPayslipEmail(employeeId, month);
        // }
    });
}


function createPayslipHtml(employee, payrollEntries, payroll, month) {
    const [year, monthNum] = month.split('-');
    
    const rate = payroll.rate || employee.rate || 0;
    const bhxh = payroll.bhxh || 0;
    const pitax = payroll.pitax || 0;
    const deductions = payroll.deductions || 0;
    const advance = payroll.advance || 0;

    let totalGross = 0;
    const detailRowsHtml = payrollEntries.map((entry, index) => {
        const subtotal = (entry.totalHours || 0) * rate;
        totalGross += subtotal;
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.className}</td>
                <td class="number">${entry.totalSessions || 0}</td>
                <td class="number">${entry.totalHours || 0}</td>
                <td class="number">${rate.toLocaleString()}</td>
                <td class="number">${subtotal.toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    const totalDeductions = bhxh + pitax + deductions;
    const netSalary = totalGross - totalDeductions;
    const finalTakeHome = netSalary - advance;
    
    const amountInWordsVI = numberToVietnameseWords(finalTakeHome);
    const amountInWordsEN = numberToEnglishWords(finalTakeHome);

    // Thêm id="payslip-print-area" để CSS in ấn hoạt động chính xác
    return `
    <div class="payslip-container" id="payslip-print-area">
        <div class="payslip-header">
            <h1>PHIẾU LƯƠNG / PAYSLIP</h1>
            <p>Tháng / Month ${monthNum}/${year}</p>
        </div>

        <div class="section-title">THÔNG TIN NHÂN VIÊN / EMPLOYEE INFORMATION</div>
        <div class="info-grid">
            <p><strong>Họ và tên / Full Name:</strong> ${employee.nameVi || ''}</p>
            <p><strong>Mã nhân viên / Employee ID:</strong> ${employee.code || ''}</p>
            <p><strong>Số tài khoản / Bank Account:</strong> ${employee.bankAcc || ''}</p>
            <p><strong>Ngân hàng / Bank Name:</strong> ${employee.bankName || ''}</p>
        </div>

        <div class="section-title">CHI TIẾT THU NHẬP / EARNINGS DETAILS</div>
        <table class="payslip-table">
            <thead>
                <tr>
                    <th>STT / No.</th>
                    <th>Lớp/Nội dung / Class/Content</th>
                    <th class="number">Số buổi / Sessions</th>
                    <th class="number">Số giờ / Hours</th>
                    <th class="number">Đơn giá/giờ / Rate/Hour</th>
                    <th class="number">Thành tiền (VND) / Amount (VND)</th>
                </tr>
            </thead>
            <tbody>
                ${detailRowsHtml}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" style="text-align: right;"><strong>Tổng thu nhập trước thuế / Total Gross Earnings:</strong></td>
                    <td class="number"><strong>${totalGross.toLocaleString()}</strong></td>
                </tr>
            </tfoot>
        </table>

        <div class="section-title">TÓM TẮT LƯƠNG / SALARY SUMMARY</div>
        <div class="summary-details">
            <div class="summary-item">
                <span class="label">Tổng thu nhập / Gross Salary:</span>
                <span class="value">${totalGross.toLocaleString()}</span>
            </div>
            <div class="summary-item">
                <span class="label">(-) BHXH / Social Insurance:</span>
                <span class="value">${bhxh.toLocaleString()}</span>
            </div>
            <div class="summary-item">
                <span class="label">(-) Thuế TNCN / Personal Income Tax:</span>
                <span class="value">${pitax.toLocaleString()}</span>
            </div>
            <div class="summary-item">
                <span class="label">(-) Các khoản trừ khác / Other Deductions:</span>
                <span class="value">${deductions.toLocaleString()}</span>
            </div>
            <div class="summary-item total">
                <span class="label">Lương thực nhận / Net Salary:</span>
                <span class="value">${netSalary.toLocaleString()}</span>
            </div>
            <div class="summary-item">
                <span class="label">(-) Tạm ứng / Advance:</span>
                <span class="value">${advance.toLocaleString()}</span>
            </div>
            <div class="summary-item final-total">
                <span class="label">CÒN LẠI (Thực lãnh) / FINAL TAKE-HOME:</span>
                <span class="value">${finalTakeHome.toLocaleString()}</span>
            </div>
        </div>

        <div class="amount-in-words">
            <strong>Bằng chữ / In words:</strong><br>
            <em>(Tiếng Việt) ${amountInWordsVI}</em><br>
            <em>(English) ${amountInWordsEN}</em>
        </div>

        <div class="signature-area">
            <div class="signature-box">
                <strong>Người lập phiếu / Prepared by</strong>
                <p>(Ký, họ tên / Signature, Full Name)</p>
            </div>
            <div class="signature-box">
                <strong>Kế toán trưởng / Chief Accountant</strong>
                <p>(Ký, họ tên / Signature, Full Name)</p>
            </div>
            <div class="signature-box">
                <strong>Người nhận lương / Employee</strong>
                <p>(Ký, họ tên / Signature, Full Name)</p>
            </div>
        </div>
        <div id="pr-actions-container" style="text-align: center; margin-top: 30px;">
            <button class="btn primary" onclick="window.print()">In Phiếu Lương</button>
            <button class="btn" onclick="sendPayslipEmail('${employee.id}', '${month}')">Gửi Email Phiếu Lương</button>
        </div>
    </div>
    `;
}

async function generateAndPrintPayslip(employeeId, month) {
    const employee = appData.employees.find(emp => emp.id === employeeId);
    if (!employee) {
        alert("Không tìm thấy thông tin nhân viên.");
        return;
    }

    const payroll = appData.payrolls.find(p => p.id === `${month}_${employeeId}`);
    if (!payroll) {
        alert("Không tìm thấy thông tin lương cho tháng này.");
        return;
    }

    const payrollEntries = appData.entryMonthly.filter(e => e.employeeId === employeeId && e.month === month);

    const payslipHtml = createPayslipHtml(employee, payrollEntries, payroll, month);

    const modal = $("#payslip-modal");
    const modalBody = $("#payslip-modal-body");

    if (modal && modalBody) {
        modalBody.innerHTML = payslipHtml;
        modal.style.display = 'flex'; // Hiển thị modal
    } else {
        console.error("Không tìm thấy các thành phần của modal trong DOM!");
    }
}


async function sendPayslipEmail(employeeId, month) {
    const employee = appData.employees.find(emp => emp.id === employeeId);
    if (!employee || !employee.email) {
        alert("Không tìm thấy email của nhân viên. Vui lòng cập nhật thông tin nhân viên.");
        return;
    }

    const payroll = appData.payrolls.find(p => p.id === `${month}_${employeeId}`);
    if (!payroll) {
        alert("Không tìm thấy thông tin lương cho tháng này.");
        return;
    }
    const payrollEntries = appData.entryMonthly.filter(e => e.employeeId === employeeId && e.month === month);

    // Lấy nội dung HTML của phiếu lương (không có các nút)
    const payslipContent = createPayslipHtml(employee, payrollEntries, payroll, month);
    
    // Tạo một phiên bản phiếu lương không có nút in/gửi để gửi qua email
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = payslipContent;
    const actionsContainer = tempDiv.querySelector('#pr-actions-container');
    if(actionsContainer) {
        actionsContainer.remove(); // Xóa các nút trước khi gửi email
    }

    const finalPayslipHtmlForEmail = tempDiv.innerHTML;


    const btnSendEmail = document.querySelector(`.payroll-summary-row[data-employee-id="${employeeId}"][data-month="${month}"] .btn.success`);
    if (btnSendEmail) {
        btnSendEmail.textContent = "Đang gửi...";
        btnSendEmail.disabled = true;
    }

    try {
        const templateParams = {
            to_name: employee.nameVi,
            to_email: employee.email,
            from_name: 'Your Company Name', // Tên công ty của bạn
            subject: `Phiếu lương tháng ${month} - ${employee.nameVi}`,
            message_html: finalPayslipHtmlForEmail,
            month: month,
            year: month.split('-')[0],
            employee_name: employee.nameVi,
            final_take_home: (payroll.netSalary - payroll.advance).toLocaleString()
        };

        const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        console.log('Email sent successfully:', result);
        alert(`Phiếu lương đã được gửi thành công đến ${employee.email}`);
    } catch (error) {
        console.error('Failed to send email:', error);
        alert(`Đã xảy ra lỗi khi gửi email: ${error.text || error}`);
    } finally {
        if (btnSendEmail) {
            btnSendEmail.textContent = "Gửi Email Phiếu Lương";
            btnSendEmail.disabled = false;
        }
    }
}



// function createPayslipHtml(employee, classEntries, payroll, month) {
//     const [year, monthNum] = month.split('-');
    
//     const rate = payroll.rate || employee.rate || 0;
//     const bhxh = payroll.bhxh || 0;
//     const pitax = payroll.pitax || 0;
//     const deductions = payroll.deductions || 0;
//     const advance = payroll.advance || 0;

//     let gross = 0;
//     // **Tạo HTML cho từng dòng chi tiết lớp học**
//     const detailRowsHtml = classEntries.map((entry, index) => {
//         const subtotal = (entry.totalHours || 0) * rate;
//         gross += subtotal;
//         return `
//             <tr>
//                 <td>${index + 1}</td>
//                 <td>${entry.className}</td>
//                 <td>${entry.totalSessions || 0}</td>
//                 <td>${entry.totalHours || 0}</td>
//                 <td class="number">${rate.toLocaleString()}</td>
//                 <td class="number">${subtotal.toLocaleString()}</td>
//             </tr>
//         `;
//     }).join('');

//     const totalDeductions = bhxh + pitax + deductions;
//     const net = gross - totalDeductions;
//     const finalTakeHome = net - advance;
//     const amountInWords = numberToVietnameseWords(finalTakeHome);

//     return `
//     <!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
//     <title>Phiếu Lương Tháng ${monthNum}/${year} - ${employee.nameVi}</title>
//     <style>
//         body { font-family: 'Arial', sans-serif; font-size: 13px; line-height: 1.6; color: #333; margin: 0; padding: 0; }
//         .payslip-container { max-width: 800px; margin: 20px auto; padding: 25px; border: 1px solid #ddd; }
//         h1 { text-align: center; color: #444; margin-top: 0; margin-bottom: 20px; font-size: 22px; }
//         .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 25px; border-bottom: 1px dashed #ccc; padding-bottom: 15px; }
//         .info-grid p { margin: 0; }
//         .info-grid p strong { display: inline-block; min-width: 100px; }
//         table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
//         th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
//         th { background-color: #f2f2f2; font-weight: bold; }
//         td.number { text-align: right; }
//         .summary-grid { display: grid; grid-template-columns: 1fr 200px; gap: 5px 20px; }
//         .summary-grid .label { font-weight: bold; }
//         .summary-grid .value { text-align: right; }
//         .total { font-size: 16px; font-weight: bold; color: #000; }
//         .signature-area { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; }
//     </style></head><body>
//     <div class="payslip-container" id="payslip-print-area">
//         <h1>PHIẾU LƯƠNG THÁNG ${monthNum}/${year}</h1>
//         <div class="info-grid">
//             <p><strong>Họ và tên:</strong> ${employee.nameVi || ''}</p>
//             <p><strong>Mã nhân viên:</strong> ${employee.code || ''}</p>
//             <p><strong>Số tài khoản:</strong> ${employee.bankAcc || ''}</p>
//             <p><strong>Ngân hàng:</strong> ${employee.bankName || ''}</p>
//         </div>
//         <table>
//             <thead><tr><th>STT</th><th>Lớp/Nội dung công việc</th><th>Số buổi</th><th>Số giờ</th><th class="number">Đơn giá/giờ</th><th class="number">Thành tiền (VND)</th></tr></thead>
//             <tbody>${detailRowsHtml}</tbody>
//         </table>
//         <div class="summary-grid">
//             <div class="label">Tổng cộng (Gross):</div><div class="value">${gross.toLocaleString()}</div>
//             <div class="label">(-) BHXH:</div><div class="value">${bhxh.toLocaleString()}</div>
//             <div class="label">(-) Thuế TNCN:</div><div class="value">${pitax.toLocaleString()}</div>
//             <div class="label">(-) Các khoản trừ khác:</div><div class="value">${deductions.toLocaleString()}</div>
//             <div class="label total">Lương thực nhận (Net):</div><div class="value total">${net.toLocaleString()}</div>
//             <div class="label">(-) Tạm ứng:</div><div class="value">${advance.toLocaleString()}</div>
//             <div class="label total">CÒN LẠI (Thực lãnh):</div><div class="value total">${finalTakeHome.toLocaleString()}</div>
//         </div>
//         <p style="margin-top: 10px;"><strong>Bằng chữ:</strong> <em>${amountInWords}</em></p>
//         <div class="signature-area">
//             <div><strong>Người lập phiếu</strong><p>(Ký, họ tên)</p></div>
//             <div><strong>Kế toán trưởng</strong><p>(Ký, họ tên)</p></div>
//             <div><strong>Người nhận lương</strong><p>(Ký, họ tên)</p></div>
//         </div>
//     </div></body></html>`;
// }


function numberToVietnameseWords(n) {
    if (n === 0) return "Không đồng";
    const s = n.toString();
    const a = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    let result = "";

    function convertChunk(chunk) {
        if (chunk === "000") return "";
        chunk = chunk.padStart(3, '0');
        const [tr, ch, dv] = [chunk[0], chunk[1], chunk[2]];
        let res = "";
        if (tr !== '0') res += a[tr] + " trăm ";
        if (ch === '0' && dv !== '0' && tr !== '0') res += " linh ";
        if (ch === '1') res += " mười ";
        if (ch > '1') res += a[ch] + " mươi ";
        if (ch !== '0' && dv === '1' && ch !== '1') res += " mốt ";
        else if (dv === '5' && ch !== '0') res += " lăm ";
        else if (dv > '0') res += a[dv];
        return res.trim();
    }
    
    let i = s.length;
    let j = 0;
    while (i > 0) {
        let chunk = s.substring(i - 3, i);
        i -= 3;
        if (chunk) {
            const converted = convertChunk(chunk);
            if (converted) {
                result = converted + " " + ["", "nghìn", "triệu", "tỷ"][j] + " " + result;
            }
        }
        j++;
    }
    
    result = result.trim().replace(/\s+/g, ' ');
    return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
}




function numberToVietnameseWords(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return "Số không hợp lệ";
    }

    const units = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const thousands = ['', 'nghìn', 'triệu', 'tỷ'];

    let s = Math.floor(Math.abs(num)).toString();
    const len = s.length;

    let result = [];
    let group = 0;
    
    for (let i = len - 1; i >= 0; i -= 3) {
        let n1 = i - 2 >= 0 ? parseInt(s[i - 2]) : 0;
        let n2 = i - 1 >= 0 ? parseInt(s[i - 1]) : 0;
        let n3 = parseInt(s[i]);

        if (n1 === 0 && n2 === 0 && n3 === 0) {
            group++;
            continue;
        }

        let temp = [];
        if (n1 > 0) {
            temp.push(units[n1]);
            temp.push('trăm');
        }

        if (n2 === 0 && n3 !== 0) {
            if (n1 !== 0) temp.push('linh');
            temp.push(units[n3]);
        } else if (n2 === 1) {
            temp.push(teens[n3]);
        } else if (n2 > 1) {
            temp.push(tens[n2]);
            if (n3 === 1) {
                temp.push('mốt');
            } else if (n3 === 5) {
                temp.push('lăm');
            } else if (n3 !== 0) {
                temp.push(units[n3]);
            }
        } else if (n3 !== 0) { // n2 === 0, n3 !== 0
            temp.push(units[n3]);
        }
        
        if (temp.length > 0 && thousands[group]) {
            temp.push(thousands[group]);
        }
        
        result.unshift(temp.join(' '));
        group++;
    }

    let finalResult = result.join(' ').replace(/\s+/g, ' ').trim();
    if (finalResult === 'không') return 'Không đồng chẵn';
    if (num < 0) return 'Âm ' + finalResult + ' đồng chẵn';
    return finalResult.charAt(0).toUpperCase() + finalResult.slice(1) + ' đồng chẵn';
}

// Hàm chuyển số thành chữ tiếng Anh (đơn giản, có thể cần thư viện phức tạp hơn cho số lớn)
function numberToEnglishWords(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return "Invalid number";
    }
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function inWords(n) {
        if ((n = n.toString()).length > 9) return 'overflow';
        let n_str = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n_str) return;
        let str = '';
        str += (n_str[1] != 0) ? (a[Number(n_str[1])] || b[n_str[1][0]] + ' ' + a[n_str[1][1]]) + 'crore ' : '';
        str += (n_str[2] != 0) ? (a[Number(n_str[2])] || b[n_str[2][0]] + ' ' + a[n_str[2][1]]) + 'lakh ' : '';
        str += (n_str[3] != 0) ? (a[Number(n_str[3])] || b[n_str[3][0]] + ' ' + a[n_str[3][1]]) + 'thousand ' : '';
        str += (n_str[4] != 0) ? (a[Number(n_str[4])] || b[n_str[4][0]] + ' ' + a[n_str[4][1]]) + 'hundred ' : '';
        str += (n_str[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_str[5])] || b[n_str[5][0]] + ' ' + a[n_str[5][1]]) : '';
        return str.trim();
    }
    const integerPart = Math.floor(Math.abs(num));
    let words = inWords(integerPart);
    if (!words) words = 'zero';
    words = words.charAt(0).toUpperCase() + words.slice(1); // Capitalize first letter
    
    if (num < 0) return 'Minus ' + words + ' dong only';
    return words + ' dong only';
}