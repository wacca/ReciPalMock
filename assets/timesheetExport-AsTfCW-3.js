import{F as e,o as t}from"./Stack-Tzgstd5M.js";import{Cn as n,Sn as r,Yt as i,Zt as a,i as o,kn as s,wn as c}from"./index-CKRAoEz4.js";var l=t((0,e().jsx)(`path`,{d:`M19 7H9c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2m0 3c0 .55-.45 1-1 1h-8c-.55 0-1-.45-1-1s.45-1 1-1h8c.55 0 1 .45 1 1m-6 5v-2h2v2zm2 2v2h-2v-2zm-4-2H9v-2h2zm6-2h2v2h-2zm-8 4h2v2H9zm8 2v-2h2v2zM6 17H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v1h-2V5H5v10h1z`}),`TableViewRounded`),u=e=>{let t=o(e);return t?t.name:null},d=e=>Number.isFinite(e)?e:``,f=e=>Number.isFinite(e)?i(e):``,p=e=>e?new Date(e).toLocaleString():``,m=(e,t,n)=>{let r=String(e.id||``).split(`@`)[0].replace(/[^\w.-]/g,``);return`timesheet-${r?`${r}-`:``}${t}-${a(n)}`},h=[{label:`社員ID`,value:e=>e.profile.id},{label:`氏名`,value:e=>e.profile.name},{label:`部署`,value:e=>e.profile.department},{label:`日付`,value:e=>e.dateKey},{label:`曜日`,value:e=>e.weekday},{label:`祝日`,value:e=>e.holidayName},{label:`区分`,value:e=>e.entry.type},{label:`出社`,value:e=>e.entry.clockIn},{label:`退社`,value:e=>e.entry.clockOut},{label:`基本(分)`,value:e=>d(e.calc.basic)},{label:`早出残業(分)`,value:e=>d(e.calc.earlyOvertime)},{label:`早朝深夜(分)`,value:e=>d(e.calc.night)},{label:`合計(分)`,value:e=>d(e.calc.total)},{label:`備考`,value:e=>e.entry.note}],g=e=>e.flatMap(({profile:e,rows:t})=>t.map(t=>({...t,profile:e}))),_=({profile:e,year:t,month:i,rows:a})=>{let o=`${m(e,t,i)}-${c()}.csv`;return n(r(g([{profile:e,rows:a}]),h),o),o},v=({items:e,year:t,month:i})=>{let o=`attendance-book-${t}-${a(i)}-${c()}.csv`;return n(r(g(e),h),o),o},y={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`},b=e=>String(e??``).replace(/[&<>"']/g,e=>y[e]),x=`
@page { size: A4 portrait; margin: 12mm 10mm; }
* { box-sizing: border-box; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
    margin: 0; color: #1b1b1f; font-size: 9pt; line-height: 1.35;
    font-family: "Yu Gothic", YuGothic, "Hiragino Kaku Gothic ProN", "Noto Sans JP", Meiryo, sans-serif;
}
h1 { font-size: 15pt; margin: 0; letter-spacing: .04em; }
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 8mm; margin-bottom: 3mm; }
.head .period { font-size: 12pt; font-weight: 700; margin-top: 1mm; }
.head .meta { text-align: right; font-size: 8pt; color: #55585f; white-space: nowrap; }
.info, .totals { display: flex; flex-wrap: wrap; gap: 0 6mm; margin-bottom: 3mm; }
.info div, .totals div { font-size: 8.5pt; }
.info .label, .totals .label { color: #55585f; margin-right: 1.5mm; }
.totals { border: .4pt solid #b9bcc4; border-radius: 1mm; padding: 2mm 3mm; background: #f7f8fa; }
.remarks { border: .4pt solid #d9a900; background: #fdf7e3; padding: 2mm 3mm; margin-bottom: 3mm; font-size: 8.5pt; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
th, td { border: .4pt solid #b9bcc4; padding: .8mm 1.2mm; }
thead th { background: #eef0f4; font-weight: 700; text-align: center; }
tr { break-inside: avoid; }
/* 曜（「月・祝」等）は折り返すと行高が崩れるので固定 1 行 */
td.day, td.wd { text-align: center; white-space: nowrap; }
td.num { text-align: right; font-variant-numeric: tabular-nums; }
td.note { font-size: 8pt; }
tr.sun td { background: #fdeef0; }
tr.sat td { background: #eef2fd; }
tr.sum td { background: #eef0f4; font-weight: 700; }
.foot { margin-top: 3mm; font-size: 7.5pt; color: #7a7d85; display: flex; justify-content: space-between; }
/* 出勤簿は 1 名 1 ページ。最後の 1 枚だけ余分な白紙が出ないように改ページを外す */
.sheet { break-after: page; page-break-after: always; }
.sheet:last-child { break-after: auto; page-break-after: auto; }
`,S=(e,t)=>t?`<div><span class="label">${b(e)}</span><b>${b(t)}</b></div>`:``,C=(e,t)=>`<div><span class="label">${b(e)}</span><b>${b(t)}</b></div>`,w=e=>{let t=e.isHoliday||e.isSunday?`sun`:e.isSaturday?`sat`:``,n=e.holidayName?`${e.weekday}・祝`:e.weekday,r=e.holidayName&&!e.entry.note?e.holidayName:e.entry.note;return`<tr class="${t}"><td class="day">${e.day}</td><td class="wd">${b(n)}</td><td>${b(e.entry.type)}</td><td class="num">${b(e.entry.clockIn)}</td><td class="num">${b(e.entry.clockOut)}</td><td class="num">${f(e.calc.basic)}</td><td class="num">${f(e.calc.earlyOvertime)}</td><td class="num">${f(e.calc.night)}</td><td class="num">${f(e.calc.total)}</td><td class="note">${b(r)}</td></tr>`},T=({profile:e,year:t,month:n,rows:r,summary:a,record:o={}})=>`<section class="sheet">
<div class="head">
    <div>
        <h1>月次タイムシート</h1>
        <div class="period">${t}年${n}月</div>
    </div>
    <div class="meta">出力日時: ${b(new Date().toLocaleString())}</div>
</div>
<div class="info">
    ${S(`氏名`,e.name)}
    ${S(`社員ID`,e.id)}
    ${S(`部署`,e.department)}
    ${S(`役職`,e.position)}
    ${S(`承認状態`,o.approvalStatus?s(o.approvalStatus):`未作成`)}
    ${S(`申請日時`,p(o.submittedAt))}
    ${S(`承認者`,o.approvedBy)}
    ${S(`承認日時`,p(o.approvedAt))}
    ${o.closingStatus===`closed`?`<div><b>締め済</b></div>`:``}
</div>
${o.remarks?`<div class="remarks"><b>承認者備考</b>: ${b(o.remarks)}</div>`:``}
<div class="totals">
    ${C(`出勤`,`${a.workDays}日`)}
    ${C(`欠勤`,`${a.absenceDays}日`)}
    ${C(`有休`,`${a.paidLeaveDays}日`)}
    ${C(`振替休日`,`${a.substituteLeaveDays}日`)}
    ${C(`総就業`,i(a.totalWork))}
    ${C(`所定`,i(a.expected))}
    ${C(`差分`,`${a.diff>=0?`+`:``}${i(a.diff)}`)}
    ${C(`早出/残業`,i(a.earlyOvertime))}
    ${C(`早朝/深夜`,i(a.night))}
</div>
<table>
    <thead><tr>
        <th style="width:8mm">日</th>
        <th style="width:15mm">曜</th>
        <th style="width:18mm">区分</th>
        <th style="width:14mm">出社</th>
        <th style="width:14mm">退社</th>
        <th style="width:14mm">基本</th>
        <th style="width:18mm">早出/残業</th>
        <th style="width:18mm">早朝/深夜</th>
        <th style="width:14mm">合計</th>
        <th>備考</th>
    </tr></thead>
    <tbody>
        ${r.map(w).join(`
        `)}
        <tr class="sum">
            <td class="wd" colspan="5">月計</td>
            <td class="num">${i(a.basic)}</td>
            <td class="num">${i(a.earlyOvertime)}</td>
            <td class="num">${i(a.night)}</td>
            <td class="num">${i(a.totalWork)}</td>
            <td></td>
        </tr>
    </tbody>
</table>
<div class="foot"><span>${b(e.name)} / ${t}年${n}月</span><span>Recrova</span></div>
</section>`,E=(e,t)=>`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>${b(e)}</title><style>${x}</style></head>
<body>
${t.join(`
`)}
</body></html>`,D=e=>E(`月次タイムシート_${e.year}年${a(e.month)}月_${e.profile.name}`,[T(e)]),O=({items:e,year:t,month:n})=>E(`出勤簿_${t}年${a(n)}月`,e.map(e=>T({...e,year:t,month:n}))),k=e=>{let t=document.createElement(`iframe`);t.setAttribute(`aria-hidden`,`true`),t.title=`印刷プレビュー`,t.style.cssText=`position:fixed;right:0;bottom:0;width:0;height:0;border:0;`,t.srcdoc=e,t.onload=()=>{let e=t.contentWindow;if(!e){t.remove();return}let n=!1,r=()=>{n||(n=!0,window.setTimeout(()=>t.remove(),0))};e.addEventListener(`afterprint`,r,{once:!0}),window.setTimeout(r,6e4),e.focus(),e.print()},document.body.appendChild(t)},A=e=>{k(D(e))},j=e=>{k(O(e))};export{u as a,A as i,j as n,l as o,_ as r,v as t};