:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --bg-color: #f8f9fa;
    --text-color: #333;
}

body {
    font-family: 'Sarabun', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    margin: 0;
    padding: 20px;
    display: flex;
    justify-content: center;
}

.container {
    max-width: 600px;
    width: 100%;
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

header {
    text-align: center;
    border-bottom: 2px solid #eee;
    padding-bottom: 20px;
    margin-bottom: 20px;
}

header h1 {
    color: var(--primary-color);
    margin: 0 0 10px 0;
    font-size: 24px;
}

.search-box {
    margin-bottom: 25px;
}

.search-box label {
    font-weight: 600;
    display: block;
    margin-bottom: 8px;
}

.search-box input {
    width: 100%;
    padding: 12px;
    font-size: 18px;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
    font-family: 'Sarabun', sans-serif;
    transition: border-color 0.3s;
}

.search-box input:focus {
    border-color: var(--secondary-color);
    outline: none;
}

.result-box {
    text-align: center;
    background: #eaf2f8;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.result-display {
    font-size: 36px;
    font-weight: bold;
    color: var(--secondary-color);
    margin-top: 10px;
}

.guide {
    font-size: 14px;
    color: #666;
    background: #fff3cd;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #ffc107;
}

footer {
    text-align: center;
    margin-top: 30px;
    font-size: 12px;
    color: #999;
}