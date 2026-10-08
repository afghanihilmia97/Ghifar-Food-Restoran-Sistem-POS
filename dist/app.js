const navItems = document.querySelectorAll('.nav-item[data-view]');
const views = document.querySelectorAll('.view');
const breadcrumb = document.getElementById('breadcrumbCurrent');
const backdrop = document.getElementById('modalBackdrop');
const sidebar = document.getElementById('sidebar');
const viewNames = {dashboard:'Dashboard',orders:'Pesanan & Kasir',menu:'Menu & Harga',inventory:'Inventori',marketing:'Marketing',employees:'Karyawan',insights:'Insight',reports:'Laporan',settings:'Pengaturan'};

function showView(name){
  views.forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  navItems.forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  breadcrumb.textContent=viewNames[name]||name;
  sidebar.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
}
navItems.forEach(item=>item.addEventListener('click',()=>showView(item.dataset.view)));
document.querySelectorAll('[data-view-target]').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.viewTarget)));
document.getElementById('mobileMenu').addEventListener('click',()=>sidebar.classList.toggle('open'));

function openModal(id){
  backdrop.classList.add('open');
  document.querySelectorAll('.modal').forEach(m=>{
    if(m.parentElement!==backdrop) backdrop.appendChild(m);
    m.classList.toggle('active',m.id===id);
  });
}
function closeModal(){backdrop.classList.remove('open');document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active'));}
document.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.openModal)));
document.querySelectorAll('.modal-close').forEach(btn=>btn.addEventListener('click',closeModal));
backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

document.querySelectorAll('.filter-tabs button,.category-chip').forEach(btn=>btn.addEventListener('click',()=>{
  btn.parentElement.querySelectorAll('button').forEach(sib=>sib.classList.remove('active'));btn.classList.add('active');
}));

const liveOrdersKey='ghifarFoodLiveOrders';
function readLiveOrders(){try{return JSON.parse(localStorage.getItem(liveOrdersKey)||'[]')}catch(error){return []}}
function saveLiveOrders(orders){localStorage.setItem(liveOrdersKey,JSON.stringify(orders))}
function liveOrderRow(order){
  const statusClass=order.status==='paid'?'paid':order.status==='ready'?'process':order.status==='process'?'process':'pending';
  const statusLabel={pending:'Menunggu',process:'Diproses',ready:'Siap diambil',paid:'Selesai'}[order.status]||'Menunggu';
  const action=order.status==='pending'?'Terima':order.status==='process'?'Siapkan':order.status==='ready'?'Selesaikan':'Detail';
  const next=order.status==='pending'?'process':order.status==='process'?'ready':order.status==='ready'?'paid':'paid';
  return `<tr data-order-row data-order-id="${order.id}" data-order-status="${order.status}" data-order-type="${order.type}"><td><strong>${order.id}</strong><small>${order.time}</small></td><td><div class="customer"><span class="mini-avatar av5">${order.customer.slice(0,2).toUpperCase()}</span>${order.customer}</div></td><td>${order.items||2} item</td><td><span class="order-type ${order.type}">${order.type==='dine'?'Dine in':order.type==='online'?'Online':'Takeaway'}</span></td><td><span class="payment ${order.payment==='Lunas'?'paid-text':'unpaid-text'}">${order.payment}</span></td><td><strong>${order.total}</strong></td><td><span class="status ${statusClass}">${statusLabel}</span></td><td><button class="order-action ${order.status==='paid'?'detail':''}" data-order-action="${order.status==='paid'?'detail':'next'}" data-next-status="${next}">${action}</button></td></tr>`;
}
function renderLiveOrders(){
  const table=document.getElementById('ordersTable');const recent=document.getElementById('recentOrders');const live=readLiveOrders();
  if(table) live.forEach(order=>{if(!table.querySelector(`[data-live-id="${order.id}"]`)){const holder=document.createElement('tbody');holder.innerHTML=liveOrderRow(order);const row=holder.firstElementChild;row.dataset.liveId=order.id;table.prepend(row)}});
  if(recent) live.slice(0,4).forEach(order=>{if(!recent.querySelector(`[data-live-id="${order.id}"]`)){const row=document.createElement('tr');row.dataset.liveId=order.id;row.innerHTML=`<td><strong>${order.id}</strong><small>${order.time}</small></td><td><div class="customer"><span class="mini-avatar av5">${order.customer.slice(0,2).toUpperCase()}</span>${order.customer}</div></td><td><span class="order-type ${order.type}">${order.type==='dine'?'Dine in':order.type==='online'?'Online':'Takeaway'}</span></td><td><strong>${order.total}</strong></td><td><span class="status ${order.status==='paid'?'paid':order.status==='process'?'process':'pending'}">${order.status==='paid'?'Selesai':order.status==='process'?'Diproses':'Menunggu'}</span></td>`;recent.prepend(row)}});
}
function updateOrderMetrics(){
  const live=readLiveOrders();const active=live.filter(o=>o.status!=='paid').length;const unpaid=live.filter(o=>o.payment!=='Lunas').length;const activeEl=document.getElementById('activeOrdersCount');const unpaidEl=document.getElementById('unpaidOrdersCount');if(activeEl)activeEl.textContent=String(12+active);if(unpaidEl)unpaidEl.textContent=String(4+unpaid);
}
const orderSearch=document.getElementById('orderSearch');
function filterOrderRows(){const query=(orderSearch?.value||'').toLowerCase();const status=document.querySelector('[data-order-filter].active')?.dataset.orderFilter||'all';const type=document.getElementById('orderTypeFilter')?.value||'all';document.querySelectorAll('[data-order-row]').forEach(row=>{const text=row.textContent.toLowerCase();const statusMatch=status==='all'||row.dataset.orderStatus===status;const typeMatch=type==='all'||row.dataset.orderType===type;row.style.display=text.includes(query)&&statusMatch&&typeMatch?'':'none'})}
orderSearch?.addEventListener('input',filterOrderRows);
document.querySelectorAll('[data-order-filter]').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('[data-order-filter]').forEach(item=>item.classList.toggle('active',item===tab));filterOrderRows()}));
document.getElementById('orderTypeFilter')?.addEventListener('change',filterOrderRows);
document.getElementById('saveOrder')?.addEventListener('click',()=>{
  const customer=document.getElementById('newCustomer').value.trim()||'Pelanggan baru';const selects=document.querySelectorAll('#orderModal select');const typeValue=selects[0]?.value||'Dine in';const paymentValue=selects[1]?.value||'QRIS';const type=typeValue.toLowerCase().includes('online')?'online':typeValue.toLowerCase().includes('takeaway')?'takeaway':'dine';const order={id:`#GF-${1043+readLiveOrders().length}`,customer,type,payment:paymentValue==='Tunai'?'Belum bayar':'Lunas',total:'Rp 50.000',items:2,status:'pending',time:currentOrderTime()};const orders=[order,...readLiveOrders()];saveLiveOrders(orders);renderLiveOrders();updateOrderMetrics();updateDashboardRealtime();closeModal();document.getElementById('newCustomer').value='';showToast('Pesanan baru berhasil dibuat dan dashboard diperbarui');
});
function currentOrderTime(){return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replace('.',':')}
renderLiveOrders();updateOrderMetrics();

function showToast(message){
  const toast=document.createElement('div');toast.className='toast';toast.innerHTML=`<span>✓</span>${message}`;document.body.appendChild(toast);
  setTimeout(()=>toast.classList.add('show'),20);setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),250)},2600);
}
document.querySelectorAll('.settings-form .primary-btn').forEach(btn=>btn.addEventListener('click',()=>showToast('Perubahan profil berhasil disimpan')));
document.querySelectorAll('.modal .primary-btn:not(#saveOrder)').forEach(btn=>btn.addEventListener('click',()=>{closeModal();showToast('Data berhasil disimpan')}));

const settingsTabs=document.querySelectorAll('[data-settings-tab]');
const settingsPanes=document.querySelectorAll('[data-settings-pane]');
settingsTabs.forEach(tab=>tab.addEventListener('click',()=>{
  const target=tab.dataset.settingsTab;
  settingsTabs.forEach(item=>item.classList.toggle('active',item===tab));
  settingsPanes.forEach(pane=>pane.classList.toggle('active',pane.dataset.settingsPane===target));
}));

document.querySelectorAll('.toggle').forEach(toggle=>toggle.addEventListener('click',()=>{
  const isActive=toggle.classList.toggle('active');
  toggle.setAttribute('aria-pressed',String(isActive));
}));

function applyLogo(dataUrl){
  document.querySelectorAll('[data-logo-mark]').forEach(mark=>{
    mark.innerHTML=`<img src="${dataUrl}" alt="Logo Ghifar Food">`;
    mark.style.background='transparent';
    mark.style.boxShadow='none';
  });
}
const savedLogo=localStorage.getItem('ghifarFoodLogo');
if(savedLogo) applyLogo(savedLogo);
const logoInput=document.getElementById('logoFileInput');
const changeLogoBtn=document.getElementById('changeLogoBtn');
changeLogoBtn?.addEventListener('click',()=>logoInput?.click());
logoInput?.addEventListener('change',()=>{
  const file=logoInput.files?.[0];
  if(!file) return;
  if(file.size>2*1024*1024){showToast('Ukuran logo maksimal 2 MB');logoInput.value='';return;}
  if(!file.type.startsWith('image/')){showToast('File harus berupa gambar');logoInput.value='';return;}
  const reader=new FileReader();
  reader.onload=()=>{
    try{localStorage.setItem('ghifarFoodLogo',reader.result);applyLogo(reader.result);showToast('Logo berhasil diganti');}
    catch(error){showToast('Logo tampil, tetapi belum bisa disimpan di browser ini');}
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll('.settings-save').forEach(btn=>btn.addEventListener('click',()=>showToast(btn.dataset.message||'Pengaturan berhasil disimpan')));

let attendanceRows=[...document.querySelectorAll('.attendance-row')];
const attendanceKey='ghifarFoodAttendance';
const timeToMinutes=value=>{if(!value||value==='—')return null;const [hours,minutes]=value.split(':').map(Number);return hours*60+minutes};
const currentTime=()=>new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replace('.',':');
const minutesToDuration=minutes=>{if(minutes===null||Number.isNaN(minutes))return '—';const safe=Math.max(0,minutes);return `${Math.floor(safe/60)}j ${safe%60}m`};
function setAttendanceStatus(row,status,delay=0){
  row.dataset.status=status;
  const badge=row.querySelector('.status-update');
  badge.classList.remove('present','late','absent');
  badge.classList.add(status==='late'?'late':status==='absent'?'absent':'present');
  badge.textContent=status==='late'?`● Telat ${delay} menit`:status==='absent'?'● Belum masuk':'● Tepat waktu';
}
function updateAttendanceButton(row){
  const button=row.querySelector('.attendance-action');
  const entry=row.querySelector('.time-in').textContent.trim();
  const exit=row.querySelector('.time-out').textContent.trim();
  if(entry==='—'){button.dataset.action='clock-in';button.textContent='Absen masuk';button.classList.remove('done');button.disabled=false;return;}
  if(exit==='—'){button.dataset.action='clock-out';button.textContent='Absen pulang';button.classList.remove('done');button.disabled=false;return;}
  button.dataset.action='complete';button.textContent='Selesai';button.classList.add('done');button.disabled=true;
}
function updateAttendanceSummary(){
  let present=0,late=0,open=0,total=0;
  attendanceRows.forEach(row=>{
    const entry=timeToMinutes(row.querySelector('.time-in').textContent.trim());
    const exit=timeToMinutes(row.querySelector('.time-out').textContent.trim());
    if(entry!==null)present++;
    if(row.dataset.status==='late')late++;
    if(entry!==null&&exit===null)open++;
    if(entry!==null&&exit!==null){let duration=exit-entry;if(duration<0)duration+=1440;total+=duration;row.querySelector('.duration').textContent=minutesToDuration(duration)}
  });
  const presentEl=document.getElementById('presentCount');const lateEl=document.getElementById('lateCount');const openEl=document.getElementById('openShiftCount');const hoursEl=document.getElementById('workHours');
  const totalEmployees=22+document.querySelectorAll('.attendance-row[data-custom-employee]').length;
  if(presentEl)presentEl.innerHTML=`${present} <small>/ ${totalEmployees} orang</small>`;
  if(lateEl)lateEl.innerHTML=`${late} <small>orang</small>`;
  if(openEl)openEl.innerHTML=`${open} <small>orang</small>`;
  if(hoursEl)hoursEl.textContent=minutesToDuration(total);
}
function saveAttendance(){
  const state={};attendanceRows.forEach(row=>{state[row.dataset.employee]={entry:row.querySelector('.time-in').textContent.trim(),exit:row.querySelector('.time-out').textContent.trim(),status:row.dataset.status,delay:row.dataset.delay||'0'}});
  localStorage.setItem(attendanceKey,JSON.stringify(state));
}
function restoreAttendance(){
  try{const state=JSON.parse(localStorage.getItem(attendanceKey)||'{}');attendanceRows.forEach(row=>{const saved=state[row.dataset.employee];if(!saved)return;row.querySelector('.time-in').textContent=saved.entry;row.querySelector('.time-out').textContent=saved.exit;row.querySelector('.time-in').classList.toggle('muted',saved.entry==='—');row.querySelector('.time-out').classList.toggle('muted',saved.exit==='—');row.dataset.delay=saved.delay||'0';setAttendanceStatus(row,saved.status,saved.delay||0);updateAttendanceButton(row)});}catch(error){/* Ignore invalid demo-local data. */}
  updateAttendanceSummary();
}
attendanceRows.forEach(row=>row.querySelector('.attendance-action')?.addEventListener('click',()=>{
  const button=row.querySelector('.attendance-action');const action=button.dataset.action;if(action==='complete')return;
  const now=currentTime();
  if(action==='clock-in'){
    const start=timeToMinutes(row.dataset.shiftStart);const actual=timeToMinutes(now);const delay=Math.max(0,(actual??0)-(start??0));
    row.querySelector('.time-in').textContent=now;row.querySelector('.time-in').classList.remove('muted');row.dataset.delay=String(delay);setAttendanceStatus(row,delay>0?'late':'present',delay);showToast(delay>0?`Absen masuk tercatat — telat ${delay} menit`:'Absen masuk tercatat tepat waktu');
  }else if(action==='clock-out'){
    const entry=timeToMinutes(row.querySelector('.time-in').textContent.trim());const exit=timeToMinutes(now);let duration=exit-entry;if(duration<0)duration+=1440;
    row.querySelector('.time-out').textContent=now;row.querySelector('.time-out').classList.remove('muted');row.querySelector('.duration').textContent=minutesToDuration(duration);showToast('Absen pulang tercatat');
  }
  updateAttendanceButton(row);updateAttendanceSummary();saveAttendance();
}));
document.querySelectorAll('[data-attendance-filter]').forEach(filter=>filter.addEventListener('click',()=>{
  document.querySelectorAll('[data-attendance-filter]').forEach(item=>item.classList.toggle('active',item===filter));
  const target=filter.dataset.attendanceFilter;filterEmployeeRows(target);
}));
restoreAttendance();

const inventoryTabs=document.querySelectorAll('[data-inventory-tab]');
const inventoryPanes=document.querySelectorAll('[data-inventory-pane]');
inventoryTabs.forEach(tab=>tab.addEventListener('click',()=>{
  const target=tab.dataset.inventoryTab;
  inventoryTabs.forEach(item=>item.classList.toggle('active',item===tab));
  inventoryPanes.forEach(pane=>pane.classList.toggle('active',pane.dataset.inventoryPane===target));
}));
function filterInventory(){
  const query=(document.getElementById('inventorySearch')?.value||'').toLowerCase();
  const status=document.getElementById('inventoryStatusFilter')?.value||'all';
  document.querySelectorAll('[data-inventory-row]').forEach(row=>{
    const matchesText=(row.dataset.search||row.textContent).toLowerCase().includes(query);
    const matchesStatus=status==='all'||row.dataset.status===status;
    row.classList.toggle('is-hidden',!(matchesText&&matchesStatus));
  });
}
document.getElementById('inventorySearch')?.addEventListener('input',filterInventory);
document.getElementById('inventoryStatusFilter')?.addEventListener('change',filterInventory);
document.querySelectorAll('[data-inventory-action]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.inventoryAction;const item=button.dataset.item||'stok';
  if(action==='restock'){openModal('purchaseModal');showToast(`Form pembelian ${item} dibuka`);return;}
  if(action==='adjust'){openModal('stockAdjustModal');showToast(`Form penyesuaian ${item} dibuka`);return;}
  if(action==='details'){showToast(`Detail stok ${item} siap ditinjau`);return;}
  if(action==='supplier'){showToast(`Detail supplier ${item} siap ditinjau`);return;}
  if(action==='export'){showToast('Riwayat pergerakan stok siap diekspor');return;}
}));

function formatRupiah(value){return `Rp ${Math.round(value).toLocaleString('id-ID')}`}
function updateDashboardRealtime(){
  const live=readLiveOrders();const baseSales=8420000;const baseOrders=126;const baseCustomers=38;const addedSales=live.reduce((sum,order)=>sum+(Number(String(order.total).replace(/[^0-9]/g,''))||0),0);const totalSales=baseSales+addedSales;const totalOrders=baseOrders+live.length;const values=document.querySelectorAll('#view-dashboard .stat-value');
  if(values[0])values[0].innerHTML=`${formatRupiah(totalSales)}`;
  if(values[1])values[1].innerHTML=`${totalOrders} <small>pesanan</small>`;
  if(values[2])values[2].innerHTML=`${formatRupiah(totalSales/Math.max(totalOrders,1))}`;
  if(values[3])values[3].innerHTML=`${baseCustomers+live.length} <small>orang</small>`;
  const heading=document.querySelector('#view-dashboard .page-heading p');
  if(heading&&!document.getElementById('dashboardLiveStatus')){heading.insertAdjacentHTML('afterend','<div class="dashboard-live-status" id="dashboardLiveStatus"><span>●</span> LIVE · Diperbarui otomatis <time></time></div>')}
  const liveTime=document.querySelector('#dashboardLiveStatus time');if(liveTime)liveTime.textContent=currentOrderTime();
  const topDate=document.querySelector('.date-chip span');if(topDate)topDate.textContent=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
}
function updateOrderRowStatus(row,nextStatus){
  const labels={pending:'Menunggu',process:'Diproses',ready:'Siap diambil',paid:'Selesai'};const classes={pending:'pending',process:'process',ready:'process',paid:'paid'};row.dataset.orderStatus=nextStatus;const badge=row.querySelector('.status');if(badge){badge.className=`status ${classes[nextStatus]}`;badge.textContent=labels[nextStatus]||nextStatus}
  const button=row.querySelector('.order-action');if(button){if(nextStatus==='paid'){button.textContent='Detail';button.dataset.orderAction='detail';button.classList.add('detail')}else{const next=nextStatus==='pending'?'process':nextStatus==='process'?'ready':'paid';button.textContent=nextStatus==='pending'?'Terima':nextStatus==='process'?'Siapkan':'Selesaikan';button.dataset.nextStatus=next;button.dataset.orderAction='next';button.classList.remove('detail')}}
}
document.getElementById('ordersTable')?.addEventListener('click',event=>{
  const button=event.target.closest('.order-action');if(!button)return;const row=button.closest('[data-order-row]');if(!row)return;const action=button.dataset.orderAction;
  if(action==='detail'){openOrderDetail(row);return}
  const next=button.dataset.nextStatus||'process';updateOrderRowStatus(row,next);const id=row.dataset.liveId;if(id){const orders=readLiveOrders().map(order=>order.id===id?{...order,status:next}:order);saveLiveOrders(orders)}updateOrderMetrics();updateDashboardRealtime();filterOrderRows();showToast(`Status pesanan diperbarui: ${next==='process'?'Diproses':next==='ready'?'Siap diambil':'Selesai'}`);
});
document.querySelectorAll('[data-order-action]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.orderAction;if(action==='kitchen'){showToast('Layar dapur dibuka — 8 pesanan aktif');return}if(action==='export'){downloadSalesExcel(getReportOrders());return}if(action==='close-shift'){showToast('Rekap kasir siap ditinjau sebelum tutup shift');return}
}));
updateDashboardRealtime();setInterval(()=>{updateDashboardRealtime();renderSalesReport()},3000);

const seededOrderDetails={
  '#GF-1042':{items:[['Ayam Geprek Sambal Matah',2,32000],['Es Kopi Gula Aren',1,18000]],subtotal:82000,service:4100,tax:9900},
  '#GF-1041':{items:[['Mie Goreng Spesial',2,28000],['Nasi Goreng Seafood',1,42000],['Es Kopi Gula Aren',1,18000],['Dimsum Mix',1,25000]],subtotal:141000,service:0,tax:7500},
  '#GF-1040':{items:[['Nasi Goreng Seafood',1,42000],['Es Teh Manis',2,15000]],subtotal:72000,service:0,tax:0},
  '#GF-1039':{items:[['Paket Hemat Keluarga',2,68000],['Ayam Geprek Sambal Matah',1,32000],['Mie Goreng Spesial',1,28000],['Es Teh Manis',4,15000]],subtotal:188000,service:9400,tax:16600},
  '#GF-1038':{items:[['Ayam Geprek Sambal Matah',2,32000],['Es Kopi Gula Aren',1,18000],['Es Teh Manis',1,12000]],subtotal:126000,service:0,tax:0}
};
const reportStatusLabels={pending:'Menunggu',process:'Diproses',ready:'Siap diambil',paid:'Selesai'};
const reportTypeLabels={dine:'Dine in',takeaway:'Takeaway',online:'Online'};
function parseReportMoney(value){return Number(String(value||'').replace(/[^0-9]/g,''))||0}
function reportDateLabel(){return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date())}
function orderRecordFromRow(row){
  const cells=row.querySelectorAll('td');const id=row.dataset.orderId||cells[0]?.querySelector('strong')?.textContent.trim()||'#GF-0000';const live=readLiveOrders().find(order=>order.id===id);const detail=seededOrderDetails[id]||{};const status=row.dataset.orderStatus||live?.status||'pending';
  return {id,customer:live?.customer||cells[1]?.textContent.trim()||'Pelanggan',items:live?.items||parseInt(cells[2]?.textContent,10)||detail.items?.reduce((sum,item)=>sum+item[1],0)||1,type:live?.type||row.dataset.orderType||'dine',payment:live?.payment||cells[4]?.textContent.trim()||'Belum bayar',total:live?parseReportMoney(live.total):parseReportMoney(cells[5]?.textContent),status,time:live?.time||cells[0]?.querySelector('small')?.textContent.trim()||currentOrderTime(),detail};
}
function getReportOrders(){
  const orders=new Map();document.querySelectorAll('#ordersTable [data-order-row]').forEach(row=>{const order=orderRecordFromRow(row);orders.set(order.id,order)});
  return [...orders.values()].sort((a,b)=>b.id.localeCompare(a.id,undefined,{numeric:true}));
}
function filteredReportOrders(){
  const query=(document.getElementById('reportSearch')?.value||'').toLowerCase();const status=document.getElementById('reportStatus')?.value||'all';const type=document.getElementById('reportType')?.value||'all';
  return getReportOrders().filter(order=>{const text=`${order.id} ${order.customer} ${reportTypeLabels[order.type]||order.type}`.toLowerCase();const statusMatch=status==='all'||(status==='unpaid'?order.payment!=='Lunas':order.status===status);const typeMatch=type==='all'||order.type===type;return text.includes(query)&&statusMatch&&typeMatch});
}
function detailForOrder(order){
  if(order.detail?.items?.length)return order.detail;
  const total=order.total;const half=Math.round(total*.58);return {items:[['Ayam Geprek Sambal Matah',1,half],['Es Kopi Gula Aren',Math.max(1,(order.items||2)-1),Math.max(0,total-half)]],subtotal:total,service:0,tax:0};
}
function ensureOrderDetailModal(){
  let modal=document.getElementById('orderDetailModal');if(modal)return modal;
  modal=document.createElement('div');modal.className='modal';modal.id='orderDetailModal';modal.innerHTML='<button class="modal-close">×</button><div class="eyebrow">LAPORAN PENJUALAN</div><div class="detail-title-row"><div><h2 data-detail-title>Detail pesanan</h2><p class="form-muted" data-detail-subtitle></p></div><span class="status paid" data-detail-status>Selesai</span></div><div class="detail-meta" data-detail-meta></div><div class="detail-items" data-detail-items></div><div class="detail-financials" data-detail-financials></div><button class="outline-btn full" data-detail-open-report>Lihat di laporan penjualan</button>';
  backdrop.appendChild(modal);modal.querySelector('.modal-close').addEventListener('click',closeModal);modal.querySelector('[data-detail-open-report]').addEventListener('click',()=>{closeModal();showView('reports')});return modal;
}
function openOrderDetailRecord(order){
  const modal=ensureOrderDetailModal();const detail=detailForOrder(order);const total=order.total;const subtotal=detail.subtotal||total;const service=detail.service||0;const tax=detail.tax||Math.max(0,total-subtotal-service);const statusClass=order.status==='paid'?'paid':order.status==='pending'?'pending':'process';
  modal.querySelector('[data-detail-title]').textContent=`${order.id} · ${order.customer}`;modal.querySelector('[data-detail-subtitle]').textContent=`${order.time} · ${reportTypeLabels[order.type]||'Pesanan'} · ${order.items} item`;const badge=modal.querySelector('[data-detail-status]');badge.className=`status ${statusClass}`;badge.textContent=reportStatusLabels[order.status]||order.status;
  modal.querySelector('[data-detail-meta]').innerHTML=`<div><span>Pelanggan</span><strong>${order.customer}</strong></div><div><span>Tipe pesanan</span><strong>${reportTypeLabels[order.type]||order.type}</strong></div><div><span>Pembayaran</span><strong class="${order.payment==='Lunas'?'positive':'negative'}">${order.payment}</strong></div><div><span>Kasir</span><strong>Yusuf Rahman</strong></div>`;
  modal.querySelector('[data-detail-items]').innerHTML=`<div class="detail-section-label">ITEM PESANAN</div>${detail.items.map(item=>`<div class="detail-item"><div><strong>${item[0]}</strong><small>${item[1]} × ${formatRupiah(item[2])}</small></div><b>${formatRupiah(item[1]*item[2])}</b></div>`).join('')}`;
  modal.querySelector('[data-detail-financials]').innerHTML=`<div><span>Subtotal</span><b>${formatRupiah(subtotal)}</b></div><div><span>Pajak</span><b>${tax?formatRupiah(tax):'Termasuk'}</b></div><div><span>Biaya layanan</span><b>${service?formatRupiah(service):'Termasuk'}</b></div><div class="detail-grand-total"><span>Total penjualan</span><strong>${formatRupiah(total)}</strong></div>`;
  openModal('orderDetailModal');
}
function openOrderDetail(row){openOrderDetailRecord(orderRecordFromRow(row))}
function reportTableRow(order){return `<tr><td>${order.time}</td><td><strong>${order.id}</strong></td><td>${order.customer}</td><td><span class="order-type ${order.type}">${reportTypeLabels[order.type]||order.type}</span></td><td><span class="payment ${order.payment==='Lunas'?'paid-text':'unpaid-text'}">${order.payment}</span></td><td><span class="status ${order.status==='paid'?'paid':order.status==='pending'?'pending':'process'}">${reportStatusLabels[order.status]||order.status}</span></td><td>${order.items}</td><td><strong>${formatRupiah(order.total)}</strong></td><td><button class="row-more" data-report-detail="${order.id}">Detail</button></td></tr>`}
function renderSalesReport(){
  const body=document.getElementById('reportRows');if(!body)return;const orders=filteredReportOrders();const all=filteredReportOrders();const revenue=all.reduce((sum,order)=>sum+order.total,0);const paid=all.filter(order=>order.payment==='Lunas').length;const revenueEl=document.getElementById('reportRevenue');const countEl=document.getElementById('reportOrderCount');const avgEl=document.getElementById('reportAverage');const paidEl=document.getElementById('reportPaidRate');if(revenueEl)revenueEl.textContent=formatRupiah(revenue);if(countEl)countEl.textContent=String(all.length);if(avgEl)avgEl.textContent=formatRupiah(all.length?revenue/all.length:0);if(paidEl)paidEl.textContent=`${all.length?Math.round(paid/all.length*100):0}%`;const note=document.getElementById('reportPaidNote');if(note)note.textContent=`${paid} dari ${all.length} pesanan`;body.innerHTML=all.map(reportTableRow).join('');const empty=document.getElementById('reportEmpty');if(empty)empty.hidden=all.length>0;
  const breakdown=document.getElementById('paymentBreakdown');const paymentGroups={};all.forEach(order=>{paymentGroups[order.payment]=(paymentGroups[order.payment]||0)+1});if(breakdown)breakdown.innerHTML=Object.entries(paymentGroups).map(([name,count])=>`<div class="payment-breakdown-row"><span><i class="payment-dot"></i>${name}</span><strong>${count} <small>${all.length?Math.round(count/all.length*100):0}%</small></strong></div>`).join('')||'<div class="report-muted">Belum ada data pembayaran.</div>';
  const items={};all.forEach(order=>detailForOrder(order).items.forEach(item=>{items[item[0]]=(items[item[0]]||0)+item[1]}));const top=Object.entries(items).sort((a,b)=>b[1]-a[1]).slice(0,4);const topEl=document.getElementById('reportTopItems');if(topEl)topEl.innerHTML=top.map(([name,count],index)=>`<div class="report-top-item"><span class="opp-rank">${String(index+1).padStart(2,'0')}</span><div><strong>${name}</strong><small>${count} item terjual</small></div></div>`).join('')||'<div class="report-muted">Belum ada item terjual.</div>';
}
function reportExportRows(orders){return orders.map(order=>({Tanggal:order.time,'ID Pesanan':order.id,Pelanggan:order.customer,Tipe:reportTypeLabels[order.type]||order.type,Pembayaran:order.payment,Status:reportStatusLabels[order.status]||order.status,Item:order.items,Total:formatRupiah(order.total)}))}
function downloadSalesExcel(orders){
  const rows=reportExportRows(orders);const headers=Object.keys(rows[0]||{Tanggal:'Tanggal','ID Pesanan':'ID Pesanan',Pelanggan:'Pelanggan',Tipe:'Tipe',Pembayaran:'Pembayaran',Status:'Status',Item:'Item',Total:'Total'});const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const html=`<html><head><meta charset="UTF-8"></head><body><h2>Laporan Penjualan Ghifar Food</h2><table border="1"><thead><tr>${headers.map(header=>`<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${headers.map(header=>`<td>${esc(row[header])}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`laporan-penjualan-ghifar-food-${new Date().toISOString().slice(0,10)}.xls`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);showToast('Laporan Excel berhasil diunduh');
}
document.getElementById('reportRows')?.addEventListener('click',event=>{const button=event.target.closest('[data-report-detail]');if(!button)return;const order=getReportOrders().find(item=>item.id===button.dataset.reportDetail);if(order)openOrderDetailRecord(order)});
document.querySelectorAll('[data-report-action]').forEach(button=>button.addEventListener('click',()=>{const action=button.dataset.reportAction;if(action==='export')downloadSalesExcel(filteredReportOrders());if(action==='print')window.print()}));
['reportSearch','reportPeriod','reportStatus','reportType'].forEach(id=>{const control=document.getElementById(id);control?.addEventListener(control.tagName==='INPUT'?'input':'change',renderSalesReport)});
renderSalesReport();

const menuGrid=document.getElementById('menuGrid');
const menuModalEl=document.getElementById('menuModal');
let menuPhotoData='';let menuEditingId=null;
const menuStateKey='ghifarFoodMenus';const menuAvailabilityKey='ghifarFoodMenuAvailability';
const menuSlug=value=>value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function readMenuState(){try{return JSON.parse(localStorage.getItem(menuStateKey)||'[]')}catch(error){return []}}
function saveMenuState(items){localStorage.setItem(menuStateKey,JSON.stringify(items))}
function readMenuAvailability(){try{return JSON.parse(localStorage.getItem(menuAvailabilityKey)||'{}')}catch(error){return {}}}
function saveMenuAvailability(items){localStorage.setItem(menuAvailabilityKey,JSON.stringify(items))}
function menuCardMarkup(item){
  const categoryLabel={makanan:'MAKANAN',minuman:'MINUMAN',snack:'SNACK',paket:'PAKET HEMAT'}[item.category]||'MENU';const photo=item.photo?`<img class="menu-image" src="${item.photo}" alt="${item.name}">`:`<span class="menu-emoji">${item.emoji||'🍽️'}</span>`;
  return `<article class="menu-card" data-menu-card data-menu-id="${item.id}" data-menu-category="${item.category}" data-menu-available="${item.available!==false}" data-menu-name="${item.name}" data-menu-price="${item.price}"><div class="menu-photo food-photo photo-user">${photo}<span class="${item.available===false?'low':'available'}">${item.available===false?'Tidak tersedia':'Tersedia'}</span></div><div class="menu-card-body"><div class="menu-category">${categoryLabel}</div><h3>${item.name}</h3><p>${item.description||'Menu baru Ghifar Food'}</p><div class="menu-price">${formatRupiah(item.price)} <span>${item.sold||0} terjual</span></div><div class="menu-card-actions"><button data-menu-action="toggle" data-menu-id="${item.id}">${item.available===false?'Aktifkan':'Nonaktifkan'}</button><button data-menu-action="edit" data-menu-id="${item.id}">Edit</button></div></div></article>`;
}
function updateMenuSummary(){const cards=[...document.querySelectorAll('[data-menu-card]')];const active=cards.filter(card=>card.dataset.menuAvailable==='true').length;const totalEl=document.getElementById('menuTotalCount');const availableEl=document.getElementById('menuAvailableCount');if(totalEl)totalEl.textContent=String(48+readMenuState().length);if(availableEl)availableEl.textContent=String(42+active-4)}
function filterMenuCards(){
  const query=(document.getElementById('menuSearch')?.value||'').toLowerCase();const category=document.querySelector('[data-menu-category].active')?.dataset.menuCategory||'all';const availability=document.getElementById('menuAvailability')?.value||'all';const sort=document.getElementById('menuSort')?.value||'popular';
  const cards=[...document.querySelectorAll('[data-menu-card]')];cards.sort((a,b)=>sort==='price-low'?Number(a.dataset.menuPrice)-Number(b.dataset.menuPrice):sort==='price-high'?Number(b.dataset.menuPrice)-Number(a.dataset.menuPrice):sort==='newest'?Number(b.dataset.menuId.startsWith('new-'))-Number(a.dataset.menuId.startsWith('new-')):0).forEach(card=>menuGrid.appendChild(card));
  cards.forEach(card=>{const text=`${card.dataset.menuName} ${card.dataset.menuCategory}`.toLowerCase();const matchText=text.includes(query);const matchCategory=category==='all'||card.dataset.menuCategory===category;const matchAvailability=availability==='all'||(availability==='available'?card.dataset.menuAvailable==='true':card.dataset.menuAvailable==='false');card.classList.toggle('menu-hidden',!(matchText&&matchCategory&&matchAvailability))});
}
function resetMenuForm(){menuEditingId=null;menuPhotoData='';if(menuModalEl){menuModalEl.querySelectorAll('input').forEach(input=>{if(input.type==='file')input.value='';else if(input.type!=='date')input.value=''});const preview=menuModalEl.querySelector('#menuPhotoPreview');if(preview)preview.innerHTML='<span>＋</span><small>Upload foto menu</small>';const title=menuModalEl.querySelector('h2');if(title)title.textContent='Tambah menu baru'}}
if(menuModalEl){
  const grid=menuModalEl.querySelector('.form-grid');const upload=document.createElement('div');upload.className='menu-upload-field';upload.innerHTML='<input id="menuPhotoInput" type="file" accept="image/png,image/jpeg,image/webp" hidden><button type="button" class="menu-photo-picker" id="menuPhotoPicker"><span id="menuPhotoPreview"><span>＋</span><small>Upload foto menu</small></span></button><div><strong>Foto menu</strong><small>JPG, PNG, atau WebP · maksimal 2 MB</small></div>';grid?.insertAdjacentElement('beforebegin',upload);
  const inputs=menuModalEl.querySelectorAll('.form-grid input');if(inputs[0])inputs[0].id='menuNameInput';if(inputs[1])inputs[1].id='menuPriceInput';if(inputs[2])inputs[2].id='menuCostInput';
  document.getElementById('menuPhotoPicker')?.addEventListener('click',()=>document.getElementById('menuPhotoInput')?.click());
  document.getElementById('menuPhotoInput')?.addEventListener('change',()=>{const file=document.getElementById('menuPhotoInput').files?.[0];if(!file)return;if(file.size>2*1024*1024){showToast('Ukuran foto maksimal 2 MB');return}const reader=new FileReader();reader.onload=()=>{menuPhotoData=reader.result;const preview=document.getElementById('menuPhotoPreview');if(preview)preview.innerHTML=`<img src="${menuPhotoData}" alt="Preview foto menu">`;showToast('Preview foto menu siap')};reader.readAsDataURL(file)});
  document.querySelectorAll('[data-open-modal="menuModal"]').forEach(button=>button.addEventListener('click',resetMenuForm));
  menuModalEl.querySelector('.primary-btn.full')?.addEventListener('click',()=>{
    const name=document.getElementById('menuNameInput')?.value.trim()||'Menu baru';const category=(menuModalEl.querySelector('select')?.value||'Makanan').toLowerCase().replace('paket hemat','paket');const price=Number((document.getElementById('menuPriceInput')?.value||'0').replace(/[^0-9]/g,''))||0;const description=menuModalEl.querySelector('textarea')?.value.trim()||'Menu baru Ghifar Food';const id=menuEditingId||`new-${Date.now()}`;const item={id,name,category,price,description,photo:menuPhotoData||'',emoji:'🍽️',available:true,sold:0};
    if(menuEditingId){const card=document.querySelector(`[data-menu-id="${menuEditingId}"]`);if(card){const existing=readMenuState().find(saved=>saved.id===menuEditingId);const merged={...(existing||{}),...item,available:card.dataset.menuAvailable==='true'};card.outerHTML=menuCardMarkup(merged);const items=readMenuState().filter(saved=>saved.id!==menuEditingId);saveMenuState([...items,merged]);showToast('Menu berhasil diperbarui')}}else{menuGrid?.insertAdjacentHTML('afterbegin',menuCardMarkup(item));saveMenuState([...readMenuState(),item]);showToast('Menu baru berhasil ditambahkan')}
    updateMenuSummary();filterMenuCards();closeModal();
  });
}
readMenuState().forEach(item=>{if(!document.querySelector(`[data-menu-id="${item.id}"]`))menuGrid?.insertAdjacentHTML('beforeend',menuCardMarkup(item))});
const savedAvailability=readMenuAvailability();Object.entries(savedAvailability).forEach(([id,available])=>{const card=document.querySelector(`[data-menu-id="${id}"]`);if(card){card.dataset.menuAvailable=String(available);const badge=card.querySelector('.menu-photo span');if(badge){badge.className=available?'available':'low';badge.textContent=available?'Tersedia':'Tidak tersedia'}const button=card.querySelector('[data-menu-action="toggle"]');if(button)button.textContent=available?'Nonaktifkan':'Aktifkan'}});
document.querySelectorAll('[data-menu-category]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-menu-category]').forEach(item=>item.classList.toggle('active',item===button));filterMenuCards()}));
document.getElementById('menuSearch')?.addEventListener('input',filterMenuCards);document.getElementById('menuSort')?.addEventListener('change',filterMenuCards);document.getElementById('menuAvailability')?.addEventListener('change',filterMenuCards);
menuGrid?.addEventListener('click',event=>{const button=event.target.closest('[data-menu-action]');if(!button)return;const card=button.closest('[data-menu-card]');const id=button.dataset.menuId||card?.dataset.menuId;if(button.dataset.menuAction==='toggle'&&card){const available=card.dataset.menuAvailable!=='true';card.dataset.menuAvailable=String(available);const badge=card.querySelector('.menu-photo span');if(badge){badge.className=available?'available':'low';badge.textContent=available?'Tersedia':'Tidak tersedia'}button.textContent=available?'Nonaktifkan':'Aktifkan';const state=readMenuAvailability();state[id]=available;saveMenuAvailability(state);updateMenuSummary();showToast(available?'Menu diaktifkan':'Menu ditandai tidak tersedia');return}if(button.dataset.menuAction==='edit'&&card){menuEditingId=id;const title=menuModalEl?.querySelector('h2');if(title)title.textContent='Edit menu';const name=document.getElementById('menuNameInput');const price=document.getElementById('menuPriceInput');if(name)name.value=card.dataset.menuName;if(price)price.value=card.dataset.menuPrice;openModal('menuModal');showToast('Mode edit menu dibuka')}});
document.querySelectorAll('[data-menu-action="export"]').forEach(button=>button.addEventListener('click',()=>showToast('Katalog menu siap diekspor')));
updateMenuSummary();filterMenuCards();

const ownerKey='ghifarFoodOwner';const businessProfileKey='ghifarFoodBusinessProfile';
const ownerDefaults={name:'Yusuf Rahman',role:'Owner',email:'yusuf@ghifarfood.id',phone:'0812 9704 4602'};
function readOwner(){try{return {...ownerDefaults,...JSON.parse(localStorage.getItem(ownerKey)||'{}')}}catch(error){return {...ownerDefaults}}}
function saveOwner(owner){localStorage.setItem(ownerKey,JSON.stringify(owner))}
function applyOwner(owner){
  const initials=owner.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'YR';const display=document.getElementById('ownerNameDisplay');const role=document.getElementById('ownerRoleDisplay');const avatar=document.getElementById('ownerAvatar');if(display)display.textContent=owner.name;if(role)role.textContent=`${owner.role} · ${owner.email}`;if(avatar)avatar.textContent=initials;document.querySelectorAll('.user-card strong').forEach(item=>item.textContent=owner.name);document.querySelectorAll('.user-card small').forEach(item=>item.textContent=owner.role);document.querySelectorAll('.top-avatar').forEach(item=>item.textContent=initials);const nameInput=document.getElementById('ownerNameInput');const roleInput=document.getElementById('ownerRoleInput');const emailInput=document.getElementById('ownerEmailInput');const phoneInput=document.getElementById('ownerPhoneInput');if(nameInput)nameInput.value=owner.name;if(roleInput)roleInput.value=owner.role;if(emailInput)emailInput.value=owner.email;if(phoneInput)phoneInput.value=owner.phone;
}
function readBusinessProfile(){try{return JSON.parse(localStorage.getItem(businessProfileKey)||'{}')}catch(error){return {}}}
function applyBusinessProfile(profile){Object.entries(profile).forEach(([id,value])=>{const input=document.getElementById(id);if(input&&value!==undefined)input.value=value})}
const savedBusinessProfile=readBusinessProfile();applyBusinessProfile(savedBusinessProfile);applyOwner(readOwner());
document.getElementById('editOwnerBtn')?.addEventListener('click',()=>{const panel=document.getElementById('ownerEditPanel');if(panel)panel.hidden=false;document.getElementById('ownerNameInput')?.focus()});
document.getElementById('cancelOwnerEdit')?.addEventListener('click',()=>{const panel=document.getElementById('ownerEditPanel');if(panel)panel.hidden=true;applyOwner(readOwner())});
document.getElementById('saveOwnerBtn')?.addEventListener('click',()=>{const owner={name:document.getElementById('ownerNameInput')?.value.trim()||ownerDefaults.name,role:document.getElementById('ownerRoleInput')?.value||ownerDefaults.role,email:document.getElementById('ownerEmailInput')?.value.trim()||ownerDefaults.email,phone:document.getElementById('ownerPhoneInput')?.value.trim()||ownerDefaults.phone};saveOwner(owner);applyOwner(owner);const panel=document.getElementById('ownerEditPanel');if(panel)panel.hidden=true;showToast('Data owner berhasil diperbarui')});
document.querySelector('.settings-pane[data-settings-pane="business"] .settings-save')?.addEventListener('click',()=>{const profile={businessName:document.getElementById('businessName')?.value.trim(),businessPhone:document.getElementById('businessPhone')?.value.trim(),businessAddress:document.getElementById('businessAddress')?.value.trim(),businessDescription:document.getElementById('businessDescription')?.value.trim()};localStorage.setItem(businessProfileKey,JSON.stringify(profile))});

const employeeStoreKey='ghifarFoodEmployees';let employeeEditingId=null;
const employeeShiftOptions={Pagi:['08:00','16:00'],Siang:['12:00','20:00'],Malam:['16:00','00:00'],Custom:['08:00','16:00']};
function escapeEmployee(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function readSavedEmployees(){try{return JSON.parse(localStorage.getItem(employeeStoreKey)||'[]')}catch(error){return []}}
function saveSavedEmployees(items){localStorage.setItem(employeeStoreKey,JSON.stringify(items))}
function employeeInitials(name){return name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'KR'}
function parseEmployeeHours(value){const parts=String(value||'08:00–16:00').split(/[–-]/).map(item=>item.trim());return {start:parts[0]||'08:00',end:parts[1]||'16:00'}}
function employeeRowMarkup(employee){const hours=parseEmployeeHours(employee.hours);const status=employee.status||'absent';return `<div class="employee-row attendance-row" data-custom-employee="true" data-employee="${escapeEmployee(employee.id)}" data-employee-name="${escapeEmployee(employee.name)}" data-employee-role="${escapeEmployee(employee.role)}" data-employee-email="${escapeEmployee(employee.email)}" data-employee-phone="${escapeEmployee(employee.phone)}" data-employee-hours="${escapeEmployee(`${hours.start}–${hours.end}`)}" data-shift-start="${hours.start}" data-status="${status}" data-employee-active="${employee.active!==false}"><span class="employee-avatar e5">${employeeInitials(employee.name)}</span><div><strong>${escapeEmployee(employee.name)}</strong><small>${escapeEmployee(employee.role)} · ${escapeEmployee(employee.shift||'Shift pagi')}</small></div><span class="shift-time">${escapeEmployee(`${hours.start}–${hours.end}`)}</span><span class="time-cell time-in muted">—</span><span class="time-cell time-out muted">—</span><span class="attendance ${status==='late'?'late':status==='present'?'present':'absent'} status-update">${status==='late'?'● Terlambat':status==='present'?'● Tepat waktu':'● Belum masuk'}</span><span class="duration">—</span><button class="attendance-action" data-action="clock-in">Absen masuk</button></div>`}
function hydrateEmployeeRow(row){if(!row.dataset.employeeName)row.dataset.employeeName=row.querySelector('strong')?.textContent.trim()||'Karyawan';if(!row.dataset.employeeRole)row.dataset.employeeRole=(row.querySelector('small')?.textContent||'Karyawan').split('·')[0].trim();if(!row.dataset.employeeHours)row.dataset.employeeHours=row.querySelector('.shift-time')?.textContent.trim()||'08:00–16:00';if(!row.dataset.employeeEmail)row.dataset.employeeEmail='';if(!row.dataset.employeePhone)row.dataset.employeePhone=''}
function ensureEmployeeRowActions(row){const attendance=row.querySelector('.attendance-action');if(!attendance||attendance.parentElement?.classList.contains('employee-actions'))return;const actions=document.createElement('div');actions.className='employee-actions';attendance.replaceWith(actions);actions.appendChild(attendance);actions.insertAdjacentHTML('beforeend',`<button class="employee-action edit" type="button" data-employee-action="edit">Edit</button><button class="employee-action remove" type="button" data-employee-action="remove">Hapus</button>`)}
function customAttendanceHandler(row){row.querySelector('.attendance-action')?.addEventListener('click',()=>{const button=row.querySelector('.attendance-action');const action=button.dataset.action;if(action==='complete')return;const now=currentTime();if(action==='clock-in'){const start=timeToMinutes(row.dataset.shiftStart);const actual=timeToMinutes(now);const delay=Math.max(0,(actual??0)-(start??0));row.querySelector('.time-in').textContent=now;row.querySelector('.time-in').classList.remove('muted');row.dataset.delay=String(delay);setAttendanceStatus(row,delay>0?'late':'present',delay);showToast(delay>0?`Absen masuk tercatat — telat ${delay} menit`:'Absen masuk tercatat tepat waktu')}else if(action==='clock-out'){const entry=timeToMinutes(row.querySelector('.time-in').textContent.trim());const exit=timeToMinutes(now);let duration=exit-entry;if(duration<0)duration+=1440;row.querySelector('.time-out').textContent=now;row.querySelector('.time-out').classList.remove('muted');row.querySelector('.duration').textContent=minutesToDuration(duration);showToast('Absen pulang tercatat')}updateAttendanceButton(row);updateAttendanceSummary();saveAttendance()})}
function employeeFromRow(row){return {id:row.dataset.employee,name:row.dataset.employeeName||row.querySelector('strong')?.textContent.trim()||'Karyawan',role:row.dataset.employeeRole||'Karyawan',email:row.dataset.employeeEmail||'',phone:row.dataset.employeePhone||'',shift:(row.querySelector('small')?.textContent||'Shift pagi').split('·')[1]?.trim()||'Shift pagi',hours:row.dataset.employeeHours||'08:00–16:00',active:row.dataset.employeeActive!=='false',status:row.dataset.status||'absent'}}
function renderEmployeeRow(row,employee){const hours=parseEmployeeHours(employee.hours);row.dataset.employeeName=employee.name;row.dataset.employeeRole=employee.role;row.dataset.employeeEmail=employee.email||'';row.dataset.employeePhone=employee.phone||'';row.dataset.employeeHours=`${hours.start}–${hours.end}`;row.dataset.shiftStart=hours.start;row.dataset.employeeActive=String(employee.active!==false);row.querySelector('.employee-avatar').textContent=employeeInitials(employee.name);row.querySelector('strong').textContent=employee.name;row.querySelector('small').textContent=`${employee.role} · ${employee.shift||'Shift pagi'}`;row.querySelector('.shift-time').textContent=`${hours.start}–${hours.end}`;row.classList.toggle('employee-disabled',employee.active===false);updateAttendanceButton(row)}
function filterEmployeeRows(forcedStatus){const query=(document.getElementById('employeeSearch')?.value||'').toLowerCase();const role=document.getElementById('employeeRoleFilter')?.value||'all';const status=forcedStatus||document.querySelector('[data-attendance-filter].active')?.dataset.attendanceFilter||'all';attendanceRows.forEach(row=>{hydrateEmployeeRow(row);const matchesText=`${row.dataset.employeeName} ${row.dataset.employeeRole} ${row.dataset.employeeEmail}`.toLowerCase().includes(query);const matchesRole=role==='all'||row.dataset.employeeRole.toLowerCase()===role.toLowerCase();const matchesStatus=status==='all'||row.dataset.status===status;row.classList.toggle('is-hidden',!(matchesText&&matchesRole&&matchesStatus))})}
function resetEmployeeForm(){employeeEditingId=null;const modal=document.getElementById('employeeModal');if(!modal)return;modal.querySelector('h2').textContent='Tambah karyawan';modal.querySelector('.form-muted').textContent='Simpan data karyawan langsung ke daftar tim Ghifar Food.';const save=modal.querySelector('.primary-btn.full');if(save)save.textContent='Simpan karyawan';const name=document.getElementById('employeeNameInput');const role=document.getElementById('employeeRoleInput');const email=document.getElementById('employeeEmailInput');const phone=document.getElementById('employeePhoneInput');const shift=document.getElementById('employeeShiftInput');const hours=document.getElementById('employeeHoursInput');const active=document.getElementById('employeeActiveInput');if(name)name.value='';if(role)role.value='Kasir';if(email)email.value='';if(phone)phone.value='';if(shift)shift.value='Pagi';if(hours)hours.value='08:00–16:00';if(active)active.value='Aktif'}
function openEmployeeEdit(row){const employee=employeeFromRow(row);employeeEditingId=employee.id;const modal=document.getElementById('employeeModal');modal.querySelector('h2').textContent='Edit karyawan';modal.querySelector('.form-muted').textContent='Perbarui data, role, shift, atau status karyawan.';const save=modal.querySelector('.primary-btn.full');if(save)save.textContent='Simpan perubahan';document.getElementById('employeeNameInput').value=employee.name;document.getElementById('employeeRoleInput').value=employee.role;document.getElementById('employeeEmailInput').value=employee.email;document.getElementById('employeePhoneInput').value=employee.phone;document.getElementById('employeeShiftInput').value=employee.shift?.replace('Shift ','')||'Pagi';document.getElementById('employeeHoursInput').value=employee.hours;document.getElementById('employeeActiveInput').value=employee.active?'Aktif':'Nonaktif';openModal('employeeModal')}
const employeeModalEl=document.getElementById('employeeModal');
if(employeeModalEl){const inputs=employeeModalEl.querySelectorAll('.form-grid input');const role=employeeModalEl.querySelector('.form-grid select');if(inputs[0])inputs[0].id='employeeNameInput';if(inputs[1])inputs[1].id='employeeEmailInput';if(inputs[2])inputs[2].id='employeePhoneInput';if(role)role.id='employeeRoleInput';const grid=employeeModalEl.querySelector('.form-grid');grid.insertAdjacentHTML('beforeend','<label>Shift<select id="employeeShiftInput"><option>Pagi</option><option>Siang</option><option>Malam</option><option>Custom</option></select></label><label>Jam kerja<input id="employeeHoursInput" value="08:00–16:00" placeholder="Contoh: 08:00–16:00"></label><label>Status<select id="employeeActiveInput"><option>Aktif</option><option>Nonaktif</option></select></label>');document.querySelectorAll('[data-open-modal="employeeModal"]').forEach(button=>button.addEventListener('click',resetEmployeeForm));const saveButton=employeeModalEl.querySelector('.primary-btn.full');if(saveButton){saveButton.id='saveEmployeeBtn';saveButton.addEventListener('click',()=>{const name=document.getElementById('employeeNameInput').value.trim();if(!name){showToast('Nama karyawan wajib diisi');return}const shift=document.getElementById('employeeShiftInput').value;const hours=document.getElementById('employeeHoursInput').value.trim()||employeeShiftOptions[shift]?.join('–')||'08:00–16:00';const employee={id:employeeEditingId||`employee-${Date.now()}`,name,role:document.getElementById('employeeRoleInput').value,email:document.getElementById('employeeEmailInput').value.trim(),phone:document.getElementById('employeePhoneInput').value.trim(),shift:`Shift ${shift.toLowerCase()}`,hours,active:document.getElementById('employeeActiveInput').value==='Aktif'};const saved=readSavedEmployees();const index=saved.findIndex(item=>item.id===employee.id);if(index>=0)saved[index]=employee;else saved.push(employee);saveSavedEmployees(saved);let row=document.querySelector(`[data-employee="${employee.id}"]`);if(row){renderEmployeeRow(row,employee)}else{document.querySelector('.attendance-grid')?.insertAdjacentHTML('beforeend',employeeRowMarkup(employee));row=document.querySelector(`[data-employee="${employee.id}"]`);if(row){hydrateEmployeeRow(row);ensureEmployeeRowActions(row);customAttendanceHandler(row)}}attendanceRows=[...document.querySelectorAll('.attendance-row')];attendanceRows.forEach(hydrateEmployeeRow);updateAttendanceSummary();filterEmployeeRows();closeModal();showToast(employeeEditingId?'Data karyawan berhasil diperbarui':'Karyawan berhasil ditambahkan ke daftar')})}}
function loadSavedEmployees(){const grid=document.querySelector('.attendance-grid');readSavedEmployees().forEach(employee=>{if(!document.querySelector(`[data-employee="${employee.id}"]`))grid?.insertAdjacentHTML('beforeend',employeeRowMarkup(employee))});attendanceRows=[...document.querySelectorAll('.attendance-row')];attendanceRows.forEach(row=>{hydrateEmployeeRow(row);ensureEmployeeRowActions(row);if(row.dataset.customEmployee==='true')customAttendanceHandler(row)});restoreAttendance();filterEmployeeRows()}
function setupEmployeeToolbar(){const panel=document.querySelector('#view-employees .panel');const heading=panel?.querySelector('.panel-heading');if(!heading||document.getElementById('employeeSearch'))return;heading.insertAdjacentHTML('afterend','<div class="employee-toolbar"><div class="search-box"><span>⌕</span><input id="employeeSearch" placeholder="Cari nama, role, email..."></div><select class="select-control" id="employeeRoleFilter"><option value="all">Semua role</option><option value="Kasir">Kasir</option><option value="Kitchen">Kitchen</option><option value="Service">Service</option><option value="Manager">Manager</option></select><button class="outline-btn" type="button" id="exportEmployeesBtn">⇩ Export data</button></div>');document.getElementById('employeeSearch')?.addEventListener('input',()=>filterEmployeeRows());document.getElementById('employeeRoleFilter')?.addEventListener('change',()=>filterEmployeeRows());document.getElementById('exportEmployeesBtn')?.addEventListener('click',()=>{const rows=attendanceRows.map(employeeFromRow);const csv=[['Nama','Role','Email','WhatsApp','Shift','Jam kerja','Status'],...rows.map(item=>[item.name,item.role,item.email,item.phone,item.shift,item.hours,item.active?'Aktif':'Nonaktif'])].map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(',')).join('\n');const blob=new Blob([`\ufeff${csv}`],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='data-karyawan-ghifar-food.csv';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);showToast('Data karyawan berhasil diekspor')})}
document.querySelector('.attendance-grid')?.addEventListener('click',event=>{const button=event.target.closest('[data-employee-action]');if(!button)return;const row=button.closest('.attendance-row');if(!row)return;const action=button.dataset.employeeAction;if(action==='edit'){openEmployeeEdit(row);return}if(action==='remove'){if(row.dataset.customEmployee!=='true'){showToast('Karyawan demo utama tetap dipertahankan, tetapi bisa diedit');return}if(!window.confirm(`Hapus ${row.dataset.employeeName||'karyawan'} dari daftar?`))return;saveSavedEmployees(readSavedEmployees().filter(item=>item.id!==row.dataset.employee));row.remove();attendanceRows=[...document.querySelectorAll('.attendance-row')];saveAttendance();updateAttendanceSummary();filterEmployeeRows();showToast('Karyawan berhasil dihapus')}});
loadSavedEmployees();setupEmployeeToolbar();

const style=document.createElement('style');style.textContent=`.toast{position:fixed;right:24px;bottom:24px;background:#17243b;color:#fff;padding:12px 16px;border-radius:10px;box-shadow:0 10px 30px #12203b30;display:flex;gap:9px;align-items:center;font-size:12px;z-index:50;transform:translateY(18px);opacity:0;transition:.25s}.toast.show{transform:translateY(0);opacity:1}.toast span{display:grid;place-items:center;background:#20b67a;width:18px;height:18px;border-radius:50%;font-size:11px}`;document.head.appendChild(style);
