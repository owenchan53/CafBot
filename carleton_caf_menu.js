let url = "https://carleton.campusdish.com/LocationsAndMenus/TheCaf";

let apiRoot = "https://carleton.campusdish.com/api";

let getMenuPeriod = "/menu/GetMenuPeriods";
let getMenu = "/menu/GetMenus";

const prompt = require("prompt-sync")({ sigint: true })
const date = prompt("Enter the date you want to check (MM/DD/YYYY): ");
const period = prompt("Enter the meal period (breakfast/lunch/dinner): ");
// let date = "09/12/2023";
// let period = "dinner";

let periodIds = {
  breakfast: "2082",
  lunch: "2084",
  dinner: "2085",
};

// let menuPeriodParam = {
//   locationId: "5087",
//   storeId: "14109,14110,14111,14112,14113,14114,14120,14121,17738,23817,23819,23820,23850,23955,18291,18292,18293,18294,18295,18296,18297,18298,18299,18300,18301,18302,18303,18304,23548,23831,24130,24131,24132,24133,24134,24135,24136,24137,24138,24183,24237,32350,32351,35345,36031,37090,37091,37092,38369,38370,38371,38372,38373,38698,38699,38700,38701,38702,38703,38704,38705,38706,38707,38708,38709,38710,38711,38712,38713,39611,14115,14116,14117,14118,14119",
//   date,
//   mode: "Daily",
// }

// let menuParam = {
//   locationId: '5087',
//   storeIds: '14109,14110,14111,14112,14113,14114,14120,14121,17738,23817,23819,23820,23850,23955,18291,18292,18293,18294,18295,18296,18297,18298,18299,18300,18301,18302,18303,18304,23548,23831,24130,24131,24132,24133,24134,24135,24136,24137,24138,24183,24237,32350,32351,35345,36031,37090,37091,37092,38369,38370,38371,38372,38373,38698,38699,38700,38701,38702,38703,38704,38705,38706,38707,38708,38709,38710,38711,38712,38713,39611,14115,14116,14117,14118,14119',
//   mode: 'Daily',
//   periodId: '2084',
//   date,
//   pageStoreId: undefined
// }

let query = new URLSearchParams();

// for (const key in menuPeriodParam) {
//   query.set(key, menuPeriodParam[key])
// }

!(async ()=>{
  const { parseHTML } = await import("linkedom");

  let page = await fetch(url).then(res=>res.text());

  let { document } = parseHTML(page);

  let js = document.getElementsByTagName("script").map(elem=>elem.innerHTML).filter(elem=>elem.includes("requestParameters"))[0];

  let menuJson = js.split("$.extend(menus,")[1].trim();
  menuJson = menuJson.substring(0, menuJson.length-2);
  
  eval(`menuJson = ${menuJson}`);
  
  let menuParam = menuJson.requestParameters;

  menuParam.periodId = periodIds[period];
  menuParam.date = date;

  // let menuPeriod = await fetch(apiRoot+getMenuPeriod+"?"+query.toString()).then(res=>res.json())

  // console.log(menuPeriod)

  query = new URLSearchParams();

  for (const key in menuParam) {
    query.set(key, menuParam[key]);
  }

  let menu = await fetch(apiRoot+getMenu+"?"+query.toString()).then(res=>res.json());

  // console.log(menu)

  let stations = menu.Menu.MenuStations;

  let stationMap = new Map();

  for (let i = 0; i < stations.length; i++) {
    if (stationMap.get(stations[i].StationId)) continue;
    stationMap.set(stations[i].StationId, stations[i].Name);
  }

  let prod = menu.Menu.MenuProducts.map(p=>({
    station: stationMap.get(p.StationId),
    name: p.Product.MarketingName,
    calories: p.Product.Calories,
  }));

  const cat = ["All Day Breakfast", "Bakery", "Deli", "Farmer's Market", "Global Kitchen", "Grill", "Pizza", "Soup", "Vegan"];
  let output = "Menu for " + date + " " + period + "\n";
  for (const i of cat) {
    output += i + ": \n";
    for (const j of prod) {
      if (j.station == i)
        output += j.name + ", " + j.calories + " calories \n";
    }
    output += "\n";
  }
  console.log(output);

})();
