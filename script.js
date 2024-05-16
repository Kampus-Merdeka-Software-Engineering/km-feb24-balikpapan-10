function showSidebar(){
  const sidebar = document.querySelector('.sidebar')
  sidebar.style.display = 'flex'
}

function hideSidebar(){
  const sidebar = document.querySelector('.sidebar')
  sidebar.style.display = 'none'
}

const dropdown = document.querySelector('.dropdown');
dropdown.addEventListener('click', () => {
dropdown.classList.toggle('active');
}); // Tambahkan penutup kurung kurawal dan penutup titik koma

const title = document.querySelector('.title');
const b2 = document.querySelector('.b2');
const m1 = document.querySelector('.m1');
const m2 = document.querySelector('.m2');

document.addEventListener('scroll', function() {
  let value = window.scrollY;
  // console.log(value)
  title.style.marginTop = value * 1.1 + 'px';
  b2.style.marginBottom = -value + 'px';
  m1.style.marginBottom = -value * 1.1 + 'px';
  m2.style.marginBottom = -value * 1.3 + 'px';
}); // Tambahkan penutup kurung kurawal dan penutup titik koma
document.addEventListener("DOMContentLoaded", function() {
  let input = document.getElementById('litepicker');
  let now = new Date();
  let picker = new Litepicker({
    element: input,
    format: 'DD MMM YYYY',
    singleMode: false,
    numberOfMonths: 2,
    numberOfColumns: 2,
    showTooltip: true,
    scrollToDate: true,
    startDate: new Date(now).setDate(now.getDate() - 1),
    endDate: new Date(now),
    setup: function(picker) {
      picker.on('selected', function(date1, date2) {
        console.log(`${date1.toDateString()}, ${date2.toDateString()}`);
      });
    }
  });
});

async function main() {
  const response = await fetch("data.json");
  const data = await response.json();

  console.log(data.data[1].customer);
}

main();

const totalMonthlySalesCtx = document.getElementById("totalMonthlySales");

const totalMonthlySalesLabel = [
  "Sep 2016",
  "Oct 2016",
  "Nov 2016",
  "Dec 2016",
  "Jan 2017",
  "Feb 2017",
  "Mar 2017",
];

new Chart(totalMonthlySalesCtx, {
  type: "line",
  data: {
    labels: totalMonthlySalesLabel,
    datasets: [
      {
        label: "Bronx",
        data: [12, 19, 3, 5, 2, 3, 10],
        fill: false,
        borderColor: "hsl(24.6 95% 53.1%)",
        backgroundColor: "hsl(24.6 95% 53.1%)",
        tension: 0.3,
      },
      {
        label: "Manhattan",
        data: [9, 8, 5, 10, 3, 15, 2],
        fill: false,
        borderColor: "hsla(180, 40%, 65%, 1)",
        backgroundColor: "hsla(180, 40%, 65%, 1)",
        tension: 0.3,
      },
    ],
  },
  options: {
    aspectRatio: 10 / 4,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

const propertyTypeSalesCtx = document.getElementById("propertyTypeSales");

new Chart(propertyTypeSalesCtx, {
  type: "bar",
  data: {
    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    datasets: [
      {
        label: "Residential Units",
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: "hsl(24.6 95% 53.1%)",
      },
      {
        label: "Commercial Units",
        data: [1, 8, 5, 10, 3, 15, 2],
        backgroundColor: "hsla(180, 60%, 65%, 1)",
      },
    ],
  },
  options: {
    aspectRatio: 10 / 4,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});