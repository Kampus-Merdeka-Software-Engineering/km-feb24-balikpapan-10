// Sidebar Toggle Functions
function showSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.style.display = 'flex';
}

function hideSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.style.display = 'none';
}

// Dropdown Toggle
const dropdown = document.querySelector('.dropdown');
dropdown.addEventListener('click', () => {
  dropdown.classList.toggle('active');
});

// Scroll Effects
const title = document.querySelector('.title');
const b2 = document.querySelector('.b2');
const m1 = document.querySelector('.m1');
const m2 = document.querySelector('.m2');

document.addEventListener('scroll', function() {
  let value = window.scrollY;
  title.style.marginTop = value * 1.1 + 'px';
  b2.style.marginBottom = -value + 'px';
  m1.style.marginBottom = -value * 1.1 + 'px';
  m2.style.marginBottom = -value * 1.3 + 'px';
});

// Date Picker Initialization
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

// Data Fetching Function
async function fetchData() {
  const response = await fetch("https://raw.githubusercontent.com/wulannw/NYCdataset/main/NYCTeam10.json");
  const data = await response.json();
  return data.Sheet1;
}

// Helper Function to Sum Data
function sum(data, key) {
  return data.reduce((acc, curr) => acc + Number(curr[key]), 0);
}

// Month Names for Formatting
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Data Filtering and Processing Functions
function createFilter(data, startDate, endDate) {
  const uniqueBorough = Array.from(new Set(data.map(item => item["BOROUGH NAME"])));

  const filteredData = data
    .map(item => {
      const [date, month, year] = item["SALE DATE"].split("/").map(val => Number(val));
      const convertedDate = new Date(year, month - 1, date);

      return { ...item, date: convertedDate, dateValue: { date, month: month - 1, year } };
    })
    .filter(item => item.date >= startDate && item.date <= endDate);

  function getMonthlySales() {
    const scale = d3.scaleUtc().domain([startDate, endDate]).ticks(d3.utcMonth.every(1));
    const formattedScale = scale.map(date => `${monthNames[date.getMonth()]} ${date.getFullYear()}`);

    const monthlySales = uniqueBorough.map(borough => {
      const sales = scale.map(date => {
        const month = date.getMonth();
        const year = date.getFullYear();

        const dataForMonth = filteredData.filter(data =>
          data["BOROUGH NAME"] === borough && data.dateValue.month === month && data.dateValue.year === year
        );

        return sum(dataForMonth, "SALE PRICE");
      });

      return { borough, sales };
    });

    return { data: monthlySales, scales: formattedScale };
  }

  return { getMonthlySales, data: filteredData };
}

function processData(data) {
  const boroughData = {};

  data.forEach(item => {
    const borough = item["BOROUGH NAME"];
    const residentialUnits = Number(item["RESIDENTIAL UNITS"]);
    const commercialUnits = Number(item["COMMERCIAL UNITS"]);
    const salePrice = Number(item["SALE PRICE"]);

    if (!boroughData[borough]) {
      boroughData[borough] = { totalSalePrice: 0, totalResidentialUnits: 0, totalCommercialUnits: 0 };
    }

    boroughData[borough].totalSalePrice += salePrice;
    boroughData[borough].totalResidentialUnits += residentialUnits;
    boroughData[borough].totalCommercialUnits += commercialUnits;
  });

  return boroughData;
}

function sortDataBySalePrice(boroughData) {
  return Object.keys(boroughData)
    .sort((a, b) => boroughData[b].totalSalePrice - boroughData[a].totalSalePrice)
    .map(borough => ({ name: borough, ...boroughData[borough] }));
}

function processYearBuiltData(data) {
  const yearBuiltData = {};

  data.forEach(item => {
    const yearBuilt = item["GROUP YEAR BUILT"];
    const totalUnits = Number(item["TOTAL UNITS"]);

    if (!yearBuiltData[yearBuilt]) {
      yearBuiltData[yearBuilt] = { totalUnits: 0 };
    }

    yearBuiltData[yearBuilt].totalUnits += totalUnits;
  });

  return Object.keys(yearBuiltData)
    .sort((a, b) => Number(a) - Number(b))
    .map(yearBuilt => ({ yearBuilt, totalUnits: yearBuiltData[yearBuilt].totalUnits }));
}

function processSalePriceData(data) {
  const salePriceData = {};

  data.forEach(item => {
    const buildingClass = item["BUILDING CLASS CATEGORY"];
    const salePrice = Number(item["SALE PRICE"]);

    if (!salePriceData[buildingClass]) {
      salePriceData[buildingClass] = { totalSalePrice: 0, count: 0 };
    }

    salePriceData[buildingClass].totalSalePrice += salePrice;
    salePriceData[buildingClass].count++;
  });

  return Object.keys(salePriceData)
    .map(key => ({ category: key, averageSalePrice: salePriceData[key].totalSalePrice / salePriceData[key].count }))
    .sort((a, b) => b.averageSalePrice - a.averageSalePrice)
    .slice(0, 10);
}

function processNeighborhoodData(data) {
  const neighborhoodData = {};

  data.forEach(item => {
    const neighborhood = item["NEIGHBORHOOD"];
    const salePrice = Number(item["SALE PRICE"]);

    if (!neighborhoodData[neighborhood]) {
      neighborhoodData[neighborhood] = { totalSalePrice: 0, count: 0 };
    }

    neighborhoodData[neighborhood].totalSalePrice += salePrice;
    neighborhoodData[neighborhood].count++;
  });

  return Object.keys(neighborhoodData)
    .map(key => ({ neighborhood: key, averageSalePrice: neighborhoodData[key].totalSalePrice / neighborhoodData[key].count }))
    .sort((a, b) => b.averageSalePrice - a.averageSalePrice)
    .slice(0, 10);
}

// Main Function to Initialize and Render Charts
(async function main() {
  const chartData = await fetchData();
  const startDate = new Date("2016-09-01");
  const endDate = new Date("2017-08-31");
  const filter = createFilter(chartData, startDate, endDate);

  const monthlySalesData = filter.getMonthlySales();
  console.log(monthlySalesData);

  createMonthlySaleChart(monthlySalesData);

  const processedData = processData(chartData);
  const sortedData = sortDataBySalePrice(processedData);

  const labels = sortedData.map(data => data.name);
  const totalResidentialUnits = sortedData.map(data => data.totalResidentialUnits);
  const totalCommercialUnits = sortedData.map(data => data.totalCommercialUnits);

  createPropertySalesChart(labels, totalResidentialUnits, totalCommercialUnits);

  const yearBuiltData = processYearBuiltData(chartData);
  const labelsYearBuilt = yearBuiltData.map(data => data.yearBuilt);
  const totalUnitsYearBuilt = yearBuiltData.map(data => data.totalUnits);

  createBarChart(labelsYearBuilt, totalUnitsYearBuilt);

  const salePriceData = processSalePriceData(chartData);
  const labelsBuildingClass = salePriceData.map(item => item.category);
  const averageSalePriceData = salePriceData.map(item => item.averageSalePrice);

  createTopBuildingClassCategorySales(labelsBuildingClass, averageSalePriceData);

  const neighborhoodData = processNeighborhoodData(chartData);
  const labelsNeighborhood = neighborhoodData.map(item => item.neighborhood);
  const averageSalePriceNeighborhood = neighborhoodData.map(item => item.averageSalePrice);

  createTopNeighborhoodCategorySales(labelsNeighborhood, averageSalePriceNeighborhood);
})();

// Chart Creation Functions
function createMonthlySaleChart(monthlySalesData) {
  const color = ["#302de0", "#49084f", "#b51818", "#0e758c", "#fa3981"];
  const totalMonthlySalesCtx = document.getElementById("totalMonthlySales");
  const scale = monthlySalesData.scales;
  const datasets = monthlySalesData.data.map((item, i) => ({
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

function createPropertySalesChart(labels, totalResidentialUnits, totalCommercialUnits) {
  const ctx = document.getElementById('PropertyTypeSales').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Residential Units',
          data: totalResidentialUnits,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          stack: 'Stack 0'
        },
        {
          label: 'Total Commercial Units',
          data: totalCommercialUnits,
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          stack: 'Stack 0'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  });
}

function createBarChart(labels, data) {
  const ctx = document.getElementById('MostOrdersbyYearBuilt').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Units',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  });
}

function createTopBuildingClassCategorySales(labels, data) {
  const ctx = document.getElementById('topBuildingClassCategorySales').getContext('2d'); // Menggunakan id yang benar

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Sale Price',
        data: data,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function createTopNeighborhoodCategorySales(labels, data) {
  const ctx = document.getElementById('TopNeighborhoodCategorySales').getContext('2d'); // Menggunakan id yang benar

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Sale Price',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

//  Function Data Table 
function createSalesTable(data) {
  return new DataTable("#salesTable", {
    data: data,
    columns: [
      {data: "BOROUGH NAME"},
      {data: "BUILDING CLASS CATEGORY"},
      {data: "NEIGHBORHOOD"},
      {data: "COMMERCIAL UNITS"},
      {data: "RESIDENTIAL UNITS"},
      {data: "SALE PRICE",
        render: (data, type) => {
          const number = DataTable.render
          .number(",", ".", 0, "$")
          .display(data);

          if(type === "display") {
            return number;
          }

        return data;
      },
    },
      {data: "TOTAL UNITS"},
      {data: "YEAR BUILT"},
      {data: "ZIP CODE"},
  ],
  })
}

async function main() {
  const data = await fetchData()
  const salesTable = createSalesTable(data);
  console.log({ data });
}

main();

// Swiper Initialization
var swiper = new Swiper(".mySwiper", {
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: "auto",
  coverflowEffect: {
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: true,
  },
  pagination: {
    el: ".swiper-pagination",
  },
});
