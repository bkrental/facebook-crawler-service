const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const getParameterValue = async (name, defaultValue = "") => {
    const client = new SSMClient({ region: "ap-southeast-1" });
    const input = { Name: name, WithDecryption: true };
    try {
        const command = new GetParameterCommand(input);
        const response = await client.send(command);
        return response?.Parameter.Value ?? "";
    } catch (error) {
        console.warn(`WARNING: SSM-${error.name}. Using default value`);
        return defaultValue;
    }
};

module.exports = getParameterValue;
