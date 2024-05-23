function showSidebar(){
  const sidebar = document.querySelector('.sidebar');
  sidebar.style.display = 'flex';
}

function hideSidebar(){
  const sidebar = document.querySelector('.sidebar');
  sidebar.style.display = 'none';
}

const dropdown = document.querySelector('.dropdown');
dropdown.addEventListener('click', () => {
  dropdown.classList.toggle('active');
}); // Added closing bracket and semicolon

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
}); // Added closing bracket and semicolon

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

async function fetchData() {
  const response = await fetch(
    "https://raw.githubusercontent.com/rdsarjito/nyc_dataset/main/nyc_dataset.json"
  );
  const data = await response.json();
  return data;
}

function sum(data, key) {
  return data.reduce((acc, curr) => acc + curr[key], 0);
}

function range(start, end) {
  return Array.from({ length: end - start }, (_, i) => start + 1 + i);
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function createFilter(data, startDate, endDate) {
  const uniqueBorough = Array.from(new Set(data.map((item) => item.BOROUGH)));

  const filteredData = data
    .map((item) => {
      const [date, month, year] = item["SALE DATE"]
        .split("/")
        .map((val) => Number(val));

      const convertedDate = new Date(year, month - 1, date);

      const newItem = {
        ...item,
        date: convertedDate,
        dateValue: { date, month: month - 1, year },
      };
      return newItem;
    })
    .filter((item) => {
      return item.date >= startDate && item.date <= endDate;
    });

  function getMonthlySales() {
    const scale = d3
      .scaleUtc()
      .domain([startDate, endDate])
      .ticks(d3.utcMonth.every(1));

    const formattedScale = scale.map((date) => {
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    });

    const monthlySales = uniqueBorough.map((borough) => {
      const sales = scale.map((date) => {
        const month = date.getMonth();
        const year = date.getFullYear();

        const isOnMonthRange = (data) =>
          data.dateValue.month === month && data.dateValue.year === year;

        const data = filteredData.filter(
          (data) => data.BOROUGH === borough && isOnMonthRange(data)
        );

        const salesTotal = sum(data, "SALE PRICE");

        return salesTotal;
      });

      return {
        borough,
        sales,
      };
    });

    return { data: monthlySales, scales: formattedScale };
  }

  return {
    getMonthlySales,
    data: filteredData,
  };
}

(async function main() {
  const chart = await fetchData();
  const startDate = new Date("2016-09-01");
  const endDate = new Date("2017-08-31");
  const filter = createFilter(chart, startDate, endDate);

  console.log(filter.getMonthlySales());

  createMonthlySaleChart(filter);
})();

function createMonthlySaleChart(filter) {
  const color = [
    "hsl(24.6 95% 53.1%)",
    "hsla(180, 40%, 65%, 1)",
    "#63C7B2",
    "#3F612D",
    "#18206F",
  ];

  const totalMonthlySalesCtx = document.getElementById("totalMonthlySales");
  const scale = filter.getMonthlySales().scales;
  const datasets = filter.getMonthlySales().data.map((item, i) => ({
    label: item.borough,
    data: item.sales,
    fill: false,
    borderColor: color[i % color.length],
    backgroundColor: color[i % color.length],
    tension: 0.3,
  }));

  new Chart(totalMonthlySalesCtx, {
    type: "line",
    data: {
      labels: scale,
      datasets: datasets,
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
}
