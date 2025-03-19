// Map to translate weather codes into descriptions
const weatherCodeMap = new Map([
    [0, "Clear Skies"], [1, "Mainly Clear"], [2, "Partly Cloudy"], [3, "Overcast"],
    [45, "Dense Fog"], [51, "Light Drizzle"], [53, "Moderate Drizzle"], [55, "Heavy Drizzle"],
    [56, "Light Freezing Drizzle"], [57, "Heavy Freezing Drizzle"], [61, "Light Rain"], [63, "Moderate Rain"],
    [65, "Heavy Rain"], [66, "Slight Freezing Rain"], [67, "Heavy Freezing Rain"], [71, "Light Snowfall"],
    [73, "Moderate Snowfall"], [75, "Heavy Snowfall"], [77, "Snow Grains"], [80, "Light Rain Showers"],
    [81, "postalcodeaModerate Rain Showers"], [82, "Heavy Rain Showers"], [85, "Light Snow"], [86, "Heavy Snow"],
    [95, "Slight or Moderate Thunderstorm"], [96, "Thunderstorm with Slight Hail"], [99, "Thunderstorm with Heavy Hail"]
]);

// Map to translate weather codes into icons
const weatherIconMap = new Map([
    [0, "wi:day-sunny"], [1, "mdi:weather-partly-cloudy"], [2, "mdi:weather-cloudy"], [3, "mdi:weather-cloudy"],
    [45, "mdi:weather-fog"], [51, "mdi:weather-rainy"], [53, "mdi:weather-rainy"], [55, "mdi:weather-rainy"],
    [56, "mdi:weather-snowy-rainy"], [57, "mdi:weather-snowy-rainy"], [61, "mdi:weather-rainy"], [63, "mdi:weather-rainy"],
    [65, "mdi:weather-pouring"], [66, "mdi:weather-snowy-rainy"], [67, "mdi:weather-snowy-rainy"], [71, "mdi:weather-snowy"],
    [73, "mdi:weather-snowy"], [75, "mdi:weather-snowy"], [77, "mdi:weather-snowy"], [80, "mdi:weather-rainy"],
    [81, "mdi:weather-rainy"], [82, "mdi:weather-pouring"], [85, "mdi:weather-snowy"], [86, "mdi:weather-snowy"],
    [95, "mdi:weather-lightning"], [96, "mdi:weather-lightning-rainy"], [99, "mdi:weather-lightning-rainy"]
]);

const temperatureUnitMap = new Map([
    ["fahrenheit", "°F"], ["celsius", "°C"]
]);


class Location {
    constructor(postalCode, latitude, longitude, admin1, admin2) {
        this.postalCode = postalCode;
        this.admin1 = admin1; // State
        this.admin2 = admin2; // City
        this.coordinates = new Coordinates(latitude, longitude);
        this.forecast = null;
    }

    setForecast(forecast) {
        this.forecast = forecast;
    }

    setCurrentConditions(currentConditions) {
        this.currentConditions = currentConditions;
    }
}

class Coordinates {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
}

class Forecast {
    constructor(data) {
        this.data = data;
    }true
}

class CurrentConditions {
    constructor(data) {
        this.temperature = data.temperature;
        this.winddirection = data.winddirection;
        this.windCardinalDirection = this.windDirectionConversion();
        this.windspeed = data.windspeed;
        this.weathercode = data.weathercode;
        this.is_day = data.is_day;
    }

    windDirectionConversion() {
        const degree = this.winddirection;
        const val = Math.floor((degree / 22.5) + 0.5);
        const cardinalDirectionArray = ["N", "NNE", "NE", "ENE", 
                                        "E", "ESE", "SE", "SSE", 
                                        "S", "SSW", "SW", "WSW", 
                                        "W", "WNW", "NW", "NNW"];
        return cardinalDirectionArray[(val % 16)]
    }
}

function isValidPostalCode(postalCode) { // This only works for 5-digit zip codes
    const regex = /^[0-9]{5}$/;
    return regex.test(postalCode);
}

function buildGeoURL(postalCode) {
    return `https://geocoding-api.open-meteo.com/v1/search?name=${postalCode}&count=10&language=en&format=json`;
}

function fetchSuggestions(query) {
    const geolocationSearchURL = buildGeoURL(query);
    return fetch(geolocationSearchURL)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Failed to fetch suggestions");
                throw new Error("Failed to fatch suggestions");
            }
        })
        .then(data => {
            return data.results || [];
        })
        .catch(error => {
            console.error("Fetch error: ", error);
            return [];
        });
}

function displaySuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';

    suggestions.forEach(location => {

        const listItem = document.createElement('li');
        listItem.textContent = `${location.name}, ${location.admin1 || ''}, ${location.country}`;
        listItem.addEventListener('click', () => {
            if (location.postcodes && location.postcodes.length > 1) {
                const dropdown = document.createElement('select');
                dropdown.id = 'postal-code-dropdown';

                location.postcodes.forEach(postalCode => {
                    const option = document.createElement('option');
                    option.value = postalCode;
                    option.textContent = postalCode;
                    dropdown.appendChild(option);
                });

                dropdown.addEventListener('change', () => {
                    document.getElementById('wsearch').value = dropdown.value;
                    suggestionsList.innerHTML = '';
                });

                listItem.appendChild(dropdown);
            } else {
                const postalCode = location.postcodes && location.postcodes.length > 0 ? location.postcode[0] : "N/A";
                document.getElementById('wsearch').value = postalCode;
                suggestionsList.innerHTML = '';
            }
        });
        suggestionsList.appendChild(listItem);
    }); 
}

// Function to correlate zip codes to latitude and longitude using GeoLocation API
function getGeolocation(geolocationSearchURL) {
    return fetch(geolocationSearchURL)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Failure: Response Not OK");
                throw new Error("Network response was not ok");
            }
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error("Fetch error: ", error);
        });
}

function createForecast(forecastURL) {
    return fetch(forecastURL)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.error("Failure: Response Not OK");
                throw new Error("Network response was not ok");
            }
        })
        .then(data => {
            return new Forecast(data);
        })
        .catch(error => {
            console.error("Fetch error: ", error);
        });
}

let tempUnit = 'fahrenheit';

function buildForecastURL(myCoordinates) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${myCoordinates.latitude}&longitude=${myCoordinates.longitude}&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max&models=best_match&current=temperature_2m,wind_speed_10m&wind_speed_unit=mph&temperature_unit=${tempUnit}&precipitation_unit=inch&current_weather=true`;
}

function handleSearch() {
    const postalCode = document.getElementById('wsearch').value;

    if (isValidPostalCode(postalCode)) {
        const geolocationSearchURL = buildGeoURL(postalCode);
        getGeolocation(geolocationSearchURL).then(locationData => {
            if (locationData && locationData.results && locationData.results.length > 0) {
                const result = locationData.results[0];
                let myCoordinates = new Coordinates(result.latitude, result.longitude);

                let myLocation = new Location(
                    postalCode,
                    result.latitude,
                    result.longitude,
                    result.admin1,
                    result.admin2
                );

                const forecastURL = buildForecastURL(myCoordinates);
                createForecast(forecastURL).then(forecast => {
                    myLocation.setForecast(forecast);
                    
                    const currentConditions = new CurrentConditions(forecast.data.current_weather);
                    myLocation.setCurrentConditions(currentConditions);

                    const currentTemperature = Math.round(myLocation.currentConditions.temperature);

                    const forecastInfoDiv = document.getElementById('forecast-info');
                    forecastInfoDiv.innerHTML = `Forecast for ${myLocation.admin2}, ${myLocation.admin1}`;
                    
                    const currentTemperatureDiv = document.getElementById('current-temperature');
                    currentTemperatureDiv.innerHTML = `${currentTemperature} ${temperatureUnitMap.get(tempUnit)}`;

                    const currentWindSpeedDiv = document.getElementById('current-wind-speed');
                    currentWindSpeedDiv.innerHTML = `Wind Speed: ${myLocation.currentConditions.windspeed} mph ${myLocation.currentConditions.windCardinalDirection}`;

                    const currentWeatherDiv = document.getElementById('current-weather');
                    currentWeatherDiv.innerHTML = `${weatherCodeMap.get(myLocation.currentConditions.weathercode)}`;

                    const currentWeatherIconDiv = document.getElementById('current-weather-icon');
                    const weatherIcon = weatherIconMap.get(myLocation.currentConditions.weathercode);
                    currentWeatherIconDiv.innerHTML = `<span class="iconify" data-icon="${weatherIcon}" data-inline="false"></span>`;

                    const forecastDisplayDiv = document.getElementById('forecast-display');
                    forecastDisplayDiv.innerHTML = '';
                    for (let i = 2; i < 7; ++i) {
                        const dayForecast = forecast.data.daily.weather_code[i];
                        const dayIcon = weatherIconMap.get(dayForecast);
                        const date = new Date(forecast.data.daily.time[i]);
                        const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        const tempMax = Math.round(forecast.data.daily.temperature_2m_max[i]);
                        const tempMin = Math.round(forecast.data.daily.temperature_2m_min[i]);
                        const precipitationPerc = forecast.data.daily.precipitation_probability_max[i];
                        const dayDiv = document.createElement('div');

                        dayDiv.className = 'forecast-day';

                        const dateDiv = document.createElement('div');
                        dateDiv.className = 'forecast-date';
                        dateDiv.innerHTML = `<p>${formattedDate}</p>`;

                        const iconDiv = document.createElement('div');
                        iconDiv.className = 'forecast-icon';
                        iconDiv.innerHTML = `<span class="iconify" data-icon="${dayIcon}" data-inline="false"></span>`;

                        const descriptionDiv = document.createElement('div');
                        descriptionDiv.className = 'forecast-description';
                        descriptionDiv.innerHTML = `<p>${weatherCodeMap.get(dayForecast)}</p>`;

                        const tempMaxDiv = document.createElement('div');
                        tempMaxDiv.className = 'temp-max';
                        tempMaxDiv.innerHTML = `<p>${tempMax} ${temperatureUnitMap.get(tempUnit)}</p>`;

                        const tempMinDiv = document.createElement('div');
                        tempMinDiv.className = 'temp-min';
                        tempMinDiv.innerHTML = `<p>${tempMin} ${temperatureUnitMap.get(tempUnit)}</p>`;

                        const precipPercentage = document.createElement('div');
                        precipPercentage.className = 'precp-perc';
                        precipPercentage.innerHTML = `<span class="iconify" data-icon="wi:raindrop" data-inline="false"></span> ${precipitationPerc}%`;

                        dayDiv.appendChild(dateDiv);
                        dayDiv.appendChild(iconDiv);
                        dayDiv.appendChild(descriptionDiv);
                        dayDiv.appendChild(tempMaxDiv);
                        dayDiv.appendChild(tempMinDiv);
                        dayDiv.appendChild(precipPercentage);

                        forecastDisplayDiv.appendChild(dayDiv);
                    }
                });
            } else {
                console.error("No results found for the given postal code.");
                alert(`No result for ${postalCode}`);
            }
        });
    } else {
        console.error(`Invalid Postal Code: ${postalCode}`);
        alert('Please enter a valid 5-digit postal code.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById("search-button");
    const searchInput = document.getElementById("wsearch");
    const suggestionsList = document.getElementById('suggestions');

    // Input Suggestions //
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query.length > 2) {
            fetchSuggestions(query).then(suggestions => {
                displaySuggestions(suggestions);
            });
        } else {
            suggestionsList.innerHTML = '';
        }
    });

    document.addEventListener('click', (event) => {
        if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
            suggestionsList.innerHTML = '';
        }
    })

    // Button Functionality //
    button.addEventListener('click', handleSearch);
    const input = document.getElementById("wsearch");
    input.addEventListener('keydown', (event) => {
        if (event.key == 'Enter') {
            handleSearch();
        }
    });

    // Unit Toggle Functionality //
    const unitToggle = document.getElementById('unit-toggle');

    unitToggle.addEventListener('change', () => {
        tempUnit = unitToggle.checked ? 'celsius' : 'fahrenheit';
        handleSearch();
    });
});
