const express = require('express');
const bodyParser = require('body-parser');
const { processOpticsData } = require('./opticsProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.post('/process', (req, res) => {
    const sceneData = req.body;
    try {
        const processedData = processOpticsData(sceneData);
        res.json(processedData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process optics data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});