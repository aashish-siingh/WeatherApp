"use strict";
const $ = (id) => document.getElementById(id);
const state = { place: null, weather: null, unit: "c", request: 0 };
const geocodeURL = "https://geocoding-api.open-meteo.com/v1/search";
const forecastURL = "https://api.open-meteo.com/v1/forecast";
const codes = {
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],
  56:["Freezing drizzle","🌧️"],57:["Freezing drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
  66:["Freezing rain","🌧️"],67:["Freezing rain","🌧️"],71:["Light snow","🌨️"],73:["Snow","❄️"],75:["Heavy snow","❄️"],
  77:["Snow grains","🌨️"],80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy showers","⛈️"],
  85:["Snow showers","🌨️"],86:["Heavy snow showers","❄️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm with hail","⛈️"],99:["Thunderstorm with hail","⛈️"]
};
const desc = (code,isDay=true) => {
  if(code === 0 && !isDay) return ["Clear night","🌙"];
  if((code===1 || code===2) && !isDay) return ["Partly cloudy night","☁️"];
  return codes[code] || ["Variable conditions","🌤️"];
};
const temp = (c) => c == null ? "--" : Math.round(state.unit==="c" ? c : c*9/5+32);
const speed = (k) => k == null ? "--" : Math.round(state.unit==="c" ? k : k/1.609344);
const unit = () => state.unit==="c" ? "°C" : "°F";
const formatClock = (iso) => {
  if(!iso) return "--";
  const parts=iso.slice(11,16).split(":");
  const h=Number(parts[0]);return ((h%12)||12)+":"+parts[1]+" "+(h<12?"AM":"PM");
};
const timeOnly = (iso) => iso ? iso.slice(11,16) : "--";
const dateDay = (iso,i) => i===0 ? "Today" : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(iso+"T12:00:00Z").getUTCDay()];
const status = (message,error=false) => { $("status").textContent=message;$("status").classList.toggle("error",error); };
const setText = (id,value) => { $(id).textContent=value; };
const escapeHTML = (value) => String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function getJSON(url){
  const response = await fetch(url);
  if(!response.ok) throw new Error(response.status===429?"Too many requests. Try again shortly.":"Weather service unavailable. Please try again.");
  return response.json();
}
async function searchCity(query){
  const token=++state.request;
  status("Searching for "+query+"…");
  try{
    const data=await getJSON(geocodeURL+"?name="+encodeURIComponent(query)+"&count=1&language=en&format=json");
    if(token!==state.request)return;
    if(!data.results || !data.results.length)throw new Error("No city found. Try a different city or spelling.");
    await loadPlace(data.results[0],token);
  }catch(e){if(token===state.request)status(e.message || "Could not search for that city.",true);}
}
async function loadPlace(place,token){
  status("Getting the latest forecast…");
  const params=new URLSearchParams({
    latitude:place.latitude,longitude:place.longitude,timezone:"auto",forecast_days:"7",past_days:"0",
    current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly:"temperature_2m,precipitation_probability,weather_code,is_day,uv_index",
    daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max"
  });
  try {
    const data=await getJSON(forecastURL+"?"+params.toString());
    if(token!==state.request)return;
    if(!data.current || !data.daily || !data.hourly)throw new Error("Forecast data is incomplete. Please try again.");
    state.place=place;state.weather=data;
    render();$("dashboard").hidden=false;status("");
    try{localStorage.setItem("atmos-place",JSON.stringify({name:place.name,country:place.country,admin1:place.admin1,latitude:place.latitude,longitude:place.longitude}));}catch(_){}
  }catch(e){if(token===state.request)status(e.message || "Unable to load forecast.",true);}
}
function render(){
  const data=state.weather, c=data.current, d=data.daily, h=data.hourly, place=state.place;
  if(!data)return;
  const condition=desc(c.weather_code,c.is_day===1);
  setText("city-name",place.name || "Your location");setText("country-name",[place.admin1,place.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(", "));
  setText("local-time",formatClock(c.time));
  setText("weather-art",condition[1]);setText("current-temp",temp(c.temperature_2m));setText("condition",condition[0]);
  setText("feels-like","Feels like "+temp(c.apparent_temperature)+unit());
  setText("high-low","H: "+temp(d.temperature_2m_max[0])+"° · L: "+temp(d.temperature_2m_min[0])+"°");
  setText("precip-chance","Rain chance: "+(d.precipitation_probability_max[0] ?? "--")+"%");
  setText("weather-tip",tip(c.weather_code,d.precipitation_probability_max[0]));
  setText("updated-at","Updated "+formatClock(c.time));
  setText("humidity",Math.round(c.relative_humidity_2m));setText("humidity-note",c.relative_humidity_2m>75?"Feels quite humid":c.relative_humidity_2m<30?"Dry air":"Comfortable humidity");
  setText("wind",speed(c.wind_speed_10m));setText("wind-unit",state.unit==="c"?"km/h":"mph");
  setText("wind-note",windDirection(c.wind_direction_10m)+" wind");
  const hourIndex=Math.max(0,h.time.findIndex(t=>t>=c.time.slice(0,13)+":00"));
  const uv=h.uv_index?.[hourIndex];
  setText("uv",uv==null?"--":uv.toFixed(1));setText("uv-note",uv==null?"Not available":uv<3?"Low exposure":uv<6?"Moderate exposure":uv<8?"High exposure":"Very high exposure");
  setText("cloud",Math.round(c.cloud_cover));setText("cloud-note",c.cloud_cover<25?"Mostly clear skies":c.cloud_cover<75?"Partly cloudy":"Cloudy skies");
  setText("precip",(c.precipitation ?? 0).toFixed(1));setText("pressure",Math.round(c.pressure_msl));
  $("hourly-list").innerHTML=h.time.slice(hourIndex,hourIndex+24).map((t,i)=>{
    const k=hourIndex+i, icon=desc(h.weather_code[k],h.is_day[k]===1)[1];
    return '<div class="hour-item"><span class="hour-time">'+(i===0?"Now":formatClock(t).replace(":00",""))+'</span><span class="hour-icon" aria-hidden="true">'+icon+'</span><span class="hour-temp">'+temp(h.temperature_2m[k])+'°</span><span class="hour-rain">💧 '+(h.precipitation_probability[k]??0)+'%</span></div>';
  }).join("");
  $("weekly-list").innerHTML=d.time.map((day,i)=>{
    const item=desc(d.weather_code[i]);
    return '<div class="week-row"><span class="week-day">'+escapeHTML(dateDay(day,i))+'</span><span class="week-icon" aria-hidden="true">'+item[1]+'</span><span class="week-desc">'+escapeHTML(item[0])+'</span><span class="week-temps">'+temp(d.temperature_2m_max[i])+'° <span>'+temp(d.temperature_2m_min[i])+'°</span></span></div>';
  }).join("");
  setText("sunrise",formatClock(d.sunrise[0]));setText("sunset",formatClock(d.sunset[0]));
  const mins=(Date.parse(d.sunset[0])-Date.parse(d.sunrise[0]))/60000;
  setText("daylight",Number.isFinite(mins)?Math.floor(mins/60)+"h "+Math.round(mins%60)+"m":"--");
  setText("sun-advice",Number.isFinite(mins)&&mins<600?"Shorter days — enjoy the daylight while it lasts.":"A little sunshine makes every day better.");
  $("unit-toggle").innerHTML=state.unit==="c"?'°C <span>/ °F</span>':'<span>°C /</span> °F';
}
function tip(code,rain){
  if([95,96,99].includes(code))return "Thunderstorms possible — check local safety alerts.";
  if([71,73,75,77,85,86].includes(code))return "Bundle up — snowy conditions outside.";
  if((rain??0)>=60)return "An umbrella might come in handy today.";
  if([0,1].includes(code))return "A lovely day to spend some time outdoors.";
  return "A good day to keep an eye on the skies.";
}
function windDirection(degrees){
  if(degrees==null)return "Variable";
  return ["N","NE","E","SE","S","SW","W","NW"][Math.round(degrees/45)%8];
}
$("search-form").addEventListener("submit",e=>{e.preventDefault();const query=$("city-input").value.trim();if(query)searchCity(query);});
$("unit-toggle").addEventListener("click",()=>{state.unit=state.unit==="c"?"f":"c";render();});
$("location-btn").addEventListener("click",()=>{
  if(!navigator.geolocation){status("Location is unavailable in this browser. Search by city instead.",true);return;}
  const token=++state.request;status("Requesting your location…");
  navigator.geolocation.getCurrentPosition(pos=>{
    if(token!==state.request)return;
    loadPlace({name:"Current location",country:"",latitude:pos.coords.latitude,longitude:pos.coords.longitude},token);
  },()=>{if(token===state.request)status("Location permission denied or unavailable. Search by city instead.",true);},{timeout:12000,enableHighAccuracy:false});
});
let previous=null;try{previous=JSON.parse(localStorage.getItem("atmos-place"));}catch(_){}
if(previous && Number.isFinite(Number(previous.latitude)) && Number.isFinite(Number(previous.longitude)))loadPlace(previous,++state.request);
else searchCity("Kathmandu");
