
function fmt(n){ return n.toLocaleString('ko-KR'); }

// Progressive tax calc (quick deduction style)
const BRACKETS_2025 = [
  {limit: 14000000, rate: 0.06, quick: 0},
  {limit: 50000000, rate: 0.15, quick: 1260000},
  {limit: 88000000, rate: 0.24, quick: 5760000},
  {limit: 150000000, rate: 0.35, quick: 15440000},
  {limit: 300000000, rate: 0.38, quick: 19900000},
  {limit: 500000000, rate: 0.40, quick: 25900000},
  {limit: 1000000000, rate: 0.42, quick: 33900000},
  {limit: Infinity, rate: 0.45, quick: 60900000},
];
function marginalTax(income){
  for (let b of BRACKETS_2025){
    if (income <= b.limit) return Math.max(0, income*b.rate - b.quick);
  }
  return 0;
}

function calcNet({annual=50000000, bonusMonths=0, taxableRatio=0.80,
  npRate=4.5, hiRate=3.545, ltcRate=12.95, eiRate=0.9, localTaxRate=10}){

  npRate/=100; hiRate/=100; ltcRate/=100; eiRate/=100; localTaxRate/=100;
  const monthlyGross = annual/12;
  const totalAnnualGross = monthlyGross*(12+bonusMonths);

  const npMonthly = monthlyGross*npRate;
  const hiMonthly = monthlyGross*hiRate;
  const ltcMonthly = hiMonthly*ltcRate;
  const eiMonthly = monthlyGross*eiRate;
  const socialMonthly = npMonthly+hiMonthly+ltcMonthly+eiMonthly;
  const socialAnnual = socialMonthly*12;

  const taxableAnnualBase = Math.max(0, (totalAnnualGross - socialAnnual) * taxableRatio);
  const incomeTaxAnnual = marginalTax(taxableAnnualBase);
  const localIncomeTaxAnnual = incomeTaxAnnual*localTaxRate;
  const totalTaxAnnual = incomeTaxAnnual + localIncomeTaxAnnual;

  const annualTakeHome = totalAnnualGross - socialAnnual - totalTaxAnnual;
  const monthlyTakeHome = annualTakeHome/12;

  return {
    monthlyGross, totalAnnualGross, socialMonthly, socialAnnual,
    totalTaxAnnual, annualTakeHome, monthlyTakeHome,
    breakdown:{
      npMonthly, hiMonthly, ltcMonthly, eiMonthly, monthlyTax: totalTaxAnnual/12
    }
  };
}

// Index page behavior (if present)
(function(){
  const annualEl = document.getElementById('annualSalary');
  if (!annualEl) return; // not on index

  function calc(){
    const payload = {
      annual: Number(document.getElementById('annualSalary').value||0),
      bonusMonths: Number(document.getElementById('bonusMonths').value||0),
      taxableRatio: Number(document.getElementById('taxableRatio').value||0.8),
      npRate: Number(document.getElementById('npRate').value||4.5),
      hiRate: Number(document.getElementById('hiRate').value||3.545),
      ltcRate: Number(document.getElementById('ltcRate').value||12.95),
      eiRate: Number(document.getElementById('eiRate').value||0.9),
      localTaxRate: Number(document.getElementById('localTaxRate').value||10),
    };
    const r = calcNet(payload);
    document.getElementById('summary').innerHTML = `
      <div class="pill"><b>연봉(총액)</b><span>${fmt(Math.round(r.totalAnnualGross))} 원</span></div>
      <div class="pill"><b>연간 4대보험</b><span>${fmt(Math.round(r.socialAnnual))} 원</span></div>
      <div class="pill"><b>연간 세금</b><span>${fmt(Math.round(r.totalTaxAnnual))} 원</span></div>
      <div class="pill"><b>연간 실수령액</b><span style="color:var(--ok)">${fmt(Math.round(r.annualTakeHome))} 원</span></div>
      <div class="pill"><b>월 실수령액(평균)</b><span style="color:var(--ok)">${fmt(Math.round(r.monthlyTakeHome))} 원</span></div>
    `;
    const d = r.breakdown;
    document.getElementById('breakdown').innerHTML = `
      <table class="table">
        <thead><tr><th>항목</th><th>월(원)</th><th>연(원)</th></tr></thead>
        <tbody>
          <tr><td>총지급(기본 월급 기준)</td><td>${fmt(Math.round(r.monthlyGross))}</td><td>${fmt(Math.round(r.totalAnnualGross))}</td></tr>
          <tr><td>국민연금</td><td>${fmt(Math.round(d.npMonthly))}</td><td>${fmt(Math.round(d.npMonthly*12))}</td></tr>
          <tr><td>건강보험</td><td>${fmt(Math.round(d.hiMonthly))}</td><td>${fmt(Math.round(d.hiMonthly*12))}</td></tr>
          <tr><td>장기요양</td><td>${fmt(Math.round(d.ltcMonthly))}</td><td>${fmt(Math.round(d.ltcMonthly*12))}</td></tr>
          <tr><td>고용보험</td><td>${fmt(Math.round(d.eiMonthly))}</td><td>${fmt(Math.round(d.eiMonthly*12))}</td></tr>
          <tr><td><b>4대보험 합계</b></td><td><b>${fmt(Math.round(r.socialMonthly))}</b></td><td><b>${fmt(Math.round(r.socialAnnual))}</b></td></tr>
          <tr><td>소득세(추정) + 지방소득세</td><td>${fmt(Math.round(d.monthlyTax))}</td><td>${fmt(Math.round(d.monthlyTax*12))}</td></tr>
          <tr><td><b>실수령액</b></td><td><b style="color:var(--ok)">${fmt(Math.round(r.monthlyTakeHome))}</b></td><td><b style="color:var(--ok)">${fmt(Math.round(r.annualTakeHome))}</b></td></tr>
        </tbody>
      </table>
    `;
  }
  function resetDefaults(){
    document.getElementById('annualSalary').value = 50000000;
    document.getElementById('bonusMonths').value = 0;
    document.getElementById('taxableRatio').value = 0.80;
    document.getElementById('npRate').value = 4.5;
    document.getElementById('hiRate').value = 3.545;
    document.getElementById('ltcRate').value = 12.95;
    document.getElementById('eiRate').value = 0.9;
    document.getElementById('localTaxRate').value = 10;
    calc();
  }
  document.getElementById('calcBtn').addEventListener('click', calc);
  document.getElementById('resetBtn').addEventListener('click', resetDefaults);
  window.addEventListener('DOMContentLoaded', calc);
})();

// Salary table page behavior
(function(){
  const tableEl = document.getElementById('salaryTableBody');
  if (!tableEl) return;
  const inputAnnuals = [30000000, 35000000, 40000000, 45000000, 50000000, 55000000, 60000000, 70000000, 80000000, 100000000];
  for (let ann of inputAnnuals){
    const r = calcNet({annual: ann});
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${fmt(ann)}</td>
      <td>${fmt(Math.round(r.monthlyTakeHome))}</td>
      <td>${fmt(Math.round(r.annualTakeHome))}</td>`;
    tableEl.appendChild(tr);
  }
})();

// Job board filter (simple client-side demo)
(function(){
  const q = document.getElementById('jobQuery');
  if (!q) return;
  q.addEventListener('input', () => {
    const term = q.value.toLowerCase();
    for (const card of document.querySelectorAll('.job-card')){
      const hay = card.textContent.toLowerCase();
      card.style.display = hay.includes(term) ? '' : 'none';
    }
  });
})();
