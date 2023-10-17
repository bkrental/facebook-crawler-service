import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

export const getParameterValue = async (name, defaultValue = "") => {
    const client = new SSMClient({ region: "ap-southeast-2" });
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