const { SlashCommandBuilder } = require('discord.js');

const url = 'https://carleton.campusdish.com/LocationsAndMenus/TheCaf';
const apiRoot = 'https://carleton.campusdish.com/api';
const getMenu = '/menu/GetMenus';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get_menu')
		.setDescription('Know whats on the menu!')
		.addStringOption(option => option.setName('date').setDescription('Date you want to check (MM/DD/YYYY)').setRequired(true))
        .addStringOption(option => option.setName('meal_period').setDescription('Meal period you want to check (breakfast/lunch/dinner)').setRequired(true)),
	async execute(interaction) {
        let date = interaction.options.getString('date');
        let mealPeriod = interaction.options.getString('meal_period');

        let menu = await getIt(date, mealPeriod);
        console.log(menu);
        await interaction.reply(menu);
	},
};

async function getIt(date, mealPeriod) {
    console.log(date);
    console.log(mealPeriod);
    
    let query = new URLSearchParams();

    const { parseHTML } = await import("linkedom");

    let page = await fetch(url).then(res=>res.text());

    let { document } = parseHTML(page);

    let js = document.getElementsByTagName("script").map(elem=>elem.innerHTML).filter(elem=>elem.includes("requestParameters"))[0];

    let menuJson = js.split("$.extend(menus,")[1].trim();
    menuJson = menuJson.substring(0, menuJson.length-2);
    
    eval(`menuJson = ${menuJson}`);
    
    let menuParam = menuJson.requestParameters;
    switch(mealPeriod) {
        case "breakfast":
            menuParam.periodId = "2082";
            break;
        case "lunch":
            menuParam.periodId = "2084";
            break;
        default:
            menuParam.periodId = "2085";
    }
    menuParam.date = date;
    
    query = new URLSearchParams();
  
    for (const key in menuParam) {
      query.set(key, menuParam[key]);
    }
  
    let menu = await fetch(apiRoot + getMenu + "?" + query.toString()).then(res=>res.json());
  
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
    let output = "Menu for " + date + " " + mealPeriod + "\n";
    for (const i of cat) {
      output += i + ": \n";
      for (const j of prod) {
        if (j.station == i)
          output += j.name + ", " + j.calories + " calories \n";
      }
      output += "\n";
    }
    return output;
}