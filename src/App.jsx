
import React, { useEffect, useState } from "react";
import "./App.css";

const getWeather = (code) => {
  if (code === 0) return ["☀️", "Ясно"];
  if (code <= 2) return ["🌤️", "Малооблачно"];
  if (code === 3) return ["☁️", "Облачно"];
  if (code <= 48) return ["🌫️", "Туман"];
  if (code <= 67) return ["🌧️", "Дождь"];
  if (code <= 77) return ["❄️", "Снег"];
  if (code <= 82) return ["🌦️", "Ливень"];
  if (code <= 86) return ["🌨️", "Снегопад"];
  return ["⛈️", "Гроза"];
};

export default function App() {
  const [city, setCity] = useState("Bishkek");
  const [search, setSearch] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadWeather(latitude, longitude, cityName) {
    setLoading(true);
    setError("");

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

      const response = await fetch(url);

      if (!response.ok) throw new Error("Ошибка загрузки погоды");

      const data = await response.json();

      setWeather({
        city: cityName,
        temp: Math.round(data.current.temperature_2m),
        feels: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        wind: data.current.wind_speed_10m,
        rain: data.current.precipitation,
        code: data.current.weather_code,
      });

      setForecast(
        data.daily.time.slice(1, 6).map((day, index) => ({
          date: day,
          code: data.daily.weather_code[index + 1],
          max: Math.round(data.daily.temperature_2m_max[index + 1]),
          min: Math.round(data.daily.temperature_2m_min[index + 1]),
        }))
      );
    } catch (err) {
      setError("Не удалось загрузить погоду. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function searchCity(e) {
    e.preventDefault();

    if (!search.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=1&language=ru&format=json`
      );

      const data = await response.json();

      if (!data.results?.length) {
        throw new Error("Город не найден");
      }

      const result = data.results[0];

      setCity(result.name);
      setSearch("");

      await loadWeather(
        result.latitude,
        result.longitude,
        result.name
      );
    } catch (err) {
      setError("Город не найден. Проверь название.");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather(42.8746, 74.5698, "Бишкек");
  }, []);

  const [icon, description] = weather
    ? getWeather(weather.code)
    : ["🌤️", "Загрузка"];

  return (
    <div className="app">
      <header className="navbar">
        <h2>☁️ Weather<span>Cat</span></h2>
        <p>Погода в твоём городе</p>
      </header>

      <main className="container">

        <form className="search" onSubmit={searchCity}>
          <input
            type="text"
            placeholder="🔍 Введи название города..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Найти</button>
        </form>

        {error && <p className="error">{error}</p>}

        {loading && <h2 className="loading">Загрузка погоды...</h2>}

        {weather && !loading && (
          <>
            <section className="hero">
              <div>
                <p className="small">СЕЙЧАС В ГОРОДЕ</p>
                <h1>{weather.city}</h1>
                <p className="description">{description}</p>
              </div>

              <div className="weather-icon">{icon}</div>

              <div className="temperature">
                {weather.temp}°
              </div>

              <p className="feels">
                Ощущается как {weather.feels}°
              </p>
            </section>

            <h2 className="section-title">Показатели погоды</h2>

            <section className="cards">
              <div className="card">
                <span>💧</span>
                <p>Влажность</p>
                <h2>{weather.humidity}%</h2>
              </div>

              <div className="card">
                <span>💨</span>
                <p>Ветер</p>
                <h2>{weather.wind} км/ч</h2>
              </div>

              <div className="card">
                <span>🌧️</span>
                <p>Осадки</p>
                <h2>{weather.rain} мм</h2>
              </div>
            </section>

            <h2 className="section-title">Прогноз на 5 дней</h2>

            <section className="forecast">
              {forecast.map((day) => {
                const [dayIcon, dayText] = getWeather(day.code);

                return (
                  <div className="forecast-card" key={day.date}>
                    <p>
                      {new Date(day.date + "T12:00:00")
                        .toLocaleDateString("ru-RU", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                    </p>
                    <span>{dayIcon}</span>
                    <p>{dayText}</p>
                    <h3>
                      {day.max}° / {day.min}°
                    </h3>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>

      <footer>
        <p>🐈‍⬛ WeatherCat | Created by Baymyrza</p>
        <p>Powered by Open-Meteo API</p>
      </footer>
    </div>
  );
}
