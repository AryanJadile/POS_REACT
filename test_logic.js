
const testLogic = (total) => {
    console.log(`Testing for Total: ${total}`);
    const suggestions = [
        Math.ceil(total / 10) * 10,
        Math.ceil(total / 100) * 100,
        500,
        2000
    ]
        .reduce((acc, curr) => {
            if (!acc.includes(curr) && curr >= total) acc.push(curr);
            return acc;
        }, [])
        .sort((a, b) => a - b)
        .slice(0, 4);

    console.log("Suggestions:", suggestions);
    console.log("---");
}

testLogic(42);
testLogic(98);
testLogic(450);
testLogic(1200);
testLogic(2500);
testLogic(1234);
