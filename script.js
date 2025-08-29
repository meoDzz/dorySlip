/** ================== CONFIGURATION ================== **/
// Điền thông tin của bạn vào đây
const GITHUB_CONFIG = {
  owner: 'TEN_TAI_KHOAN_GITHUB_CUA_BAN', // Thay bằng username GitHub của bạn
  repo: 'TEN_REPOSITORY_CUA_BAN',       // Thay bằng tên repository bạn vừa tạo
  path: 'data.json',                    // Tên file dữ liệu
  token: 'GITHUB_PERSONAL_ACCESS_TOKEN_CUA_BAN' // Dán Personal Access Token bạn vừa tạo vào đây
};
/** =================================================== **/


let db = {}; // Dữ liệu sẽ được tải từ GitHub
let lastKnownSha; // Dùng để update file trên GitHub

/** GitHub API Functions **/
async function loadDataFromGithub() {
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3.raw' }
    });
    if (!response.ok) {
        if (response.status === 404) { // File không tồn tại, tạo dữ liệu mặc định
            console.warn("data.json not found on GitHub. Initializing with default data.");
            return getDefaultData();
        }
        throw new Error(`GitHub API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to load data from GitHub:", error);
    alert("Không thể tải dữ liệu từ GitHub. Vui lòng kiểm tra lại cấu hình và kết nối mạng.");
    return getDefaultData(); // Trả về dữ liệu mặc định nếu lỗi
  }
}

async function saveDataToGithub() {
    // Lấy SHA mới nhất của file trước khi ghi
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`);
        if(response.ok) {
            const fileInfo = await response.json();
            lastKnownSha = fileInfo.sha;
        } else if(response.status !== 404) { // Bỏ qua lỗi 404 vì file có thể chưa tồn tại
             throw new Error(`Failed to get file SHA: ${response.statusText}`);
        }
    } catch (error) {
        console.error(error);
        // Không dừng lại nếu chỉ không lấy được SHA, thử ghi mà không có nó
    }

    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2)))); // Encode to base64

    const body = {
        message: `Data update: ${new Date().toISOString()}`,
        content: content,
        sha: lastKnownSha // Cung cấp SHA nếu có để tránh conflict
    };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.statusText}`);
        }

        const result = await response.json();
        lastKnownSha = result.content.sha; // Cập nhật SHA sau khi ghi thành công
        console.log("Data saved to GitHub successfully.");
    } catch (error) {
        console.error("Failed to save data to GitHub:", error);
        alert("Lưu dữ liệu lên GitHub thất bại!");
    }
}

function getDefaultData() {
    return {
      users:[
        {username:"nhaplieu",password:"123456",role:"nhap_lieu"},
        {username:"ketoan",password:"123456",role:"ke_toan"},
        {username:"admin",password:"123456",role:"admin"}
      ],
      employees:[],
      entryMonthly:[],
      payrolls:[]
    };
}

// Thay thế hàm save cũ
const save = saveDataToGithub;

// ----- Các hàm còn lại của ứng dụng (giữ nguyên không thay đổi nhiều) -----
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const uid=()=>Math.random().toString(36).slice(2,10);
const fmt=n=>(n||0).toLocaleString('vi-VN');

/** Views **/
function show(id){ $$(".view").forEach(v=>v.classList.remove("active")); $(id).classList.add("active"); }
function activateTabs(targetId){
  $$(".tab").forEach(t=>{
    if(t.dataset.target===targetId){ t.classList.add("active"); }
    else{ t.classList.remove("active"); }
  });
}
function refreshStats(){
  $("#stat-emps").textContent = db.employees.length;
  $("#stat-rows").textContent = db.entryMonthly.length;
}

/** Session helpers (sử dụng localStorage cho session là ổn) **/
function setSession(user){
  if(user){ localStorage.setItem("currentUser", JSON.stringify(user)); }
  else{ localStorage.removeItem("currentUser"); }
}
function getSession(){ try{ return JSON.parse(localStorage.getItem("currentUser")||"null"); }catch(e){return null;} }

/** Login **/
$("#btn-login").addEventListener("click", ()=>{
  const u=$("#login-username").value.trim(), p=$("#login-password").value;
  const user=db.users.find(x=>x.username===u && x.password===p);
  if(!user){ alert("Sai tài khoản hoặc mật khẩu"); return; }
  window.currentUser=user; setSession(user);
  $("#userBox").textContent = `${user.username} (${user.role})`; $("#btn-logout").style.display="inline-flex";
  $$(".role-nhap_lieu").forEach(el=> el.style.display = (["nhap_lieu","admin"].includes(user.role)?"":"none"));
  $$(".role-ke_toan").forEach(el=> el.style.display = (["ke_toan","admin"].includes(user.role)?"":"none"));
  $$(".role-admin").forEach(el=> el.style.display = (user.role==="admin"?"":"none"));
  show("#view-dashboard"); activateTabs("#view-dashboard"); initDefaults(); refreshStats();
});
$("#btn-logout").onclick=()=>{ setSession(null); location.reload(); };

/** Global tab navigation **/
document.addEventListener("click", (e)=>{
  const btn = e.target.closest(".tab");
  if(!btn || !btn.dataset.target) return;
  const target = btn.dataset.target;
  if(getComputedStyle(btn).display==="none") return;
  if(!window.currentUser){ alert("Vui lòng đăng nhập"); return; }
  show(target); activateTabs(target);
});

/** Export/Import/Reset **/
$("#btn-export").onclick=()=>{
  const blob = new Blob([JSON.stringify(db, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "timesheet_data.json"; a.click();
  URL.revokeObjectURL(a.href);
};
$("#import-file").addEventListener("change", async e=>{
  const f=e.target.files[0]; if(!f) return;
  try{
    const json = JSON.parse(await f.text());
    db=json; await save(); alert("Đã nhập và lưu dữ liệu lên GitHub."); refreshStats(); renderEntryTable(); renderPayroll();
  }catch(err){ alert("File JSON không hợp lệ"); }
});
$("#btn-reset").onclick=async ()=>{ if(confirm("Xóa toàn bộ dữ liệu trên GitHub?")){ db = getDefaultData(); await save(); setSession(null); location.reload(); } };


// ====== Auto-save monthly JSON (Entry) ======
function buildMonthJson(month){
  const rows = db.entryMonthly.filter(r=>r.month===month);
  const entries = rows.map(r=>{
    const emp = db.employees.find(e=>e.id===r.employeeId) || {};
    return {
      month,
      employeeId: r.employeeId,
      nameVi: emp.nameVi||"",
      nameEn: emp.nameEn||"",
      code: emp.code||"",
      bankAcc: emp.bankAcc||"",
      bankName: emp.bankName||"",
      className: emp.className||"",
      hourlyRate: Number(emp.hourlyRate||0),
      totalSessions: Number(r.totalSessions||0),
      totalHours: Number(r.totalHours||0)
    };
  });
  const payload = { month, generatedAt: new Date().toISOString(), entries };
  const prs = db.payrolls.filter(p=>p.month===month);
  if(prs.length) payload.payrolls = prs; // có thì kèm payroll
  return payload;
}
async function autoSaveMonthFile(month){
  const json = JSON.stringify(buildMonthJson(month), null, 2);
  const suggestedName = `chamcong_${month}.json`;
  try{
    if('showSaveFilePicker' in window){
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{description:"JSON", accept:{'application/json':['.json']}}]
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return true;
    }
  }catch(e){
    console.warn("FS Access save failed; fallback to download", e);
  }
  const blob = new Blob([json], {type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=suggestedName;
  a.click();
  URL.revokeObjectURL(a.href);
  return true;
};

/** ---------------- Nhập liệu (bảng tháng) ---------------- **/
const entryCols = [
  "nameVi","nameEn","code","bankAcc","bankName","className","totalSessions","totalHours"
];

function renderEntryTable(){
  const month = $("#en-month").value;
  const tbody = $("#tbl-entry tbody");
  tbody.innerHTML = "";
  if(!month) return;
  const rows = db.entryMonthly.filter(r=>r.month===month);
  rows.forEach(r=>{
    const emp = db.employees.find(e=>e.id===r.employeeId) || {};
    const tr=document.createElement("tr");
    tr.innerHTML = `
      <td><input value="${emp.nameVi||""}" data-emp="${emp.id||""}" data-field="nameVi"></td>
      <td><input value="${emp.nameEn||""}" data-emp="${emp.id||""}" data-field="nameEn"></td>
      <td><input value="${emp.code||""}" data-emp="${emp.id||""}" data-field="code"></td>
      <td><input value="${emp.bankAcc||""}" data-emp="${emp.id||""}" data-field="bankAcc"></td>
      <td><input value="${emp.bankName||""}" data-emp="${emp.id||""}" data-field="bankName"></td>
      <td><input value="${emp.className||""}" data-emp="${emp.id||""}" data-field="className"></td>
      <td><input type="number" step="0.5" value="${r.totalSessions||0}" data-row="${r.id}" data-field="totalSessions"></td>
      <td><input type="number" step="0.25" value="${r.totalHours||0}" data-row="${r.id}" data-field="totalHours"></td>
      <td><button class="btn danger" data-del="${r.id}">Xóa</button></td>
    `;
    tbody.appendChild(tr);
  });
  // wiring
  $$("#tbl-entry [data-emp]").forEach(inp=>{
    inp.oninput=()=>{
      const empId = inp.getAttribute("data-emp");
      const field = inp.getAttribute("data-field");
      let emp = db.employees.find(e=>e.id===empId);
      if(!emp){
        emp = {id: uid()}; db.employees.push(emp);
        inp.closest("tr").querySelectorAll("[data-emp]").forEach(el=>el.setAttribute("data-emp", emp.id));
        const month = $("#en-month").value;
        let row = db.entryMonthly.find(r=>r.employeeId===emp.id && r.month===month);
        if(!row){ db.entryMonthly.push({id:uid(), employeeId:emp.id, month, totalSessions:0, totalHours:0}); }
      }
      emp[field]=inp.value;
      save();
    };
  });
  $$("#tbl-entry [data-row]").forEach(inp=>{
    inp.oninput=()=>{
      const rowId = inp.getAttribute("data-row");
      const field = inp.getAttribute("data-field");
      const row = db.entryMonthly.find(r=>r.id===rowId); if(!row) return;
      row[field] = Number(inp.value||0);
      save();
    };
  });
  $$("#tbl-entry [data-del]").forEach(btn=>{
    btn.onclick=()=>{
      const id = btn.getAttribute("data-del");
      const row = db.entryMonthly.find(r=>r.id===id);
      if(!row) return;
      if(confirm("Xóa dòng này?")){
        db.entryMonthly = db.entryMonthly.filter(r=>r.id!==id);
        save(); renderEntryTable(); refreshStats();
      }
    };
  });
};

$("#btn-en-newrow").onclick=()=>{
  if(!["nhap_lieu","admin"].includes(window.currentUser?.role||"")){
    alert("Bạn không có quyền vào trang Nhập liệu.");
    return;
  }
  const month=$("#en-month").value; if(!month){ alert("Chọn tháng"); return; }
  const emp={id:uid(), nameVi:"", nameEn:"", code:"", bankAcc:"", bankName:"", className:""};
  db.employees.push(emp);
  db.entryMonthly.push({id:uid(), employeeId:emp.id, month, totalSessions:0, totalHours:0});
  save(); renderEntryTable(); refreshStats();
};
$("#btn-en-save").onclick=async ()=>{
  if(!["nhap_lieu","admin"].includes(window.currentUser?.role||"")){
    alert("Bạn không có quyền lưu."); return;
  }
  const month=$("#en-month").value; if(!month){ alert("Chọn tháng"); return; }
  await save();
  await autoSaveMonthFile(month); // Chức năng này vẫn là tải file về máy người dùng
  alert("Đã lưu dữ liệu lên GitHub & xuất JSON tháng.");
};


$("#en-month").addEventListener("change", ()=>{
  localStorage.setItem("lastMonth_en", $("#en-month").value||"");
  renderEntryTable();
});

// Copy previous month employees
$("#btn-en-copy").onclick=()=>{
  if(!["nhap_lieu","admin"].includes(window.currentUser?.role||"")){ alert("Bạn không có quyền."); return; }
  const month = $("#en-month").value; if(!month){ alert("Chọn tháng hiện tại"); return; }
  const d=new Date(month+"-01"); d.setMonth(d.getMonth()-1);
  const prev = d.toISOString().slice(0,7);
  const prevRows = db.entryMonthly.filter(r=>r.month===prev);
  if(prevRows.length===0){ alert("Không có dữ liệu tháng trước để sao chép."); return; }
  if(!confirm(`Sao chép danh sách nhân sự từ ${prev} sang ${month}? (không sao chép số liệu)`)) return;
  const existIds = new Set(db.entryMonthly.filter(r=>r.month===month).map(r=>r.employeeId));
  prevRows.forEach(pr=>{
    if(!existIds.has(pr.employeeId)){
      db.entryMonthly.push({id:uid(), employeeId:pr.employeeId, month, totalSessions:0, totalHours:0});
    }
  });
  save(); renderEntryTable(); refreshStats();
};

/** ---------------- Kế toán ---------------- **/
function buildPayroll(month){
  db.employees.forEach(emp=>{
    const row = db.entryMonthly.find(r=>r.employeeId===emp.id && r.month===month);
    if(!row) return;
    let pr = db.payrolls.find(p=>p.employeeId===emp.id && p.month===month);
    const totalHours = Number(row.totalHours||0);
    const hourlyRate = Number(emp.hourlyRate||0);
    const gross = totalHours * hourlyRate;
    if(!pr){
      const insurance = Math.round(gross*0.105);
      const net = gross - insurance;
      pr = {id:uid(), employeeId:emp.id, month, totalSessions:row.totalSessions||0, totalHours, hourlyRate,
            gross, insurance, net, advance:0, balance:net, locked:false};
      db.payrolls.push(pr);
    }else if(!pr.locked){
      pr.totalSessions = row.totalSessions||0;
      pr.totalHours = totalHours;
      pr.hourlyRate = hourlyRate;
      pr.gross = gross;
      pr.net = (pr.gross||0) - (pr.insurance||0);
      pr.balance = (pr.net||0) - (pr.advance||0);
    }
  });
  save();
}

function renderPayroll(){
  const month=$("#pr-month").value; if(!month) return;
  const tbody=$("#tbl-pr tbody"); tbody.innerHTML="";
  const rows=db.payrolls.filter(p=>p.month===month);
  rows.forEach(p=>{
    const emp=db.employees.find(e=>e.id===p.employeeId)||{};
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${emp.nameVi||""}</td>
      <td>${p.totalHours||0}</td>
      <td><input data-id="${p.id}" data-field="hourlyRate" type="number" value="${p.hourlyRate||0}" ${p.locked?"disabled":""}></td>
      <td>${fmt(p.gross||0)}</td>
      <td><input data-id="${p.id}" data-field="insurance" type="number" value="${p.insurance||0}" ${p.locked?"disabled":""}></td>
      <td>${fmt(p.net||0)}</td>
      <td><input data-id="${p.id}" data-field="advance" type="number" value="${p.advance||0}" ${p.locked?"disabled":""}></td>
      <td>${fmt(p.balance||0)}</td>
      <td style="display:flex; gap: 4px;">
        <button class="btn small" data-slip="${p.id}">Slip</button>
        <button class="btn small" data-phieuchi="${p.id}">Phiếu chi</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  $$("#tbl-pr input").forEach(inp=>{
    inp.oninput=()=>{
      const id=inp.dataset.id, field=inp.dataset.field;
      const pr=db.payrolls.find(x=>x.id===id); if(!pr||pr.locked) return;
      pr[field]=Number(inp.value||0);
      if(field==="hourlyRate"){
        const emp=db.employees.find(e=>e.id===pr.employeeId); if(emp){ emp.hourlyRate=pr.hourlyRate; }
        pr.gross=(pr.totalHours||0)*(pr.hourlyRate||0);
      }
      pr.net=(pr.gross||0)-(pr.insurance||0);
      pr.balance=(pr.net||0)-(pr.advance||0);
      save(); renderPayroll();
    };
  });
  $$("#tbl-pr [data-slip]").forEach(btn=> btn.onclick=()=> openSlip(btn.dataset.slip));
  $$("#tbl-pr [data-phieuchi]").forEach(btn=> btn.onclick=()=> openPhieuChi(btn.dataset.phieuchi));
}
$("#btn-pr-build").onclick=()=>{
  if(!["ke_toan","admin"].includes(window.currentUser?.role||"")){ alert("Bạn không có quyền."); return; }
  const month=$("#pr-month").value; if(!month){ alert("Chọn tháng"); return; }
  buildPayroll(month); renderPayroll(); refreshStats(); alert("Đã tổng hợp tháng.");
};
$("#btn-pr-lock").onclick=()=>{
  if(!["ke_toan","admin"].includes(window.currentUser?.role||"")){ alert("Bạn không có quyền."); return; }
  const month=$("#pr-month").value; if(!month){ alert("Chọn tháng"); return; }
  db.payrolls.filter(p=>p.month===month).forEach(p=> p.locked=true);
  save(); renderPayroll(); alert("Đã khóa tháng.");
};
$("#pr-month").addEventListener("change", ()=>{
  localStorage.setItem("lastMonth_pr", $("#pr-month").value||"");
  renderPayroll();
});

$("#btn-pr-export").onclick=()=>{
  const month=$("#pr-month").value; if(!month){ alert("Chọn tháng"); return; }
  const rows=db.payrolls.filter(p=>p.month===month);
  if(rows.length===0){ alert("Chưa có dữ liệu payroll cho tháng này."); return; }
  const header=["Thang","Ten NV","Ten EN","Ma NV","So TK","Ngan hang","Lop","Gio","Rate","Gross","BHXH","Net","Ung","Con lai"];
  const lines=[header.join(",")];
  rows.forEach(p=>{
    const emp=db.employees.find(e=>e.id===p.employeeId)||{};
    const vals=[
      p.month, (emp.nameVi||"").replaceAll(","," "), (emp.nameEn||"").replaceAll(","," "),
      emp.code||"", emp.bankAcc||"", emp.bankName||"", emp.className||"",
      p.totalHours||0, p.hourlyRate||0, p.gross||0, p.insurance||0, p.net||0, p.advance||0, p.balance||0
    ];
    lines.push(vals.join(","));
  });
  const csv=lines.join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=`payroll_${month}.csv`; a.click();
  URL.revokeObjectURL(a.href);
};

/** ---------------- Admin ---------------- **/
$("#btn-ad-refresh").onclick=()=>{
  const month=$("#ad-month").value; const tbody=$("#tbl-ad tbody"); tbody.innerHTML="";
  if(!month) return;
  const rows=db.payrolls.filter(p=>p.month===month);
  let totalNet=0;
  rows.forEach(p=>{
    const emp=db.employees.find(e=>e.id===p.employeeId)||{};
    totalNet+=p.net||0;
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${emp.nameVi||""}</td><td>${p.totalHours||0}</td><td>${fmt(p.gross||0)}</td>
      <td>${fmt(p.insurance||0)}</td><td>${fmt(p.net||0)}</td><td>${fmt(p.advance||0)}</td><td>${fmt(p.balance||0)}</td>`;
    tbody.appendChild(tr);
  });
  $("#ad-total-net").textContent=fmt(totalNet);
};

/** ---------------- Slip ---------------- **/
// ... (Hàm openSlip không thay đổi)
function openSlip(payrollId){
  const pr=db.payrolls.find(p=>p.id===payrollId); if(!pr) return;
  const emp=db.employees.find(e=>e.id===pr.employeeId)||{};
  $("#slip-content").innerHTML=`
    <div class="slip-body">
      <div class="kv"><label>Tháng</label><div>${pr.month}</div></div>
      <div class="kv"><label>Tên nhân viên</label><div>${emp.nameVi||""}${emp.nameEn?(" ("+emp.nameEn+")"):""}</div></div>
      <div class="kv"><label>Mã NV</label><div>${emp.code||"-"}</div></div>
      <div class="kv"><label>Số TK</label><div>${emp.bankAcc||"-"}</div></div>
      <div class="kv"><label>Ngân hàng</label><div>${emp.bankName||"-"}</div></div>
      <div class="kv"><label>Lớp</label><div>${emp.className||"-"}</div></div>
    </div>
    <table class="slip-table">
      <thead><tr><th>Mục</th><th>Giá trị</th></tr></thead>
      <tbody>
        <tr><td>Tổng số buổi dạy</td><td>${pr.totalSessions||0}</td></tr>
        <tr><td>Tổng số giờ dạy</td><td>${pr.totalHours||0}</td></tr>
        <tr><td>Lương theo giờ (VND)</td><td>${fmt(pr.hourlyRate||0)}</td></tr>
        <tr><td>Tổng lương (Gross)</td><td>${fmt(pr.gross||0)}</td></tr>
        <tr><td>Bảo hiểm xã hội</td><td>${fmt(pr.insurance||0)}</td></tr>
        <tr><td>Lương thực nhận (Net)</td><td>${fmt(pr.net||0)}</td></tr>
        <tr><td>Paid in advance</td><td>${fmt(pr.advance||0)}</td></tr>
        <tr><td><b>Balance</b></td><td><b>${fmt(pr.balance||0)}</b></td></tr>
      </tbody>
    </table>
  `;
  const dlg=$("#dlg-slip"); dlg.showModal();
  $("#btn-slip-close").onclick=()=>dlg.close();
  $("#btn-slip-print").onclick=()=>window.print();
}

/** ---------------- Phieu Chi ---------------- **/
// ... (Hàm docso và openPhieuChi không thay đổi)
function docso(so) {
    const mangso = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    function dochangchuc(so, daydu) {
        var chuoi = "";
        const chuc = Math.floor(so / 10);
        const donvi = so % 10;
        if (chuc > 1) { chuoi = " " + mangso[chuc] + " mươi"; if (donvi == 1) { chuoi += " mốt"; } }
        else if (chuc == 1) { chuoi = " mười"; if (donvi == 1) { chuoi += " một"; } }
        else if (daydu && donvi > 0) { chuoi = " lẻ"; }
        if (donvi == 5 && chuc > 1) { chuoi += " lăm"; }
        else if (donvi > 1 || (donvi == 1 && chuc == 0)) { chuoi += " " + mangso[donvi]; }
        return chuoi;
    }
    function docblock(so, daydu) {
        var chuoi = "";
        const tram = Math.floor(so / 100);
        so = so % 100;
        if (daydu || tram > 0) { chuoi = " " + mangso[tram] + " trăm"; chuoi += dochangchuc(so, true); }
        else { chuoi = dochangchuc(so, false); }
        return chuoi;
    }
    function dochangtrieu(so) {
        if (so == 0) return "";
        var chuoi = "";
        var trieu = Math.floor(so / 1000000);
        so = so % 1000000;
        if (trieu > 0) { chuoi = docblock(trieu, false) + " triệu"; }
        var nghin = Math.floor(so / 1000);
        so = so % 1000;
        if (nghin > 0) { chuoi += docblock(nghin, false) + " nghìn"; }
        if (so > 0) { chuoi += docblock(so, false); }
        return chuoi;
    }
    if (so == 0) return mangso[0];
    var chuoi = "", hauto = "";
    do {
        const ty = so % 1000000000;
        so = Math.floor(so / 1000000000);
        if (so > 0) { chuoi = dochangtrieu(ty) + hauto + chuoi; }
        else { chuoi = dochangtrieu(ty) + hauto + chuoi; }
        hauto = " tỷ";
    } while (so > 0);
    let result = chuoi.trim();
    result = result[0].toUpperCase() + result.slice(1);
    return result;
}

function openPhieuChi(payrollId) {
    const pr = db.payrolls.find(p => p.id === payrollId); if (!pr) return;
    const emp = db.employees.find(e => e.id === pr.employeeId) || {};
    const today = new Date();
    const balanceAmount = pr.balance || 0;
    
    const contentHTML = `
        <div id="phieu-chi-print-area">
            <header class="header">
                <h1>T&T GROUP</h1>
                <h2>PHIẾU CHI</h2>
                <p>Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</p>
            </header>
            <section class="info-section">
                <div class="info-left">
                    <div class="info-row">
                        <label>Họ và tên người nhận tiền:</label>
                        <span>${emp.nameVi || ""}</span>
                    </div>
                    <div class="info-row">
                        <label>Địa chỉ:</label>
                        <span>&nbsp;</span>
                    </div>
                    <div class="info-row">
                        <label>Lý do chi:</label>
                        <span>Thanh toán lương tháng ${pr.month}</span>
                    </div>
                </div>
                <div class="info-right">
                    <p><strong>Số:</strong></p>
                    <p><strong>Nợ:</strong></p>
                    <p><strong>Có:</strong></p>
                </div>
            </section>
            <table class="payment-table">
                <thead><tr><th>DIỄN GIẢI</th><th>SỐ TIỀN (VND)</th><th>GHI CHÚ</th></tr></thead>
                <tbody>
                    <tr><td>Thanh toán lương tháng ${pr.month}</td><td class="amount-col">${fmt(balanceAmount)}</td><td></td></tr>
                    <tr class="total-row"><td>TỔNG CỘNG</td><td class="amount-col">${fmt(balanceAmount)}</td><td></td></tr>
                </tbody>
            </table>
            <section class="summary-section">
                <p><strong>Số tiền viết bằng chữ:</strong> <span>${docso(balanceAmount)} đồng chẵn.</span></p>
                <p><strong>Kèm theo:</strong> <span>0</span> chứng từ gốc.</p>
            </section>
            <footer class="signature-section">
                <div class="signature-box"><p>Giám đốc</p><p class="note">(Ký, họ tên, đóng dấu)</p></div>
                <div class="signature-box"><p>Kế toán trưởng</p><p class="note">(Ký, họ tên)</p></div>
                <div class="signature-box"><p>Kế toán</p><p class="note">(Ký, họ tên)</p></div>
                <div class="signature-box"><p>Người lập phiếu</p><p class="note">(Ký, họ tên)</p></div>
                <div class="signature-box"><p>Thủ quỹ</p><p class="note">(Ký, họ tên)</p></div>
            </footer>
        </div>
        <div id="phieu-chi-controls">
            <button id="btn-phieuchi-close" class="btn">Đóng</button>
            <button id="btn-phieuchi-print" class="btn primary">In / Lưu PDF</button>
        </div>
    `;

    const dlg = $("#dlg-phieu-chi");
    $("#phieu-chi-content").innerHTML = contentHTML;
    dlg.showModal();
    $("#btn-phieuchi-close").onclick = () => dlg.close();
    $("#btn-phieuchi-print").onclick = () => window.print();
}

/** Init defaults **/
function initDefaults(){
  const now=new Date(), ym=now.toISOString().slice(0,7);
  if(!$("#en-month").value) $("#en-month").value = localStorage.getItem("lastMonth_en") || ym;
  if(!$("#pr-month").value) $("#pr-month").value = localStorage.getItem("lastMonth_pr") || ym;
  if(!$("#ad-month").value) $("#ad-month").value = ym;
  renderEntryTable(); renderPayroll();
}

/** Auto-login if session exists */
window.addEventListener("DOMContentLoaded", async ()=>{
  // Tải dữ liệu từ GitHub trước
  db = await loadDataFromGithub();

  // Sau khi có dữ liệu, tiếp tục logic như cũ
  const user=getSession();
  if(user && db.users.find(u => u.username === user.username)){ // Kiểm tra user session có hợp lệ với db mới không
    window.currentUser=user;
    $("#userBox").textContent = `${user.username} (${user.role})`;
    $("#btn-logout").style.display="inline-flex";
    $$(".role-nhap_lieu").forEach(el=> el.style.display = (["nhap_lieu","admin"].includes(user.role)?"":"none"));
    $$(".role-ke_toan").forEach(el=> el.style.display = (["ke_toan","admin"].includes(user.role)?"":"none"));
    $$(".role-admin").forEach(el=> el.style.display = (user.role==="admin"?"":"none"));
    show("#view-dashboard"); activateTabs("#view-dashboard"); initDefaults(); refreshStats();
  }else{
    show("#view-login"); activateTabs("#view-dashboard");
  }
});