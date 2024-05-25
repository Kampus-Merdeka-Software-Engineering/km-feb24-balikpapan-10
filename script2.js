// Ngeimport data json ke file JS
import rawData from "./NYCTeam10.json" assert { type: "json" };

const data = rawData.Sheet1;

console.log({ data });
// Transformarsi Data

function groupBySalePrice(id, box, current) {
  const key = current[id];
  // Cek apakah di akumulator itu sudah ada key-nya

  // Kondisi false (Key belum ada)
  if (!box[key]) {
    box[key] = Number(current["SALE PRICE"]);
  } else {
    box[key] = box[key] + Number(current["SALE PRICE"]);
  }

  return box;
}

// Fungsi untuk group building class category sales
function groupBuildingClassCategorySales() {
  const buildingClassCategorySales = data.reduce(
    (a, b) => groupBySalePrice("BUILDING CLASS CATEGORY", a, b),
    {}
  );
  return buildingClassCategorySales;
}

// Fungsi untuk group building class category sales
function groupNeighbourhoodSales() {
  const neighborhoodSales = data.reduce(
    (acc, curr) => groupBySalePrice("NEIGHBORHOOD", acc, curr),
    {}
  );
  return neighborhoodSales;
}

function getTopTenEntries(obj) {
  return Object.entries(obj)
    .sort((a, b) => {
      return b[1] - a[1];
    })
    .slice(0, 10);
}

const dataTopBuildingClassCategory = groupBuildingClassCategorySales();
const sortedDataTopBuildingClass = getTopTenEntries(
  dataTopBuildingClassCategory
);

const dataNeighorhoodSales = groupNeighbourhoodSales();
const topNeighbourhoodSales = getTopTenEntries(dataNeighorhoodSales);

console.log({ sortedDataTopBuildingClass });

const topBuildingClassCategorySalesCtx = document.getElementById(
  "topBuildingClassCategorySales"
);

new Chart(topBuildingClassCategorySalesCtx, {
  type: "bar",
  data: {
    labels: sortedDataTopBuildingClass.map((data) => data[0]),
    datasets: [
      {
        label: "# Sales",
        data: sortedDataTopBuildingClass.map((data) => data[1]),
        borderWidth: 1,
      },
    ],
  },
  options: {
    indexAxis: "y",
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

const topNeighborhoodSalesCtx = document.getElementById("topNeighborhoodSales");

new Chart(topNeighborhoodSalesCtx, {
  type: "bar",
  data: {
    labels: topNeighbourhoodSales.map((data) => data[0]),
    datasets: [
      {
        label: "# Sales",
        data: topNeighbourhoodSales.map((data) => data[1]),
        borderWidth: 1,
      },
    ],
  },
  options: {
    indexAxis: "y",
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});
