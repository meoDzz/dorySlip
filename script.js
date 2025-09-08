//ver 2 bonus email
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
    { username: "ketoan",   password: "Suzy1710", role: "ke_toan"   },
    { username: "admin",    password: "Suzy1710", role: "admin"     }
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

// logout
// Đoạn mã mới để thay thế
const btnLogout = $("#btn-logout");
if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        console.log("Nút đăng xuất được nhấn. Xóa session...");
        setSession(null); // Xóa session khỏi localStorage
        window.currentUser = null; // Xóa biến tạm
        location.reload(); // Tải lại trang để quay về màn hình đăng nhập
    });
}
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
// async function buildPayrollForMonth() {
//     const month = $("#pr-month").value;
//     if (!month) {
//         alert("Vui lòng chọn tháng để tổng hợp.");
//         return;
//     }

//     const btn = $("#btn-pr-build");
//     btn.textContent = "Đang tổng hợp...";
//     btn.disabled = true;

//     try {
//         const entriesForMonth = appData.entryMonthly.filter(e => e.month === month);
//         const tbody = $("#tbl-pr tbody");
//         tbody.innerHTML = "";

//         if (entriesForMonth.length === 0) {
//             alert(`Không có dữ liệu chấm công cho tháng ${month}.`);
//             return;
//         }

//         const entriesByEmployee = entriesForMonth.reduce((acc, entry) => {
//             if (!acc[entry.employeeId]) {
//                 acc[entry.employeeId] = [];
//             }
//             acc[entry.employeeId].push(entry);
//             return acc;
//         }, {});

//         const employeesInMonth = appData.employees
//             .filter(emp => entriesByEmployee[emp.id])
//             .sort((a, b) => a.nameVi.localeCompare(b.nameVi));

//         for (const employee of employeesInMonth) {
//             const employeeEntries = entriesByEmployee[employee.id];
//             let totalHoursForEmployee = 0;
//             let totalGrossForEmployee = 0;
            
//             const payrollId = `${month}_${employee.id}`;
//             const existingPayroll = appData.payrolls.find(p => p.id === payrollId) || {};
            
//             // Lấy các giá trị đã lưu
//             const bonus = existingPayroll.bonus || 0;
//             const bhxh = existingPayroll.bhxh || employee.bhxh || 0;
//             const pitax = existingPayroll.pitax || 0;
//             const deductions = existingPayroll.deductions || 0;
//             const advance = existingPayroll.advance || 0;

//             // Dựng các dòng chi tiết cho từng lớp
//             employeeEntries.forEach((entry, index) => {
//                 const rate = entry.rate || existingPayroll.rate || employee.rate || 0;
//                 const hours = entry.totalHours || 0;
//                 const gross = hours * rate;
//                 totalHoursForEmployee += hours;
//                 totalGrossForEmployee += gross;

//                 const detailRow = tbody.insertRow();
//                 detailRow.className = 'payroll-detail-row';
//                 detailRow.dataset.entryId = entry.id; 
//                 detailRow.innerHTML = `
//                     <td>${index === 0 ? `${employee.nameVi} (${employee.code})` : ''}</td>
//                     <td>${entry.className || 'N/A'}</td>
//                     <td>${hours}</td>
//                     <td><input type="number" class="pr-rate-detail" value="${rate}"></td>
//                     <td class="number gross-detail">${gross.toLocaleString()}</td>
//                     <td colspan="8"></td>
//                 `;
//             });

//             // Dựng dòng tổng kết cho nhân viên
//             const net = totalGrossForEmployee + bonus - bhxh - pitax - deductions;
//             const remaining = net - advance;

//             const summaryRow = tbody.insertRow();
//             summaryRow.className = 'payroll-summary-row';
//             summaryRow.dataset.employeeId = employee.id;
//             summaryRow.dataset.month = month;
//             summaryRow.innerHTML = `
//                 <td></td>
//                 <td><strong>Tổng cộng</strong></td>
//                 <td><strong>${totalHoursForEmployee}</strong></td>
//                 <td></td>
//                 <td class="number"><strong>${totalGrossForEmployee.toLocaleString()}</strong></td>
//                 <td><input type="number" class="pr-bonus" value="${bonus}"></td>
//                 <td><input type="number" class="pr-bhxh" value="${bhxh}"></td>
//                 <td><input type="number" class="pr-pitax" value="${pitax}"></td>
//                 <td><input type="number" class="pr-deductions" value="${deductions}"></td>
//                 <td class="number"><strong>${net.toLocaleString()}</strong></td>
//                 <td><input type="number" class="pr-advance" value="${advance}"></td>
//                 <td class="number"><strong>${remaining.toLocaleString()}</strong></td>
//                 <td>
//                     <button class="btn small primary btn-pr-save">Lưu</button>
//                     <button class="btn small btn-pr-slip">Phiếu lương</button>
//                 </td>
//             `;
//         }
//     } catch (error) {
//         console.error("Lỗi khi tổng hợp lương:", error);
//         alert("Đã xảy ra lỗi trong quá trình tổng hợp lương.");
//     } finally {
//         btn.textContent = "Tổng hợp tháng";
//         btn.disabled = false;
//     }
// }

// File: script.js
// THAY THẾ TOÀN BỘ HÀM CŨ BẰNG PHIÊN BẢN MỚI NÀY

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

        const entriesByEmployee = entriesForMonth.reduce((acc, entry) => {
            if (!acc[entry.employeeId]) {
                acc[entry.employeeId] = [];
            }
            acc[entry.employeeId].push(entry);
            return acc;
        }, {});

        const employeesInMonth = appData.employees
            .filter(emp => entriesByEmployee[emp.id])
            .sort((a, b) => a.nameVi.localeCompare(b.nameVi));

        for (const employee of employeesInMonth) {
            const employeeEntries = entriesByEmployee[employee.id];
            let totalHoursForEmployee = 0;
            let totalGrossForEmployee = 0;
            
            const payrollId = `${month}_${employee.id}`;
            const existingPayroll = appData.payrolls.find(p => p.id === payrollId) || {};
            
            // Lấy các giá trị đã lưu
            const bonus = existingPayroll.bonus || 0;
            const notes = existingPayroll.notes || ''; // Lấy ghi chú đã lưu
            const bhxh = existingPayroll.bhxh || employee.bhxh || 0;
            const pitax = existingPayroll.pitax || 0;
            const deductions = existingPayroll.deductions || 0;
            const advance = existingPayroll.advance || 0;

            // Dựng các dòng chi tiết cho từng lớp
            employeeEntries.forEach((entry, index) => {
                const rate = entry.rate || existingPayroll.rate || employee.rate || 0;
                const hours = entry.totalHours || 0;
                const gross = hours * rate;
                totalHoursForEmployee += hours;
                totalGrossForEmployee += gross;

                const detailRow = tbody.insertRow();
                detailRow.className = 'payroll-detail-row';
                detailRow.dataset.entryId = entry.id; 
                detailRow.innerHTML = `
                    <td>${index === 0 ? `${employee.nameVi} (${employee.code})` : ''}</td>
                    <td>${entry.className || 'N/A'}</td>
                    <td>${hours}</td>
                    <td><input type="number" class="pr-rate-detail" value="${rate}"></td>
                    <td class="number gross-detail">${gross.toLocaleString()}</td>
                    <td colspan="9"></td> `;
            });

            // Dựng dòng tổng kết cho nhân viên
            const net = totalGrossForEmployee + bonus - bhxh - pitax - deductions;
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
                <td class="number"><strong>${totalGrossForEmployee.toLocaleString()}</strong></td>
                <td><input type="number" class="pr-bonus" value="${bonus}"></td>
                <td><input type="text" class="pr-notes" placeholder="Ghi chú thưởng/phạt..." value="${notes}"></td> <td><input type="number" class="pr-bhxh" value="${bhxh}"></td>
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
        updatePayrollGrandTotal();
    } catch (error) {
        console.error("Lỗi khi tổng hợp lương:", error);
        alert("Đã xảy ra lỗi trong quá trình tổng hợp lương.");
    } finally {
        btn.textContent = "Tổng hợp tháng";
        btn.disabled = false;
    }
}



// Hàm cập nhật tổng lương còn lại cho tất cả nhân viên
function updatePayrollGrandTotal() {
    let grandTotal = 0;
    const summaryRows = $$("#tbl-pr .payroll-summary-row");

    summaryRows.forEach(row => {
        // Cột "Còn lại" là cột thứ 13 (chỉ số 12) sau khi thêm cột "Ghi chú"
        const remainingCell = row.children[12]; 
        if (remainingCell) {
            // Xóa các ký tự không phải số (như dấu phẩy) để chuyển đổi
            const remainingValue = parseFloat(remainingCell.textContent.replace(/,/g, '')) || 0;
            grandTotal += remainingValue;
        }
    });

    // Cập nhật giá trị vào card đã tạo trong HTML
    const grandTotalEl = $("#pr-grand-total");
    if (grandTotalEl) {
        grandTotalEl.textContent = grandTotal.toLocaleString();
    }
}



// function handlePayrollActions() {
//     const tbody = $("#tbl-pr tbody");
//     if (!tbody) return;

//     tbody.addEventListener("click", async (e) => {
//         const target = e.target;
//         const row = target.closest(".payroll-summary-row");
//         if (!row) return;
        
//         const employeeId = row.dataset.employeeId;
//         const month = row.dataset.month;

//         if (target.classList.contains("btn-pr-save")) {
//             const btnSave = target;
//             if (!employeeId || !month) return alert("Lỗi: Không tìm thấy ID nhân viên hoặc tháng.");
            
//             btnSave.textContent = "Đang lưu...";
//             btnSave.disabled = true;

//             try {
//                 const batch = dbFs.batch();

//                 let currentTotalGross = 0;
//                 let detailRow = row.previousElementSibling;
//                 while (detailRow && detailRow.classList.contains('payroll-detail-row')) {
//                     const entryId = detailRow.dataset.entryId;
//                     const newRate = parseFloat(detailRow.querySelector('.pr-rate-detail').value) || 0;
//                     const hoursText = detailRow.children[2].textContent;
//                     const hours = parseFloat(hoursText) || 0;
                    
//                     const newGross = newRate * hours;
//                     currentTotalGross += newGross;
                    
//                     detailRow.querySelector('.gross-detail').textContent = newGross.toLocaleString();

//                     if (entryId) {
//                         const entryRef = dbFs.collection("entryMonthly").doc(entryId);
//                         batch.update(entryRef, { rate: newRate });

//                         const localEntry = appData.entryMonthly.find(en => en.id === entryId);
//                         if(localEntry) localEntry.rate = newRate;
//                     }
                    
//                     detailRow = detailRow.previousElementSibling;
//                 }
                
//                 // Lấy các giá trị từ dòng tổng kết, bao gồm cả Ghi chú
//                 const bonus = parseFloat(row.querySelector(".pr-bonus").value) || 0;
//                 const notes = row.querySelector(".pr-notes").value || ''; // LẤY DỮ LIỆU GHI CHÚ
//                 const bhxh = parseFloat(row.querySelector(".pr-bhxh").value) || 0;
//                 const pitax = parseFloat(row.querySelector(".pr-pitax").value) || 0;
//                 const deductions = parseFloat(row.querySelector(".pr-deductions").value) || 0;
//                 const advance = parseFloat(row.querySelector(".pr-advance").value) || 0;

//                 // Cập nhật payroll với các giá trị tổng hợp
//                 const payrollId = `${month}_${employeeId}`;
//                 const payrollRef = dbFs.collection("payrolls").doc(payrollId);
//                 const payrollData = { id: payrollId, month, employeeId, bonus, notes, bhxh, pitax, deductions, advance }; // THÊM "notes" VÀO ĐÂY
//                 batch.set(payrollRef, payrollData, { merge: true });

//                 await batch.commit();

//                 // Cập nhật appData local cho payroll
//                 const payrollIndex = appData.payrolls.findIndex(p => p.id === payrollId);
//                 if(payrollIndex > -1) appData.payrolls[payrollIndex] = { ...appData.payrolls[payrollIndex], ...payrollData }; 
//                 else appData.payrolls.push(payrollData);
                
//                 alert(`Đã cập nhật thành công.`);
                
//                 // Cập nhật UI
//                 row.children[4].innerHTML = `<strong>${currentTotalGross.toLocaleString()}</strong>`;
//                 const net = currentTotalGross + bonus - bhxh - pitax - deductions;
//                 const remaining = net - advance;

//                 // Chỉ số các cột đã thay đổi do thêm cột "Ghi chú"
//                 row.children[10].innerHTML = `<strong>${net.toLocaleString()}</strong>`;
//                 row.children[12].innerHTML = `<strong>${remaining.toLocaleString()}</strong>`;
//                 updatePayrollGrandTotal();
//             } catch (error) {
//                 console.error("Lỗi khi lưu dữ liệu payroll:", error);
//                 alert("Đã có lỗi xảy ra khi lưu.");
//             } finally {
//                 btnSave.textContent = "Lưu";
//                 btnSave.disabled = false;
//             }
//         }

//         if (target.classList.contains("btn-pr-slip")) {
//             generateAndPrintPayslip(employeeId, month);
//         }
//     });
// }


// Dán phiên bản ĐÚNG và DUY NHẤT này vào file script.js


// File: script.js
// THAY THẾ TOÀN BỘ HÀM CŨ BẰNG PHIÊN BẢN ĐÃ SỬA LỖI NÀY

function handlePayrollActions() {
    const tbody = $("#tbl-pr tbody");
    if (!tbody) return;

    tbody.addEventListener("click", async (e) => {
        const target = e.target;
        const row = target.closest(".payroll-summary-row");
        if (!row) return;
        
        const employeeId = row.dataset.employeeId;
        const month = row.dataset.month;

        if (target.classList.contains("btn-pr-save")) {
            const btnSave = target;
            if (!employeeId || !month) return alert("Lỗi: Không tìm thấy ID nhân viên hoặc tháng.");
            
            btnSave.textContent = "Đang lưu...";
            btnSave.disabled = true;

            try {
                const batch = dbFs.batch();

                let currentTotalGross = 0;
                let detailRow = row.previousElementSibling;
                while (detailRow && detailRow.classList.contains('payroll-detail-row')) {
                    const entryId = detailRow.dataset.entryId;
                    const newRate = parseFloat(detailRow.querySelector('.pr-rate-detail').value) || 0;
                    const hoursText = detailRow.children[2].textContent;
                    const hours = parseFloat(hoursText) || 0;
                    
                    const newGross = newRate * hours;
                    currentTotalGross += newGross;
                    
                    detailRow.querySelector('.gross-detail').textContent = newGross.toLocaleString();

                    if (entryId) {
                        const entryRef = dbFs.collection("entryMonthly").doc(entryId);
                        batch.update(entryRef, { rate: newRate });

                        const localEntry = appData.entryMonthly.find(en => en.id === entryId);
                        if(localEntry) localEntry.rate = newRate;
                    }
                    
                    detailRow = detailRow.previousElementSibling;
                }
                
                const bonus = parseFloat(row.querySelector(".pr-bonus").value) || 0;
                const notes = row.querySelector(".pr-notes").value || '';
                const bhxh = parseFloat(row.querySelector(".pr-bhxh").value) || 0;
                const pitax = parseFloat(row.querySelector(".pr-pitax").value) || 0;
                const deductions = parseFloat(row.querySelector(".pr-deductions").value) || 0;
                const advance = parseFloat(row.querySelector(".pr-advance").value) || 0;

                const payrollId = `${month}_${employeeId}`;
                const payrollRef = dbFs.collection("payrolls").doc(payrollId);
                const payrollData = { id: payrollId, month, employeeId, bonus, notes, bhxh, pitax, deductions, advance };
                batch.set(payrollRef, payrollData, { merge: true });

                await batch.commit();

                const payrollIndex = appData.payrolls.findIndex(p => p.id === payrollId);
                if(payrollIndex > -1) appData.payrolls[payrollIndex] = { ...appData.payrolls[payrollIndex], ...payrollData }; 
                else appData.payrolls.push(payrollData);
                
                alert(`Đã cập nhật thành công.`);
                
                row.children[4].innerHTML = `<strong>${currentTotalGross.toLocaleString()}</strong>`;
                const net = currentTotalGross + bonus - bhxh - pitax - deductions;
                const remaining = net - advance;

                row.children[10].innerHTML = `<strong>${net.toLocaleString()}</strong>`;
                row.children[12].innerHTML = `<strong>${remaining.toLocaleString()}</strong>`;
                
                // =======================================================
                // SỬA LỖI GÕ NHẦM Ở ĐÂY (pdate... -> update...)
                updatePayrollGrandTotal(); 
                // =======================================================

            } catch (error) {
                console.error("Lỗi khi lưu dữ liệu payroll:", error);
                alert("Đã có lỗi xảy ra khi lưu.");
            } finally {
                btnSave.textContent = "Lưu";
                btnSave.disabled = false;
            }
        }

        if (target.classList.contains("btn-pr-slip")) {
            generateAndPrintPayslip(employeeId, month);
        }
    });
}

function createPayslipHtml(employee, payrollEntries, payroll, month) {
    const [year, monthNum] = month.split('-');
    
    // Khai báo đầy đủ các biến từ payroll object
    const bonus = payroll.bonus || 0;
    const notes = payroll.notes || ''; // Dòng này đảm bảo biến 'notes' luôn tồn tại
    const bhxh = payroll.bhxh || 0;
    const pitax = payroll.pitax || 0;
    const deductions = payroll.deductions || 0;
    const advance = payroll.advance || 0;

    let totalGross = 0;
    const detailRowsHtml = payrollEntries.map((entry, index) => {
        const entryRate = entry.rate || payroll.rate || employee.rate || 0;
        const subtotal = (entry.totalHours || 0) * entryRate;
        totalGross += subtotal;
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.className}</td>
                <td class="number">${entry.totalSessions || 0}</td>
                <td class="number">${entry.totalHours || 0}</td>
                <td class="number">${entryRate.toLocaleString()}</td>
                <td class="number">${subtotal.toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    // Tính toán lương chính xác
    const totalDeductions = bhxh + pitax + deductions;
    const netSalary = totalGross + bonus - totalDeductions;
    const finalTakeHome = netSalary - advance;
    
    const amountInWordsVI = numberToVietnameseWords(finalTakeHome);
    const amountInWordsEN = numberToEnglishWords(finalTakeHome);

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
                <span class="label">(+) Thưởng / Bonus:</span>
                <span class="value">${bonus.toLocaleString()}</span>
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
        
        ${notes ? `
        <div class="section-title">GHI CHÚ / NOTES</div>
        <div class="payslip-notes">
            ${notes.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        <div class="amount-in-words">
            <strong>Bằng chữ / In words:</strong><br>
            <em>(Tiếng Việt) ${amountInWordsVI}</em><br>
            <em>(English) ${amountInWordsEN}</em>
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
        alert("Không tìm thấy email của nhân viên.");
        return;
    }
    const payroll = appData.payrolls.find(p => p.id === `${month}_${employeeId}`);
    if (!payroll) {
        alert("Không tìm thấy dữ liệu lương của nhân viên.");
        return;
    }
    const payrollEntries = appData.entryMonthly.filter(e => e.employeeId === employeeId && e.month === month);

    // Tìm nút gửi email để cập nhật trạng thái
    const btnSendEmail = document.querySelector("#pr-actions-container button:last-child");
    if (btnSendEmail) {
        btnSendEmail.textContent = "Đang gửi...";
        btnSendEmail.disabled = true;
    }

    try {
        // Tạo nội dung HTML cho email
        const emailHtmlContent = createPayslipHtmlForEmail(employee, payrollEntries, payroll, month);

        const templateParams = {
            to_name: employee.nameVi,
            to_email: employee.email,
            from_name: 'Phòng Kế Toán Dory', // Thay bằng tên công ty của bạn
            subject: `[Dory Data] Bảng Lương Chi Tiết Tháng ${month}`,
            // Đây là tham số chứa toàn bộ HTML của phiếu lương
            message_html: emailHtmlContent
        };

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        alert(`Phiếu lương đã được gửi thành công đến ${employee.email}`);

    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        alert(`Đã xảy ra lỗi: ${error.text || error.message || error}`);
    } finally {
        if (btnSendEmail) {
            btnSendEmail.textContent = "Gửi Email Phiếu Lương";
            btnSendEmail.disabled = false;
        }
    }
}

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

// function createPayslipHtmlForEmail(employee, payrollEntries, payroll, month) {
//     const [year, monthNum] = month.split('-');
    
//     const bonus = payroll.bonus || 0;
//     const bhxh = payroll.bhxh || 0;
//     const pitax = payroll.pitax || 0;
//     const deductions = payroll.deductions || 0;
//     const advance = payroll.advance || 0;
//     let totalGross = 0;

//     const detailRowsHtml = payrollEntries.map((entry, index) => {
//         const entryRate = entry.rate || payroll.rate || employee.rate || 0;
//         const subtotal = (entry.totalHours || 0) * entryRate;
//         totalGross += subtotal;
//         return `
//             <tr>
//                 <td style="border: 1px solid #e0e0e0; padding: 12px 15px;">${index + 1}</td>
//                 <td style="border: 1px solid #e0e0e0; padding: 12px 15px;">${entry.className}</td>
//                 <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;">${entry.totalHours || 0}</td>
//                 <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;">${entryRate.toLocaleString()}</td>
//                 <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;">${subtotal.toLocaleString()}</td>
//             </tr>
//         `;
//     }).join('');

//     const totalDeductions = bhxh + pitax + deductions;
//     const netSalary = totalGross + bonus - totalDeductions;
//     const finalTakeHome = netSalary - advance;
//     const amountInWordsVI = numberToVietnameseWords(finalTakeHome);
//     const amountInWordsEN = numberToEnglishWords(finalTakeHome);

//     return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <meta charset="UTF-8">
//         <style>
//             body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
//             .container { max-width: 850px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; }
//             .content { padding: 30px 40px; color: #333; line-height: 1.6; }
//         </style>
//     </head>
//     <body>
//         <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;">
//             <tr>
//                 <td align="center">
//                     <table class="container" width="850" border="0" cellpadding="0" cellspacing="0" style="max-width: 850px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
//                         <tr>
//                             <td class="content" style="padding: 30px 40px; color: #333; line-height: 1.6;">
                                
//                                 <table width="100%" border="0" cellpadding="0" cellspacing="0" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
//                                     <tr>
//                                         <td>
//                                             <h1 style="color: #007bff; margin: 0; font-size: 28px; font-weight: 600;">PHIẾU LƯƠNG / PAYSLIP</h1>
//                                             <p style="margin: 5px 0 0; font-size: 16px; color: #555;">Tháng / Month ${monthNum}/${year}</p>
//                                         </td>
//                                     </tr>
//                                 </table>

//                                 <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">THÔNG TIN NHÂN VIÊN / EMPLOYEE INFORMATION</p>
//                                 <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
//                                     <tr>
//                                         <td width="50%" valign="top">
//                                             <p style="margin: 0;"><strong>Họ và tên / Full Name:</strong> ${employee.nameVi || ''}</p>
//                                             <p style="margin: 5px 0 0;"><strong>Số tài khoản / Bank Account:</strong> ${employee.bankAcc || ''}</p>
//                                         </td>
//                                         <td width="50%" valign="top">
//                                             <p style="margin: 0;"><strong>Mã nhân viên / Employee ID:</strong> ${employee.code || ''}</p>
//                                             <p style="margin: 5px 0 0;"><strong>Ngân hàng / Bank Name:</strong> ${employee.bankName || ''}</p>
//                                         </td>
//                                     </tr>
//                                 </table>

//                                 <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">CHI TIẾT THU NHẬP / EARNINGS DETAILS</p>
//                                 <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
//                                     <thead style="background-color: #f2f7fc; font-weight: 600; color: #333;">
//                                         <tr>
//                                             <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: left;">STT</th>
//                                             <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: left;">Lớp/Nội dung</th>
//                                             <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: right;">Số giờ</th>
//                                             <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: right;">Đơn giá/giờ</th>
//                                             <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: right;">Thành tiền (VND)</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>${detailRowsHtml}</tbody>
//                                     <tfoot style="font-weight: 600; background-color: #eaf3ff; border-top: 2px solid #007bff;">
//                                         <tr>
//                                             <td colspan="4" style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;"><strong>Tổng thu nhập / Gross Earnings:</strong></td>
//                                             <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;"><strong>${totalGross.toLocaleString()}</strong></td>
//                                         </tr>
//                                     </tfoot>
//                                 </table>

//                                 <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">TÓM TẮT LƯƠNG / SALARY SUMMARY</p>
//                                 <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding: 15px 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; margin-bottom: 25px;">
//                                      <tr>
//                                         <td style="padding: 5px 0; font-weight: 500; color: #555;">Tổng thu nhập / Gross Salary:</td>
//                                         <td style="padding: 5px 0; text-align: right;">${totalGross.toLocaleString()}</td>
//                                     </tr>
//                                      <tr>
//                                         <td style="padding: 5px 0; font-weight: 500; color: #555;">(+) Thưởng / Bonus:</td>
//                                         <td style="padding: 5px 0; text-align: right;">${bonus.toLocaleString()}</td>
//                                     </tr>
//                                     <tr>
//                                         <td style="padding: 5px 0; font-weight: 500; color: #555;">(-) BHXH / Social Insurance:</td>
//                                         <td style="padding: 5px 0; text-align: right;">${bhxh.toLocaleString()}</td>
//                                     </tr>
//                                      <tr>
//                                         <td style="padding: 5px 0; font-weight: 500; color: #555;">(-) Thuế TNCN / Personal Income Tax:</td>
//                                         <td style="padding: 5px 0; text-align: right;">${pitax.toLocaleString()}</td>
//                                     </tr>
//                                     <tr>
//                                         <td style="padding: 5px 0; font-weight: 500; color: #555;">(-) Các khoản trừ khác / Other Deductions:</td>
//                                         <td style="padding: 5px 0; text-align: right;">${deductions.toLocaleString()}</td>
//                                     </tr>
//                                     <tr>
//                                         <td style="padding: 10px 0; font-weight: 700; color: #000; font-size: 16px; border-top: 1px solid #ccc;">Lương thực nhận / Net Salary:</td>
//                                         <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #000; font-size: 16px; border-top: 1px solid #ccc;">${netSalary.toLocaleString()}</td>
//                                     </tr>
//                                      <tr>
//                                         <td style="padding: 5px 0; font-weight: 500; color: #555;">(-) Tạm ứng / Advance:</td>
//                                         <td style="padding: 5px 0; text-align: right;">${advance.toLocaleString()}</td>
//                                     </tr>
//                                      <tr>
//                                         <td style="padding: 15px 0; font-weight: 700; color: #dc3545; font-size: 18px; border-top: 2px solid #ccc;">CÒN LẠI (Thực lãnh) / FINAL TAKE-HOME:</td>
//                                         <td style="padding: 15px 0; text-align: right; font-weight: 700; color: #dc3545; font-size: 18px; border-top: 2px solid #ccc;">${finalTakeHome.toLocaleString()}</td>
//                                     </tr>
//                                 </table>
//                                 ${notes ? `
//                                 <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">GHI CHÚ / NOTES</p>
//                                 <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
//                                     <tr>
//                                         <td style="padding: 15px; background-color: #fffbe6; border: 1px dashed #ffe58f; border-radius: 4px; color: #594300; white-space: pre-wrap;">
//                                             ${notes.replace(/\n/g, '<br>')}
//                                         </td>
//                                     </tr>
//                                 </table>
//                                 ` : ''}
//                                 <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
//                                     <tr>
//                                         <td style="padding: 15px; background-color: #f2f7fc; border-left: 5px solid #007bff; font-style: italic; color: #444; border-radius: 4px;">
//                                             <strong style="color: #007bff; font-weight: 600;">Bằng chữ / In words:</strong><br>
//                                             <em>(Tiếng Việt) ${amountInWordsVI}</em><br>
//                                             <em>(English) ${amountInWordsEN}</em>
//                                         </td>
//                                     </tr>
//                                 </table>

//                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 50px; text-align: center;">
//                                     <tr>
//                                         <td width="33.33%" style="border-top: 1px dotted #aaa; padding-top: 10px;">
//                                             <strong style="display: block; margin-bottom: 5px; color: #333;">Người lập phiếu</strong>
//                                             <p style="margin-top: 60px; font-size: 12px; color: #777;">(Ký, họ tên)</p>
//                                         </td>
//                                          <td width="33.33%" style="border-top: 1px dotted #aaa; padding-top: 10px;">
//                                             <strong style="display: block; margin-bottom: 5px; color: #333;">Kế toán trưởng</strong>
//                                              <p style="margin-top: 60px; font-size: 12px; color: #777;">(Ký, họ tên)</p>
//                                         </td>
//                                          <td width="33.33%" style="border-top: 1px dotted #aaa; padding-top: 10px;">
//                                             <strong style="display: block; margin-bottom: 5px; color: #333;">Người nhận lương</strong>
//                                              <p style="margin-top: 60px; font-size: 12px; color: #777;">(Ký, họ tên)</p>
//                                         </td>
//                                     </tr>
//                                 </table>
//                             </td>
//                         </tr>
//                     </table>
//                 </td>
//             </tr>
//         </table>
//     </body>
//     </html>
//     `;
// }


function createPayslipHtmlForEmail(employee, payrollEntries, payroll, month) {
    const [year, monthNum] = month.split('-');
    
    const bonus = payroll.bonus || 0;
    const notes = payroll.notes || '';
    const bhxh = payroll.bhxh || 0;
    const pitax = payroll.pitax || 0;
    const deductions = payroll.deductions || 0;
    const advance = payroll.advance || 0;
    let totalGross = 0;

    const detailRowsHtml = payrollEntries.map((entry, index) => {
        const entryRate = entry.rate || payroll.rate || employee.rate || 0;
        const subtotal = (entry.totalHours || 0) * entryRate;
        totalGross += subtotal;
        return `
            <tr>
                <td style="border: 1px solid #e0e0e0; padding: 12px 15px;">${index + 1}</td>
                <td style="border: 1px solid #e0e0e0; padding: 12px 15px;">${entry.className}</td>
                <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;">${entry.totalHours || 0}</td>
                <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;">${entryRate.toLocaleString()}</td>
                <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;">${subtotal.toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    const totalDeductions = bhxh + pitax + deductions;
    const netSalary = totalGross + bonus - totalDeductions;
    const finalTakeHome = netSalary - advance;
    const amountInWordsVI = numberToVietnameseWords(finalTakeHome);
    const amountInWordsEN = numberToEnglishWords(finalTakeHome);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        </style>
    </head>
    <body>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;">
            <tr>
                <td align="center">
                    <table width="850" border="0" cellpadding="0" cellspacing="0" style="max-width: 850px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
                        <tr>
                            <td style="padding: 30px 40px; color: #333; line-height: 1.6;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
                                    <tr><td><h1 style="color: #007bff; margin: 0; font-size: 28px; font-weight: 600;">PHIẾU LƯƠNG / PAYSLIP</h1><p style="margin: 5px 0 0; font-size: 16px; color: #555;">Tháng / Month ${monthNum}/${year}</p></td></tr>
                                </table>
                                <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">THÔNG TIN NHÂN VIÊN</p>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                    <tr>
                                        <td width="50%" valign="top"><p style="margin: 0;"><strong>Họ và tên:</strong> ${employee.nameVi || ''}</p><p style="margin: 5px 0 0;"><strong>Số tài khoản:</strong> ${employee.bankAcc || ''}</p></td>
                                        <td width="50%" valign="top"><p style="margin: 0;"><strong>Mã nhân viên:</strong> ${employee.code || ''}</p><p style="margin: 5px 0 0;"><strong>Ngân hàng:</strong> ${employee.bankName || ''}</p></td>
                                    </tr>
                                </table>
                                <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">CHI TIẾT THU NHẬP</p>
                                <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                                    <thead style="background-color: #f2f7fc; font-weight: 600; color: #333;">
                                        <tr>
                                            <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: left;">STT</th>
                                            <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: left;">Lớp/Nội dung</th>
                                            <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: right;">Số giờ</th>
                                            <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: right;">Đơn giá/giờ</th>
                                            <th style="border: 1px solid #d0e0ed; padding: 12px 15px; text-align: right;">Thành tiền (VND)</th>
                                        </tr>
                                    </thead>
                                    <tbody>${detailRowsHtml}</tbody>
                                    <tfoot style="font-weight: 600; background-color: #eaf3ff; border-top: 2px solid #007bff;">
                                        <tr>
                                            <td colspan="4" style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;"><strong>Tổng thu nhập:</strong></td>
                                            <td style="border: 1px solid #e0e0e0; padding: 12px 15px; text-align: right;"><strong>${totalGross.toLocaleString()}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                                <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">TÓM TẮT LƯƠNG</p>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding: 15px 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; margin-bottom: 25px;">
                                     <tr><td style="padding: 5px 0;">Tổng thu nhập:</td><td style="padding: 5px 0; text-align: right;">${totalGross.toLocaleString()}</td></tr>
                                     <tr><td style="padding: 5px 0;">(+) Thưởng:</td><td style="padding: 5px 0; text-align: right;">${bonus.toLocaleString()}</td></tr>
                                     <tr><td style="padding: 5px 0;">(-) BHXH:</td><td style="padding: 5px 0; text-align: right;">${bhxh.toLocaleString()}</td></tr>
                                     <tr><td style="padding: 5px 0;">(-) Thuế TNCN:</td><td style="padding: 5px 0; text-align: right;">${pitax.toLocaleString()}</td></tr>
                                     <tr><td style="padding: 5px 0;">(-) Các khoản trừ khác:</td><td style="padding: 5px 0; text-align: right;">${deductions.toLocaleString()}</td></tr>
                                     <tr><td style="padding: 10px 0; font-weight: 700; font-size: 16px; border-top: 1px solid #ccc;">Lương thực nhận:</td><td style="padding: 10px 0; text-align: right; font-weight: 700; font-size: 16px; border-top: 1px solid #ccc;">${netSalary.toLocaleString()}</td></tr>
                                     <tr><td style="padding: 5px 0;">(-) Tạm ứng:</td><td style="padding: 5px 0; text-align: right;">${advance.toLocaleString()}</td></tr>
                                     <tr><td style="padding: 15px 0; font-weight: 700; color: #dc3545; font-size: 18px; border-top: 2px solid #ccc;">CÒN LẠI (Thực lãnh):</td><td style="padding: 15px 0; text-align: right; font-weight: 700; color: #dc3545; font-size: 18px; border-top: 2px solid #ccc;">${finalTakeHome.toLocaleString()}</td></tr>
                                </table>
                                ${notes ? `
                                <p style="font-size: 18px; font-weight: 600; color: #007bff; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px dashed #cccccc; padding-bottom: 5px;">GHI CHÚ</p>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;"><tr><td style="padding: 15px; background-color: #fffbe6; border: 1px dashed #ffe58f; border-radius: 4px; color: #594300; white-space: pre-wrap;">${notes.replace(/\n/g, '<br>')}</td></tr></table>
                                ` : ''}
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
                                    <tr><td style="padding: 15px; background-color: #f2f7fc; border-left: 5px solid #007bff; font-style: italic; color: #444; border-radius: 4px;">
                                        <strong>Bằng chữ:</strong><br><em>(Tiếng Việt) ${amountInWordsVI}</em><br><em>(English) ${amountInWordsEN}</em>
                                    </td></tr>
                                </table>
                                
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}






