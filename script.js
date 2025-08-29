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
      dbFs.collection("employees").get(),
      dbFs.collection("entryMonthly").get(),
      dbFs.collection("payrolls").get()
    ]);

    appData.employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    appData.entryMonthly = entryMonthlySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    appData.payrolls = payrollsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log("Data loaded!", appData);
    refreshStats();
  } catch (error) {
    console.error("Error loading initial data: ", error);
    alert("Lỗi khi tải dữ liệu ban đầu. Vui lòng kiểm tra kết nối mạng và F5 lại trang.");
  }
}

/** ============= UI RENDERING & LOGIC ============= **/

function createEntryRowHtml(entry = {}) {
    const employee = appData.employees.find(e => e.id === entry.employeeId) || {};
    
    return `
        <td><input type="text" class="en-nameVi" placeholder="Tên tiếng Việt" value="${employee.nameVi || ''}"></td>
        <td><input type="text" class="en-nameEn" placeholder="Tên tiếng Anh" value="${employee.nameEn || ''}"></td>
        <td><input type="text" class="en-code" placeholder="Mã NV" value="${employee.code || ''}"></td>
        <td><input type="text" class="en-bankAcc" placeholder="Số tài khoản" value="${employee.bankAcc || ''}"></td>
        <td><input type="text" class="en-bankName" placeholder="Ngân hàng" value="${employee.bankName || ''}"></td>
        <td><input type="text" class="en-className" placeholder="Lớp" value="${employee.className || ''}"></td>
        <td><input type="number" class="en-totalSessions" step="0.5" placeholder="Buổi" value="${entry.totalSessions || 0}"></td>
        <td><input type="number" class="en-totalHours" step="0.25" placeholder="Giờ" value="${entry.totalHours || 0}"></td>
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
  $("#stat-rows").textContent = appData.entryMonthly.length;
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
    initDefaults();

    await loadInitialData();
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

  const btnLogout = $("#btn-logout");
  if (btnLogout) btnLogout.onclick = () => { setSession(null); location.reload(); };
  
  const exportBtnContainer = $("#view-dashboard .card.soft");
  if (exportBtnContainer) exportBtnContainer.remove();
  
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

        for (const row of rows) {
            const code = row.querySelector(".en-code").value.trim();
            if (!code) {
                alert("Mã số nhân viên là bắt buộc. Vui lòng kiểm tra lại các dòng.");
                row.querySelector(".en-code").focus();
                throw new Error("Mã nhân viên trống.");
            }

            // 1. Tìm hoặc tạo ID nhân viên
            let employee = appData.employees.find(e => e.code === code);
            let employeeRef;

            if (employee) {
                employeeRef = dbFs.collection("employees").doc(employee.id);
            } else {
                employeeRef = dbFs.collection("employees").doc();
                employee = { id: employeeRef.id, code: code }; // Tạo đối tượng tạm để có ID
            }
            
            // 2. Chuẩn bị dữ liệu nhân viên để lưu/cập nhật
            const employeeData = {
                code: code,
                nameVi: row.querySelector(".en-nameVi").value.trim(),
                nameEn: row.querySelector(".en-nameEn").value.trim(),
                bankAcc: row.querySelector(".en-bankAcc").value.trim(),
                bankName: row.querySelector(".en-bankName").value.trim(),
                className: row.querySelector(".en-className").value.trim(),
            };
            batch.set(employeeRef, employeeData, { merge: true });

            // 3. Chuẩn bị dữ liệu chấm công tháng
            const entryId = `${month}_${employee.id}`;
            const entryRef = dbFs.collection("entryMonthly").doc(entryId);
            const entryData = {
                id: entryId,
                month: month,
                employeeId: employee.id,
                totalSessions: parseFloat(row.querySelector(".en-totalSessions").value) || 0,
                totalHours: parseFloat(row.querySelector(".en-totalHours").value) || 0,
            };
            batch.set(entryRef, entryData, { merge: true });
        }

        await batch.commit();

        alert(`Đã lưu thành công dữ liệu cho ${rows.length} nhân viên vào tháng ${month}!`);
        await loadInitialData();

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

            const [year, month] = currentMonth.split('-').map(Number);
            
            let prevMonthDate = new Date(year, month - 2); 
            if (month === 1) {
                prevMonthDate = new Date(year - 1, 11);
            }

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
                alert(`Không tìm thấy dữ liệu cho tháng ${prevMonth}. Vui lòng nhập thủ công hoặc sao chép từ một tháng khác.`);
            }
        });
    }

  const entryTable = $("#tbl-entry");
  if(entryTable) {
    entryTable.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains('btn-en-deleterow')) {
            const row = e.target.closest('tr');
            if(row) row.remove();
        }
    });
  }
}

window.addEventListener("DOMContentLoaded", main);


/** ============= CÁC HÀM PHỤ TRỢ APP ============= **/
function initDefaults() {
  const monthInput = $("#en-month");
  if (monthInput) {
    if (!monthInput.value) {
      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      monthInput.value = `${d.getFullYear()}-${mm}`;
    }

    // NEW: mỗi khi chọn tháng → load dữ liệu nhập
    monthInput.addEventListener("change", () => {
      loadEntriesForMonth(monthInput.value);
    });

    // Gọi ngay lần đầu khi trang mở
    loadEntriesForMonth(monthInput.value);
  }
}






async function loadEntriesForMonth(month) {
  try {
    const snap = await dbFs.collection("entryMonthly")
      .where("month", "==", month).get();

    const rows = snap.docs.map(d => d.data());

    // Làm trống bảng nhập
    const tbody = $("#tbl-entry tbody");
    tbody.innerHTML = "";

    // Thêm từng dòng
    for (const entry of rows) {
      const row = tbody.insertRow();
      row.innerHTML = createEntryRowHtml(entry);
    }

    console.log(`Đã load ${rows.length} dòng cho tháng ${month}`);
  } catch (err) {
    console.error("Lỗi khi load dữ liệu tháng:", err);
    alert("Không thể tải dữ liệu tháng từ Firestore.");
  }
}
