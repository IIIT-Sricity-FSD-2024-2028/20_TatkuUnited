document.getElementById("logout-btn").addEventListener("click", () => {
  Auth.logout();
});

// Bar chart data
const chartData = [
  { label: 'Mon', earnings: 65, fees: 15 },
  { label: 'Tue', earnings: 82, fees: 20 },
  { label: 'Wed', earnings: 74, fees: 18 },
  { label: 'Thu', earnings: 95, fees: 25 },
  { label: 'Fri', earnings: 110, fees: 28 },
  { label: 'Sat', earnings: 88, fees: 22 },
  { label: 'Sun', earnings: 70, fees: 17 },
];

const maxVal = Math.max(...chartData.map(d => d.earnings));
const container = document.getElementById('barChart');

chartData.forEach(d => {
  const group = document.createElement('div');
  group.className = 'bar-group';

  const earBar = document.createElement('div');
  earBar.className = 'bar earnings';
  earBar.style.height = `${(d.earnings / maxVal) * 100}%`;
  earBar.title = `Earnings: ₹${d.earnings * 100}`;

  const feeBar = document.createElement('div');
  feeBar.className = 'bar fees';
  feeBar.style.height = `${(d.fees / maxVal) * 100}%`;
  feeBar.title = `Fees: ₹${d.fees * 100}`;

  const label = document.createElement('span');
  label.className = 'bar-label';
  label.textContent = d.label;

  group.append(earBar, feeBar, label);
  container.appendChild(group);
});
