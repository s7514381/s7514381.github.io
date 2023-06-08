function DeepClone(model) {
    return JSON.parse(JSON.stringify(model));
}

async function getIpClient() {
    let result;
    try {
        result = await axios.get('https://api.ipify.org?format=json');
    } catch (error) {
        console.error(error);
    }
    return result;
}