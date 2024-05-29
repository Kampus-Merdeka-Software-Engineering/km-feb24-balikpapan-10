async function fetchData() {
  const response = await fetch(
    "https://raw.githubusercontent.com/wulannw/NYCdataset/main/NYCTeam10.json"
  );
  const data = await response.json();
  return data.Sheet1;
}

function sum(data, key) {
  return data.reduce((acc, curr) => acc + Number(curr[key]), 0);
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function createFilter(data, startDate, endDate) {
  const uniqueBorough = Array.from(new Set(data.map((item) => item["BOROUGH NAME"])));

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
    .filter((item) => item.date >= startDate && item.date <= endDate);

  function getMonthlySales() {
    const scale = d3.scaleUtc().domain([startDate, endDate]).ticks(d3.utcMonth.every(1));

    const formattedScale = scale.map((date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`);

    const monthlySales = uniqueBorough.map((borough) => {
      const sales = scale.map((date) => {
        const month = date.getMonth();
        const year = date.getFullYear();

        const isOnMonthRange = (data) => data.dateValue.month === month && data.dateValue.year === year;

        const dataForMonth = filteredData.filter((data) => data["BOROUGH NAME"] === borough && isOnMonthRange(data));

        const salesTotal = sum(dataForMonth, "SALE PRICE");

        return salesTotal;
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
          boroughData[borough] = {
              totalSalePrice: 0,
              totalResidentialUnits: 0,
              totalCommercialUnits: 0,
          };
      }

      boroughData[borough].totalSalePrice += salePrice;
      boroughData[borough].totalResidentialUnits += residentialUnits;
      boroughData[borough].totalCommercialUnits += commercialUnits;
  });

  return boroughData;
}

function sortDataBySalePrice(boroughData) {
  const sortedBoroughs = Object.keys(boroughData).sort((a, b) => {
      return boroughData[b].totalSalePrice - boroughData[a].totalSalePrice;
  });

  return sortedBoroughs.map(borough => ({
      name: borough,
      ...boroughData[borough]
  }));
}

function processYearBuiltData(data) {
  const yearBuiltData = {};

  data.forEach(item => {
    const yearBuilt = item["GROUP YEAR BUILT"];
    const totalUnits = Number(item["TOTAL UNITS"]);

    if (!yearBuiltData[yearBuilt]) {
      yearBuiltData[yearBuilt] = {
        totalUnits: 0
      };
    }

    yearBuiltData[yearBuilt].totalUnits += totalUnits;
  });

  // Sort the data by year built
  const sortedYearBuiltData = Object.keys(yearBuiltData)
    .sort((a, b) => Number(a) - Number(b))
    .map(yearBuilt => ({
      yearBuilt: yearBuilt,
      totalUnits: yearBuiltData[yearBuilt].totalUnits
    }));

  return sortedYearBuiltData;
}

function processSalePriceData(data) {
  const salePriceData = {};

  data.forEach(item => {
    const buildingClass = item["BUILDING CLASS CATEGORY"];
    const salePrice = Number(item["SALE PRICE"]);

    if (!salePriceData[buildingClass]) {
      salePriceData[buildingClass] = {
        totalSalePrice: 0,
        count: 0
      };
    }

    salePriceData[buildingClass].totalSalePrice += salePrice;
    salePriceData[buildingClass].count++;
  });

  const averageSalePriceArray = Object.keys(salePriceData).map(key => {
    const averageSalePrice = salePriceData[key].totalSalePrice / salePriceData[key].count;
    return { category: key, averageSalePrice: averageSalePrice };
  });

  return averageSalePriceArray
    .sort((a, b) => b.averageSalePrice - a.averageSalePrice)
    .slice(0, 10);
}

function processNeighborhoodData(data) {
  const neighborhoodData = {};

  data.forEach(item => {
    const neighborhood = item["NEIGHBORHOOD"];
    const salePrice = Number(item["SALE PRICE"]);

    if (!neighborhoodData[neighborhood]) {
      neighborhoodData[neighborhood] = {
        totalSalePrice: 0,
        count: 0
      };
    }

    neighborhoodData[neighborhood].totalSalePrice += salePrice;
    neighborhoodData[neighborhood].count++;
  });

  const averageSalePriceArray = Object.keys(neighborhoodData).map(key => {
    const averageSalePrice = neighborhoodData[key].totalSalePrice / neighborhoodData[key].count;
    return { neighborhood: key, averageSalePrice: averageSalePrice };
  });

  return averageSalePriceArray
    .sort((a, b) => b.averageSalePrice - a.averageSalePrice)
    .slice(0, 10);
}

(async function main() {
  const chartData = await fetchData();
  const startDate = new Date("2016-09-01");
  const endDate = new Date("2017-08-31");
  const filter = createFilter(chartData, startDate, endDate);

  const monthlySalesData = filter.getMonthlySales();
  console.log(monthlySalesData);

  createMonthlySaleChart(monthlySalesData);

  const processedData = processData(chartData); // Menggunakan processData, bukan processBoroughData
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

function createMonthlySaleChart(monthlySalesData) {
  const color = [
    "#302de0",
    "#49084f",
    "#b51818",
    "#0e758c",
    "#fa3981",
  ];

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
  const ctx = document.getElementById('TopBuildingClassCategorySales').getContext('2d');

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
      indexAxis: 'y',  // Mengatur sumbu y sebagai sumbu indeks
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
  const ctx = document.getElementById('TopNeighborhoodCategorySales').getContext('2d');

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