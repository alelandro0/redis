const express = require("express");
const axios = require("axios");
const responseTime = require("response-time");
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient({
    host: 'localhost',
    port: 6379,
});

const app = express();

app.use(responseTime());

const getAsync = promisify(client.get).bind(client);
const setexAsync = promisify(client.setex).bind(client);

app.get("/character", async (req, res) => {
    try {
        const cachedData = await getAsync('character');
        if (cachedData) {
            console.log("Datos obtenidos de Redis");
            res.json(JSON.parse(cachedData));
        } else {
            const data = await fetchDataFromExternalAPI();
            await setexAsync('character', 3600, JSON.stringify(data));
            console.log("Datos obtenidos de la API externa");
            res.json(data);
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

async function fetchDataFromExternalAPI() {
    try {
        const response = await axios.get("https://fakestoreapi.com/products");
        return response.data;
    } catch (error) {
        console.error("Error al obtener datos de la API externa:", error);
        throw error; // Re-lanza el error para que sea manejado por el controlador
    }
}

app.listen(3000, () => {
    console.log("Servidor en funcionamiento en el puerto 3000");
});
